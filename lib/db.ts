import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { TableName, TABLE_SCHEMAS } from "./schema";

const globalForDb = globalThis as unknown as {
  docClient: DynamoDBDocumentClient | undefined;
};

function createDocClient() {
  const client = new DynamoDBClient({
    endpoint: process.env.DOCUMENT_API_ENDPOINT,
    region: process.env.DOCUMENT_API_REGION ?? "ru-central1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });

  return DynamoDBDocumentClient.from(client);
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

export function ensureSiteVisitsTable(): Promise<void> {
  if (!isDatabaseAvailable()) {
    return Promise.resolve();
  }

  const schema = TABLE_SCHEMAS[TableName.SITE_VISITS];

  const client = new DynamoDBClient({
    endpoint: process.env.DOCUMENT_API_ENDPOINT,
    region: process.env.DOCUMENT_API_REGION ?? "ru-central1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });

  return client
    .send(
      new CreateTableCommand({
        TableName: schema.name,
        KeySchema: schema.keySchema,
        AttributeDefinitions: schema.attributeDefinitions,
        BillingMode: "PAY_PER_REQUEST",
      })
    )
    .then(() => {
      console.info("[visits] Таблица site_visits создана автоматически");
    })
    .catch((error: unknown) => {
      const name =
        typeof error === "object" && error !== null && "name" in error
          ? (error as { name?: unknown }).name
          : undefined;

      if (name === "ResourceInUseException") {
        console.info("[visits] Таблица site_visits уже существует");
        return;
      }

      console.warn("[visits] Не удалось создать таблицу site_visits:", error);
    })
    .finally(() => client.destroy());
}
