const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

// Isolated SDK doubles: these tests cannot access a database or real credentials.
const root = path.resolve(__dirname, "..");
function harness(send = async () => ({ Table: activeTable() }), waiter) {
  const calls = [];
  let destroyed = 0;
  class DescribeTableCommand {
    constructor(input) {
      this.input = input;
    }
  }
  class CreateTableCommand {
    constructor(input) {
      this.input = input;
    }
  }
  class DynamoDBClient {
    async send(command) {
      calls.push(command);
      return send(command, calls);
    }
    destroy() {
      destroyed++;
    }
  }
  const overrides = {
    "@aws-sdk/client-dynamodb": {
      DynamoDBClient,
      DescribeTableCommand,
      CreateTableCommand,
      waitUntilTableExists: async (...args) => waiter?.(...args),
    },
    "@aws-sdk/lib-dynamodb": {
      DynamoDBDocumentClient: { from: () => ({}) },
    },
    "@smithy/node-http-handler": { NodeHttpHandler: class {} },
  };
  const cache = new Map();
  function load(relative) {
    const fileName = path.resolve(root, relative);
    if (cache.has(fileName)) return cache.get(fileName).exports;
    const module = { exports: {} };
    cache.set(fileName, module);
    const source = ts.transpileModule(fs.readFileSync(fileName, "utf8"), {
      fileName,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText;
    vm.runInNewContext(
      source,
      {
        module,
        exports: module.exports,
        require: (id) => {
          if (Object.hasOwn(overrides, id)) return overrides[id];
          if (id.startsWith("."))
            return load(path.resolve(path.dirname(fileName), id) + ".ts");
          throw new Error(`Unexpected test dependency: ${id}`);
        },
        process: {
          env: {
            NODE_ENV: "production",
            DOCUMENT_API_ENDPOINT: "https://synthetic.invalid",
            AWS_ACCESS_KEY_ID: "synthetic",
            AWS_SECRET_ACCESS_KEY: "synthetic",
          },
        },
        Error,
      },
      { filename: fileName }
    );
    return module.exports;
  }
  return {
    db: load("lib/db.ts"),
    diagnostics: load("lib/database-diagnostics.ts"),
    calls,
    get destroyed() {
      return destroyed;
    },
    DescribeTableCommand,
    CreateTableCommand,
  };
}

function activeTable() {
  return {
    TableStatus: "ACTIVE",
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
  };
}
function sdkError(name, message = "synthetic") {
  return Object.assign(new Error(message), { name });
}

test("matching active visit table is described once and never recreated", async () => {
  const h = harness();
  const first = h.db.ensureSiteVisitsTable();
  const second = h.db.ensureSiteVisitsTable();
  assert.equal(first, second);
  await Promise.all([first, second]);
  await h.db.ensureSiteVisitsTable();
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0] instanceof h.DescribeTableCommand, true);
  assert.equal(h.destroyed, 1);
});

test("wrong visit key name, type, range key and absent schema fail without mutation", async () => {
  for (const table of [
    {
      ...activeTable(),
      KeySchema: [{ AttributeName: "other", KeyType: "HASH" }],
    },
    {
      ...activeTable(),
      AttributeDefinitions: [{ AttributeName: "id", AttributeType: "N" }],
    },
    {
      ...activeTable(),
      KeySchema: [
        ...activeTable().KeySchema,
        { AttributeName: "date", KeyType: "RANGE" },
      ],
    },
    { TableStatus: "ACTIVE" },
  ]) {
    const h = harness(async () => ({ Table: table }));
    await assert.rejects(h.db.ensureSiteVisitsTable(), (error) => {
      const detail = h.diagnostics.databaseErrorDetails(error, "put-visit");
      assert.equal(detail.operation, "validate-table");
      assert.equal(detail.reason, "key-schema-mismatch");
      return true;
    });
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0] instanceof h.DescribeTableCommand, true);
  }
});

test("missing visit table is created, awaited and schema checked", async () => {
  let waited = 0;
  const h = harness(
    async (command, calls) => {
      if (calls.length === 1) throw sdkError("ResourceNotFoundException");
      if (command instanceof h.CreateTableCommand) return {};
      return { Table: activeTable() };
    },
    async () => waited++
  );
  await h.db.ensureSiteVisitsTable();
  assert.equal(h.calls.length, 3);
  assert.equal(h.calls[1] instanceof h.CreateTableCommand, true);
  assert.equal(h.calls[1].input.BillingMode, "PAY_PER_REQUEST");
  assert.equal(waited, 1);
});

test("parallel table creation by another worker is accepted and checked", async () => {
  const h = harness(async (command, calls) => {
    if (calls.length === 1) throw sdkError("ResourceNotFoundException");
    if (command instanceof h.CreateTableCommand)
      throw sdkError("ResourceInUseException");
    return { Table: activeTable() };
  });
  await h.db.ensureSiteVisitsTable();
  assert.equal(h.calls.length, 3);
});

test("describe, create and waiter failures preserve their phase and permit later retry", async () => {
  for (const phase of ["describe-table", "create-table", "wait-for-table"]) {
    let failed = false;
    const h = harness(
      async (command) => {
        if (failed) return { Table: activeTable() };
        if (phase === "describe-table") {
          failed = true;
          throw sdkError("ValidationException", "key schema secret-value");
        }
        if (command instanceof h.DescribeTableCommand)
          throw sdkError("ResourceNotFoundException");
        if (phase === "create-table") {
          failed = true;
          throw sdkError("ValidationException", "unsupported synthetic value");
        }
        return {};
      },
      async () => {
        failed = true;
        throw sdkError("TimeoutError");
      }
    );
    await assert.rejects(h.db.ensureSiteVisitsTable(), (error) => {
      assert.equal(
        h.diagnostics.databaseErrorDetails(error, "put-visit").operation,
        phase
      );
      return true;
    });
    await h.db.ensureSiteVisitsTable();
    assert.equal(h.destroyed, 2);
  }
});

test("diagnostics emit only fixed reasons and bounded SDK metadata", () => {
  const h = harness();
  const error = sdkError(
    "ValidationException",
    "key schema mismatch: secret-payload https://private.invalid/token"
  );
  error.$metadata = {
    httpStatusCode: 400,
    requestId: "request-123",
    secret: "private",
  };
  error.Item = { phone: "private-phone" };
  const result = h.diagnostics.databaseErrorDetails(error, "put-visit");
  assert.equal(result.operation, "put-visit");
  assert.equal(result.reason, "key-schema-mismatch");
  assert.equal(result.requestId, "request-123");
  const serialized = JSON.stringify(result);
  assert.equal(/secret|private|payload|https/.test(serialized), false);
  error.$metadata = {
    httpStatusCode: Infinity,
    requestId: "https://private.invalid/token",
  };
  const rejected = h.diagnostics.databaseErrorDetails(error, "put-visit");
  assert.equal(rejected.requestId, undefined);
  assert.equal(rejected.httpStatus, undefined);
});
