const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { randomUUID } = require("node:crypto");
const { test } = require("node:test");
const ts = require("typescript");

// Synthetic in-memory SDK doubles only. No real endpoint, credentials or leads.
const root = path.resolve(__dirname, "..");
const plain = (value) => JSON.parse(JSON.stringify(value));
const sdkError = (name) =>
  Object.assign(new Error("Synthetic failure"), { name });
const response = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
});

function harness() {
  const state = {
    available: true,
    failVisitTable: false,
    failVisitPut: false,
    now: Date.parse("2026-10-25T18:59:59.900Z"),
  };
  const records = new Map();
  const calls = [];
  const tables = [];
  const logs = [];
  const classes = {};
  for (const name of [
    "GetCommand",
    "PutCommand",
    "DeleteCommand",
    "QueryCommand",
    "ScanCommand",
    "UpdateCommand",
  ])
    classes[name] = class {
      constructor(input) {
        this.input = input;
      }
    };
  const db = {
    isDatabaseAvailable: () => state.available,
    ensureSiteVisitsTable: async () => {
      tables.push("visits");
      if (state.failVisitTable) throw sdkError("ValidationException");
    },
    ensureSiteOrdersTable: async () => tables.push("orders"),
    ensureSiteContentTable: async () => {},
    ensureSiteServicesTable: async () => {},
    ensureSiteGalleryTable: async () => {},
    docClient: {
      send: async (command) => {
        calls.push(command);
        const input = command.input;
        const key = `${input.TableName}:${input.Item?.id ?? input.Key?.id}`;
        if (command instanceof classes.PutCommand) {
          if (state.failVisitPut && input.TableName === "site_visits")
            throw sdkError("ValidationException");
          if (
            input.ConditionExpression === "attribute_not_exists(id)" &&
            records.has(key)
          )
            throw sdkError("ConditionalCheckFailedException");
          records.set(key, plain(input.Item));
          return {};
        }
        if (command instanceof classes.GetCommand) {
          assert.equal(input.ConsistentRead, true);
          return {
            Item: records.has(key) ? plain(records.get(key)) : undefined,
          };
        }
        if (command instanceof classes.UpdateCommand) {
          // A missing conditional must fail the test before the fake can create
          // the placeholder row DynamoDB would create for an unconditional update.
          assert.equal(input.ConditionExpression, "attribute_exists(id)");
          if (!records.has(key))
            throw sdkError("ConditionalCheckFailedException");
          const updated = {
            ...records.get(key),
            [input.ExpressionAttributeNames["#quality"]]:
              input.ExpressionAttributeValues[":quality"],
          };
          records.set(key, updated);
          return { Attributes: plain(updated) };
        }
        throw new Error("Unexpected SDK operation in persistence test");
      },
    },
  };
  class Clock extends Date {
    constructor(...args) {
      super(...(args.length ? args : [state.now]));
    }
    static now() {
      return state.now;
    }
  }
  const overrides = {
    "./db": db,
    "@/lib/db": db,
    "@aws-sdk/lib-dynamodb": classes,
    "./i18n/content": { PROCEDURE_CATEGORY_IDS: [] },
    "./media-limits": { MAX_DATA_URL_CHARS: 100 },
    "next/server": {
      NextResponse: {
        json: (body, options = {}) => response(options.status ?? 200, body),
      },
    },
  };
  const cache = new Map();
  function load(relative) {
    const file = path.resolve(root, relative);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      fileName: file,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText;
    vm.runInNewContext(
      source,
      {
        module,
        exports: module.exports,
        require: (id) => {
          if (Object.hasOwn(overrides, id)) return overrides[id];
          if (id.startsWith("@/") || id.startsWith(".")) {
            const target = id.startsWith("@/")
              ? path.resolve(root, id.slice(2))
              : path.resolve(path.dirname(file), id);
            return load(/\.tsx?$/.test(target) ? target : target + ".ts");
          }
          return require(id);
        },
        Date: Clock,
        Error,
        crypto: { randomUUID },
        URL,
        URLSearchParams,
        AbortController,
        setTimeout,
        clearTimeout,
        console: { error: (...args) => logs.push(args), warn() {} },
      },
      { filename: file }
    );
    return module.exports;
  }
  const models = load("lib/models.ts");
  const post = load("app/api/visits/route.ts").POST;
  return {
    state,
    records,
    calls,
    tables,
    logs,
    classes,
    models,
    load,
    post: (body) => post({ json: async () => body }),
  };
}

function visitPayload() {
  return {
    visitId: randomUUID(),
    visitorId: "synthetic-browser",
    sessionId: randomUUID(),
    path: "/uslugi/uborka?gclid=synthetic-click&utm_source=google&utm_medium=cpc",
    referrer: "https://www.google.com/",
    isNewVisitor: true,
  };
}

test("visit API confirms the exact persisted record and sanitizes URL data", async () => {
  const h = harness();
  const input = visitPayload();
  const reply = await h.post({
    ...input,
    path: input.path + "&phone=private#private",
  });
  assert.equal(reply.status, 201);
  assert.deepEqual(plain(await reply.json()), {
    ok: true,
    saved: true,
    id: input.visitId,
    duplicate: false,
  });
  const saved = h.records.get(`site_visits:${input.visitId}`);
  assert.equal(saved.id, input.visitId);
  assert.equal(saved.sessionId, input.sessionId);
  assert.equal(saved.visitorId, input.visitorId);
  assert.equal(saved.path, input.path);
  assert.equal(saved.date, "2026-10-25");
  assert.equal(saved.visitId, undefined);
  assert.equal(h.records.size, 1);
});

test("lost confirmation retried across Tashkent midnight keeps one original visit", async () => {
  const h = harness();
  const input = visitPayload();
  const requests = [];
  let original;
  const helpers = h.load("lib/visit-tracking.ts");
  const saved = await helpers.submitVisitWithRetry(input, {
    fetcher: async (_url, options) => {
      requests.push(options.body);
      const reply = await h.post(JSON.parse(options.body));
      if (requests.length === 1) {
        assert.equal(reply.status, 201);
        original = plain(h.records.get(`site_visits:${input.visitId}`));
        h.state.now += 2000;
        throw sdkError("TimeoutError");
      }
      assert.equal(reply.status, 200);
      assert.equal((await reply.json()).duplicate, true);
      return reply;
    },
    wait: async () => {},
  });
  assert.equal(saved, true);
  assert.equal(requests.length, 2);
  assert.equal(requests[0], requests[1]);
  assert.deepEqual(h.records.get(`site_visits:${input.visitId}`), original);
  assert.equal(h.records.size, 1);
  assert.equal(
    h.records.get(`site_visits:${input.visitId}`).date,
    "2026-10-25"
  );
});

test("reused visit ID with a different session or payload returns 409 without overwrite", async () => {
  for (const changed of [
    { sessionId: randomUUID() },
    { visitorId: "different-browser" },
    { path: "/another-page" },
    { referrer: "https://another.test/" },
    { isNewVisitor: false },
  ]) {
    const h = harness();
    const input = visitPayload();
    await h.post(input);
    const original = plain(h.records.get(`site_visits:${input.visitId}`));
    const reply = await h.post({ ...input, ...changed });
    assert.equal(reply.status, 409);
    assert.equal((await reply.json()).saved, false);
    assert.deepEqual(h.records.get(`site_visits:${input.visitId}`), original);
    assert.equal(h.records.size, 1);
  }
});

test("unavailable DB, table preparation and failed PUT cannot claim a saved visit", async () => {
  for (const mode of ["available", "failVisitTable", "failVisitPut"]) {
    const h = harness();
    h.state[mode] = mode !== "available";
    const reply = await h.post(visitPayload());
    assert.equal(reply.status, 503);
    assert.notEqual((await reply.json()).saved, true);
    assert.equal(h.records.size, 0);
    if (mode === "failVisitTable") assert.equal(h.calls.length, 0);
    assert.equal(h.tables.includes("orders"), false);
  }
});

test("a lead persists its exact campaign and visit IDs with unreviewed quality", async () => {
  const h = harness();
  const input = visitPayload();
  await h.post(input);
  const attribution = {
    visitorId: input.visitorId,
    sessionId: input.sessionId,
    visitId: input.visitId,
    gclid: "synthetic-click",
    utm_source: "google",
    utm_medium: "cpc",
    landingUrl: "https://example.test/uslugi/uborka",
  };
  const result = await h.models.createOrder({
    name: "Synthetic lead",
    phone: "+998000000000",
    service: "cleaning",
    attribution,
  });
  assert.equal(result.saved, true);
  const saved = h.records.get(`site_orders:${result.order.id}`);
  assert.deepEqual(saved.attribution, attribution);
  assert.equal(saved.leadQuality, "unreviewed");
  assert.equal(saved.orderStatus, "application");
  assert.equal(h.records.size, 2);
  const match = h
    .load("lib/lead-reporting.ts")
    .matchLeadVisit(saved, h.records.get(`site_visits:${input.visitId}`));
  assert.equal(match.status, "matched");
});

test("failed visit recording does not block saving a lead or invent a visit match", async () => {
  const h = harness();
  h.state.failVisitPut = true;
  const input = visitPayload();
  const reply = await h.post(input);
  assert.equal(reply.status, 503);
  const attribution = {
    visitorId: input.visitorId,
    sessionId: input.sessionId,
    gclid: "synthetic-click",
  };
  const result = await h.models.createOrder({
    name: "Synthetic lead",
    phone: "+998000000000",
    service: "cleaning",
    attribution,
  });
  assert.equal(result.saved, true);
  assert.equal(h.records.size, 1);
  const saved = h.records.get(`site_orders:${result.order.id}`);
  assert.deepEqual(saved.attribution, attribution);
  assert.equal(saved.leadQuality, "unreviewed");
  assert.equal(
    h.load("lib/lead-reporting.ts").matchLeadVisit(saved, undefined).status,
    "unlinked"
  );
});

test("quality updates require an existing lead and preserve all other saved fields", async () => {
  const h = harness();
  const result = await h.models.createOrder({
    name: "Synthetic lead",
    phone: "+998000000000",
    service: "cleaning",
  });
  const original = plain(result.order);
  const updated = await h.models.updateOrderLeadQuality(
    result.order.id,
    "real"
  );
  assert.deepEqual(plain(updated), { ...original, leadQuality: "real" });
  await assert.rejects(h.models.updateOrderLeadQuality(randomUUID(), "real"), {
    name: "ConditionalCheckFailedException",
  });
  assert.equal(h.records.size, 1);
  assert.equal(
    h.records.get(`site_orders:${result.order.id}`).leadQuality,
    "real"
  );
});
