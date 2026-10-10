import { docClient, ensureSiteOrdersTable, ensureSiteContentTable, ensureSiteServicesTable, ensureSiteGalleryTable } from "./db";
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { TableName, IndexName } from "./schema";
import { PROCEDURE_CATEGORY_IDS } from "./i18n/content";
import { MAX_DATA_URL_CHARS } from "./media-limits";

export interface Service {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive" | "deploying";
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getServiceById(id: string): Promise<Service | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.SERVICES,
      Key: { id },
    })
  );
  return (result.Item as Service) ?? null;
}

export async function getServicesByStatus(status: string): Promise<Service[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TableName.SERVICES,
      IndexName: IndexName.SERVICES_STATUS,
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
      },
    })
  );
  return (result.Items as Service[]) ?? [];
}

export async function getAllServices(): Promise<Service[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TableName.SERVICES,
    })
  );
  return (result.Items as Service[]) ?? [];
}

export async function createService(
  data: Omit<Service, "createdAt" | "updatedAt">
): Promise<Service> {
  const now = new Date().toISOString();
  const service: Service = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TableName.SERVICES,
      Item: service,
    })
  );

  return service;
}

export async function updateService(
  id: string,
  data: Partial<Pick<Service, "name" | "description" | "status" | "url">>
): Promise<Service> {
  const updateExpr = [];
  const exprValues: Record<string, unknown> = {};
  const exprNames: Record<string, string> = {};

  if (data.name !== undefined) {
    updateExpr.push("#name = :name");
    exprValues[":name"] = data.name;
    exprNames["#name"] = "name";
  }

  if (data.description !== undefined) {
    updateExpr.push("#description = :description");
    exprValues[":description"] = data.description;
    exprNames["#description"] = "description";
  }

  if (data.status !== undefined) {
    updateExpr.push("#status = :status");
    exprValues[":status"] = data.status;
    exprNames["#status"] = "status";
  }

  if (data.url !== undefined) {
    updateExpr.push("#url = :url");
    exprValues[":url"] = data.url;
    exprNames["#url"] = "url";
  }

  updateExpr.push("updatedAt = :updatedAt");
  exprValues[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TableName.SERVICES,
      Key: { id },
      UpdateExpression: `set ${updateExpr.join(", ")}`,
      ExpressionAttributeValues: exprValues,
      ExpressionAttributeNames:
        Object.keys(exprNames).length > 0 ? exprNames : undefined,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes as Service;
}

export async function deleteService(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.SERVICES,
      Key: { id },
    })
  );
}

// --- Содержимое сайта (услуги и контакты/тексты) ---

export interface SiteService {
  id: string;
  categoryId: string;
  categoryTitle: string;
  name: string;
  price: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type SiteContentId = "contacts" | "about" | "benefits" | "testimonials";

export interface SiteContentDoc {
  id: string;
  payload: Record<string, unknown>;
  updatedAt: string;
}

export async function getAllSiteServices(): Promise<SiteService[]> {
  await ensureSiteServicesTable();
  const services: SiteService[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(new ScanCommand({
      TableName: TableName.SITE_SERVICES, ConsistentRead: true, ExclusiveStartKey: lastKey,
    }));
    services.push(...((result.Items as SiteService[]) ?? []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  return services.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export async function createSiteService(
  data: Omit<SiteService, "createdAt" | "updatedAt">,
  onlyIfAbsent = false
): Promise<SiteService> {
  await ensureSiteServicesTable();
  const now = new Date().toISOString();
  const service: SiteService = { ...data, createdAt: now, updatedAt: now };
  try {
    await docClient.send(new PutCommand({
      TableName: TableName.SITE_SERVICES, Item: service,
      ConditionExpression: onlyIfAbsent ? "attribute_not_exists(id)" : undefined,
    }));
  } catch (error) {
    if (!onlyIfAbsent || !(error instanceof Error) || error.name !== "ConditionalCheckFailedException") throw error;
  }
  return service;
}

export async function updateSiteService(
  id: string,
  data: Partial<
    Pick<
      SiteService,
      "categoryId" | "categoryTitle" | "name" | "price" | "sortOrder"
    >
  >
): Promise<SiteService> {
  await ensureSiteServicesTable();
  const updateExpr: string[] = [];
  const exprValues: Record<string, unknown> = {};
  const exprNames: Record<string, string> = {};

  const setField = (field: string, value: unknown) => {
    const placeholder = `:${field}`;
    updateExpr.push(`#${field} = ${placeholder}`);
    exprValues[placeholder] = value;
    exprNames[`#${field}`] = field;
  };

  if (data.categoryId !== undefined) setField("categoryId", data.categoryId);
  if (data.categoryTitle !== undefined)
    setField("categoryTitle", data.categoryTitle);
  if (data.name !== undefined) setField("name", data.name);
  if (data.price !== undefined) setField("price", data.price);
  if (data.sortOrder !== undefined) setField("sortOrder", data.sortOrder);

  updateExpr.push("updatedAt = :updatedAt");
  exprValues[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TableName.SITE_SERVICES,
      Key: { id },
      ConditionExpression: "attribute_exists(id)",
      UpdateExpression: `set ${updateExpr.join(", ")}`,
      ExpressionAttributeValues: exprValues,
      ExpressionAttributeNames: exprNames,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes as SiteService;
}

export async function deleteSiteService(id: string): Promise<void> {
  await ensureSiteServicesTable();
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.SITE_SERVICES,
      Key: { id },
    })
  );
}

export async function getSiteContent(
  id: string
): Promise<SiteContentDoc | null> {
  await ensureSiteContentTable();
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.SITE_CONTENT,
      Key: { id },
      ConsistentRead: true,
    })
  );
  return (result.Item as SiteContentDoc) ?? null;
}

export async function putSiteContent(
  id: string,
  payload: Record<string, unknown>
): Promise<SiteContentDoc> {
  await ensureSiteContentTable();
  const doc: SiteContentDoc = {
    id,
    payload,
    updatedAt: new Date().toISOString(),
  };
  await docClient.send(
    new PutCommand({ TableName: TableName.SITE_CONTENT, Item: doc })
  );
  return doc;
}

export async function deleteSiteContent(id: string): Promise<void> {
  await ensureSiteContentTable();
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.SITE_CONTENT,
      Key: { id },
    })
  );
}

// --- Галерея портфолио (загруженные фото) ---

export interface GalleryPhoto {
  id: string;
  title: string;
  category: string;
  src: string;
  createdAt: string;
}

export async function getAllGalleryPhotos(): Promise<GalleryPhoto[]> {
  await ensureSiteGalleryTable();
  const photos: GalleryPhoto[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(new ScanCommand({
      TableName: TableName.SITE_GALLERY, ConsistentRead: true, ExclusiveStartKey: lastKey,
    }));
    photos.push(...((result.Items as GalleryPhoto[]) ?? []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  return photos.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
}

export async function createGalleryPhoto(
  data: Omit<GalleryPhoto, "createdAt">,
  onlyIfAbsent = false
): Promise<GalleryPhoto> {
  await ensureSiteGalleryTable();
  const photo: GalleryPhoto = { ...data, createdAt: new Date().toISOString() };
  try {
    await docClient.send(new PutCommand({
      TableName: TableName.SITE_GALLERY, Item: photo,
      ConditionExpression: onlyIfAbsent ? "attribute_not_exists(id)" : undefined,
    }));
  } catch (error) {
    if (!onlyIfAbsent || !(error instanceof Error) || error.name !== "ConditionalCheckFailedException") throw error;
  }
  return photo;
}

export async function deleteGalleryPhoto(id: string): Promise<void> {
  await ensureSiteGalleryTable();
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.SITE_GALLERY,
      Key: { id },
    })
  );
}

export async function isSiteCollectionInitialized(collection: "services" | "gallery"): Promise<boolean> {
  return Boolean((await getSiteContent(`collection:${collection}`))?.payload.initialized);
}

export async function markSiteCollectionInitialized(collection: "services" | "gallery"): Promise<void> {
  await putSiteContent(`collection:${collection}`, { initialized: true });
}

// --- Фото процедур (блок «Как проходит процедура») ---
// Каждое фото категории хранится отдельной записью site_content с id вида
// "procedurePhoto:<categoryId>". Так размер одной записи не упирается в лимит
// DynamoDB в 400 КБ (в старой схеме все фото лежали в одной записи и после
// двух-трёх загрузок сохранение падало).

const PROCEDURE_PHOTO_PREFIX = "procedurePhoto:";
const LEGACY_PROCEDURE_PHOTOS_ID = "procedurePhotos";

export async function putProcedurePhoto(
  categoryId: string,
  src: string
): Promise<void> {
  if (src.length > MAX_DATA_URL_CHARS) {
    throw new Error("IMAGE_TOO_LARGE");
  }
  await putSiteContent(`${PROCEDURE_PHOTO_PREFIX}${categoryId}`, { src });
}

export async function deleteProcedurePhoto(categoryId: string): Promise<void> {
  // Keep a reset marker so a legacy photo cannot reappear on the next read.
  await putSiteContent(`${PROCEDURE_PHOTO_PREFIX}${categoryId}`, { src: null });
}

export async function getAllProcedurePhotos(): Promise<Record<string, string>> {
  const ids = [
    LEGACY_PROCEDURE_PHOTOS_ID,
    ...PROCEDURE_CATEGORY_IDS.map((id) => `${PROCEDURE_PHOTO_PREFIX}${id}`),
  ];
  // A single Scan stops after 1 MiB and can omit several saved base64 photos.
  const docs = await Promise.all(
    ids.map(async (id) => {
      const result = await docClient.send(
        new GetCommand({
          TableName: TableName.SITE_CONTENT,
          Key: { id },
          ConsistentRead: true,
        })
      );
      return result.Item as SiteContentDoc | undefined;
    })
  );
  const photos: Record<string, string> = {};
  const legacy = docs[0]?.payload?.photos;
  const old = legacy && typeof legacy === "object" && !Array.isArray(legacy)
    ? legacy as Record<string, unknown>
    : {};

  PROCEDURE_CATEGORY_IDS.forEach((categoryId, index) => {
    const doc = docs[index + 1];
    // Reads never migrate or delete data. A current record, including a reset
    // marker, always takes priority over the legacy format.
    const src = doc ? doc.payload?.src : old[categoryId];
    if (typeof src === "string" && src) photos[categoryId] = src;
  });

  return photos;
}

// --- Заявки клиентов ---

export type OrderStatus = "application" | "order";

export interface Order {
  id: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  address: string;
  comment?: string;
  orderStatus?: OrderStatus;
  createdAt: string;
}

export type OrderInput = Omit<
  Order,
  "id" | "createdAt" | "orderStatus" | "date" | "time" | "address" | "comment"
> & {
  date?: string;
  time?: string;
  address?: string;
  comment?: string;
};

export interface CreateOrderResult {
  order: Order;
  saved: true;
}

export async function createOrder(
  data: OrderInput
): Promise<CreateOrderResult> {
  await ensureSiteOrdersTable();
  const order: Order = {
    ...data,
    date: data.date ?? "",
    time: data.time ?? "",
    address: data.address ?? "",
    comment: data.comment ?? "",
    orderStatus: "application",
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  // SDK повторяет временно неудачные запросы. Успех подтверждаем только после
  // завершения записи в постоянное хранилище; память Vercel не является очередью.
  await docClient.send(
    new PutCommand({ TableName: TableName.SITE_ORDERS, Item: order })
  );
  return { order, saved: true };
}

export async function getAllOrders(): Promise<Order[]> {
  await ensureSiteOrdersTable();
  const orders: Order[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TableName.SITE_ORDERS,
        ConsistentRead: true,
        ExclusiveStartKey: lastKey,
      })
    );
    orders.push(...((result.Items as Order[]) ?? []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  return orders;
}

export async function updateOrderStatus(
  id: string,
  orderStatus: OrderStatus
): Promise<Order> {
  await ensureSiteOrdersTable();
  const result = await docClient.send(
    new UpdateCommand({
      TableName: TableName.SITE_ORDERS,
      Key: { id },
      ConditionExpression: "attribute_exists(id)",
      UpdateExpression: "set #orderStatus = :orderStatus",
      ExpressionAttributeNames: { "#orderStatus": "orderStatus" },
      ExpressionAttributeValues: { ":orderStatus": orderStatus },
      ReturnValues: "ALL_NEW",
    })
  );
  return result.Attributes as Order;
}

export async function deleteOrder(id: string): Promise<void> {
  await ensureSiteOrdersTable();
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.SITE_ORDERS,
      Key: { id },
    })
  );
}

// --- Посещения (аналитика) ---

export interface Visit {
  id: string;
  visitorId: string;
  path: string;
  referrer?: string;
  isNewVisitor: boolean;
  date: string;
  createdAt: string;
}

export type VisitInput = Omit<Visit, "id" | "createdAt">;

export async function createVisit(data: VisitInput): Promise<Visit> {
  const visit: Visit = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await docClient.send(
    new PutCommand({ TableName: TableName.SITE_VISITS, Item: visit })
  );
  return visit;
}

export async function getAllVisits(): Promise<Visit[]> {
  let result = await docClient.send(
    new ScanCommand({ TableName: TableName.SITE_VISITS })
  );
  const visits = [...((result.Items as Visit[]) ?? [])];
  while (result.LastEvaluatedKey) {
    result = await docClient.send(
      new ScanCommand({
        TableName: TableName.SITE_VISITS,
        ExclusiveStartKey: result.LastEvaluatedKey,
      })
    );
    visits.push(...((result.Items as Visit[]) ?? []));
  }
  return visits;
}

export async function deleteVisit(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.SITE_VISITS,
      Key: { id },
    })
  );
}
