import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { TableName, TABLE_SCHEMAS } from "./schema";

// Таймауты для запросов к DynamoDB/Yandex Document API, чтобы запросы к
// админ-панели не зависали бесконечно при недоступной или медленной БД.
const DB_CONNECTION_TIMEOUT_MS = 5_000;
const DB_REQUEST_TIMEOUT_MS = 10_000;

const globalForDb = globalThis as unknown as {
  docClient: DynamoDBDocumentClient | undefined;
};

function dbClientConfig(): DynamoDBClientConfig {
  return {
    endpoint: process.env.DOCUMENT_API_ENDPOINT,
    region: process.env.DOCUMENT_API_REGION ?? "ru-central1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
    requestHandler: new NodeHttpHandler({
      connectionTimeout: DB_CONNECTION_TIMEOUT_MS,
      requestTimeout: DB_REQUEST_TIMEOUT_MS,
      throwOnRequestTimeout: true,
    }),
    maxAttempts: 2,
  };
}

function createDocClient() {
  const client = new DynamoDBClient(dbClientConfig());

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });
}

export const docClient = globalForDb.docClient ?? createDocClient();

if (process.env.NODE_ENV !== "production") globalForDb.docClient = docClient;

export function isDatabaseAvailable(): boolean {
  if (process.env.USE_DATABASE === "false") {
    return false;
  }

  return Boolean(
    process.env.DOCUMENT_API_ENDPOINT &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
}

const readyTables = new Map<TableName, Promise<void>>();

function errorName(error: unknown): unknown {
  return typeof error === "object" && error !== null && "name" in error
    ? error.name
    : undefined;
}

async function prepareTable(tableName: TableName): Promise<void> {
  if (!isDatabaseAvailable()) {
    throw new Error("Подключение к базе данных не настроено");
  }
  const schema = TABLE_SCHEMAS[tableName];
  const client = new DynamoDBClient(dbClientConfig());
  try {
    try {
      const result = await client.send(
        new DescribeTableCommand({ TableName: schema.name })
      );
      if (result.Table?.TableStatus === "ACTIVE") {
        return;
      }
    } catch (error: unknown) {
      if (errorName(error) !== "ResourceNotFoundException") throw error;
      try {
        await client.send(
          new CreateTableCommand({
            TableName: schema.name,
            KeySchema: schema.keySchema,
            AttributeDefinitions: schema.attributeDefinitions,
            BillingMode: "PAY_PER_REQUEST",
          })
        );
      } catch (createError: unknown) {
        if (errorName(createError) !== "ResourceInUseException") throw createError;
      }
    }
    await waitUntilTableExists(
      { client, maxWaitTime: 20, minDelay: 1, maxDelay: 2 },
      { TableName: schema.name }
    );
  } finally {
    client.destroy();
  }
}

function ensureTable(tableName: TableName): Promise<void> {
  const existing = readyTables.get(tableName);
  if (existing) return existing;
  const preparation = prepareTable(tableName).catch((error: unknown) => {
    readyTables.delete(tableName);
    throw error;
  });
  readyTables.set(tableName, preparation);
  return preparation;
}

export function ensureSiteOrdersTable(): Promise<void> {
  return ensureTable(TableName.SITE_ORDERS);
}

export function ensureSiteContentTable(): Promise<void> {
  return ensureTable(TableName.SITE_CONTENT);
}

export function ensureSiteVisitsTable(): Promise<void> {
  return ensureTable(TableName.SITE_VISITS);
}

export function ensureSiteServicesTable(): Promise<void> {
  return ensureTable(TableName.SITE_SERVICES);
}

export function ensureSiteGalleryTable(): Promise<void> {
  return ensureTable(TableName.SITE_GALLERY);
}
