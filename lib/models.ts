import { docClient } from "./db";
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { TableName, IndexName } from "./schema";

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
  const result = await docClient.send(
    new ScanCommand({ TableName: TableName.SITE_SERVICES })
  );
  return (result.Items as SiteService[]) ?? [];
}

export async function createSiteService(
  data: Omit<SiteService, "createdAt" | "updatedAt">
): Promise<SiteService> {
  const now = new Date().toISOString();
  const service: SiteService = { ...data, createdAt: now, updatedAt: now };
  await docClient.send(
    new PutCommand({ TableName: TableName.SITE_SERVICES, Item: service })
  );
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
      UpdateExpression: `set ${updateExpr.join(", ")}`,
      ExpressionAttributeValues: exprValues,
      ExpressionAttributeNames: exprNames,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes as SiteService;
}

export async function deleteSiteService(id: string): Promise<void> {
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
  const result = await docClient.send(
    new GetCommand({
      TableName: TableName.SITE_CONTENT,
      Key: { id },
    })
  );
  return (result.Item as SiteContentDoc) ?? null;
}

export async function putSiteContent(
  id: string,
  payload: Record<string, unknown>
): Promise<SiteContentDoc> {
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
  const result = await docClient.send(
    new ScanCommand({ TableName: TableName.SITE_GALLERY })
  );
  return (result.Items as GalleryPhoto[]) ?? [];
}

export async function createGalleryPhoto(
  data: Omit<GalleryPhoto, "createdAt">
): Promise<GalleryPhoto> {
  const photo: GalleryPhoto = { ...data, createdAt: new Date().toISOString() };
  await docClient.send(
    new PutCommand({ TableName: TableName.SITE_GALLERY, Item: photo })
  );
  return photo;
}

export async function deleteGalleryPhoto(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.SITE_GALLERY,
      Key: { id },
    })
  );
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
  await putSiteContent(`${PROCEDURE_PHOTO_PREFIX}${categoryId}`, { src });
}

export async function deleteProcedurePhoto(categoryId: string): Promise<void> {
  await deleteSiteContent(`${PROCEDURE_PHOTO_PREFIX}${categoryId}`);
}

export async function getAllProcedurePhotos(): Promise<Record<string, string>> {
  const result = await docClient.send(
    new ScanCommand({ TableName: TableName.SITE_CONTENT })
  );
  const photos: Record<string, string> = {};
  let legacyDoc: SiteContentDoc | null = null;

  for (const item of (result.Items ?? []) as SiteContentDoc[]) {
    if (item.id.startsWith(PROCEDURE_PHOTO_PREFIX)) {
      const categoryId = item.id.slice(PROCEDURE_PHOTO_PREFIX.length);
      const payload = item.payload as Record<string, unknown>;
      const src = typeof payload.src === "string" ? payload.src : "";
      if (categoryId && src) photos[categoryId] = src;
    } else if (item.id === LEGACY_PROCEDURE_PHOTOS_ID) {
      legacyDoc = item;
    }
  }

  // Миграция старого формата (одна запись со всеми фото) в новый: раскидываем
  // по отдельным записям и удаляем устаревший документ.
  if (legacyDoc) {
    const payload = legacyDoc.payload as Record<string, unknown>;
    const old = payload.photos as Record<string, unknown> | undefined;
    if (old && typeof old === "object") {
      for (const [categoryId, src] of Object.entries(old)) {
        if (typeof src === "string" && src && !photos[categoryId]) {
          await putProcedurePhoto(categoryId, src);
          photos[categoryId] = src;
        }
      }
    }
    // Legacy-документ больше не нужен: все фото либо перенесены, либо уже были
    // в новом формате. Удаляем его, чтобы он не занимал место при каждом Scan.
    await deleteSiteContent(LEGACY_PROCEDURE_PHOTOS_ID);
  }

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
  // Флаг реального сохранения в БД: false — заявка подтверждена пользователю,
  // но пока живёт только в памяти процесса (БД была недоступна при записи).
  saved?: boolean;
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
  saved: boolean;
}

// Буфер заявок, которые не удалось записать в DynamoDB/Yandex Document API.
// Позволяет не терять заявки: они подтверждаются пользователю, а в админ-панели
// всё равно отображаются (см. getAllOrders) до тех пор, пока база не поднимется.
// Ограничение по количеству защищает память процесса от неограниченного роста.
const UNSAVED_ORDERS_LIMIT = 100;
const unsavedOrders: Order[] = [];

export function getUnsavedOrders(): Order[] {
  return unsavedOrders.map((order) => ({ ...order, saved: false }));
}

function bufferUnsavedOrder(order: Order): void {
  unsavedOrders.unshift({ ...order, saved: false });
  if (unsavedOrders.length > UNSAVED_ORDERS_LIMIT) {
    unsavedOrders.length = UNSAVED_ORDERS_LIMIT;
  }
}

function removeUnsavedOrder(id: string): void {
  const index = unsavedOrders.findIndex((order) => order.id === id);
  if (index !== -1) unsavedOrders.splice(index, 1);
}

// Дописывает в БД заявки из буфера, когда база снова доступна (вызывается при
// чтении заявок админом). Успешно записанные заявки уходят из буфера.
async function flushUnsavedOrders(): Promise<void> {
  if (unsavedOrders.length === 0) return;
  const remaining: Order[] = [];
  for (const order of unsavedOrders) {
    const item: Record<string, unknown> = { ...order };
    // Служебный флаг saved не должен попадать в БД.
    delete item.saved;
    try {
      await docClient.send(
        new PutCommand({ TableName: TableName.SITE_ORDERS, Item: item })
      );
    } catch (error) {
      console.error(
        "[orders] Не удалось дописать буферную заявку в DynamoDB:",
        error
      );
      remaining.push(order);
    }
  }
  if (remaining.length !== unsavedOrders.length) {
    unsavedOrders.length = 0;
    unsavedOrders.push(...remaining);
  }
}

const ORDER_WRITE_ATTEMPTS = 2;

export async function createOrder(
  data: OrderInput
): Promise<CreateOrderResult> {
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
  for (let attempt = 1; attempt <= ORDER_WRITE_ATTEMPTS; attempt++) {
    try {
      await docClient.send(
        new PutCommand({ TableName: TableName.SITE_ORDERS, Item: order })
      );
      return { order, saved: true };
    } catch (error) {
      // Ретраимся на случай кратковременного сбоя сети/БД. Логируем каждую
      // попытку, чтобы по логам было видно проблему с сохранением.
      console.error(
        `[orders] Попытка ${attempt}/${ORDER_WRITE_ATTEMPTS} сохранения заявки в DynamoDB не удалась:`,
        error
      );
    }
  }
  // Если записать в БД так и не удалось — не теряем заявку: держим её в памяти,
  // чтобы администратор увидел её в разделе «Заявки клиентов».
  bufferUnsavedOrder(order);
  return { order, saved: false };
}

export async function getAllOrders(): Promise<Order[]> {
  const result = await docClient.send(
    new ScanCommand({ TableName: TableName.SITE_ORDERS })
  );
  const dbOrders = (result.Items as Order[]) ?? [];
  // Если БД снова доступна — дописываем буферные заявки, чтобы они не
  // потерялись после перезапуска процесса.
  await flushUnsavedOrders();
  // Объединяем сохранённые в БД заявки с буфером несохранённых, чтобы даже при
  // частичном сбое записи админ видел все реальные обращения клиентов.
  const byId = new Map<string, Order>();
  for (const order of [...getUnsavedOrders(), ...dbOrders]) {
    byId.set(
      order.id,
      order.saved === undefined ? { ...order, saved: true } : order
    );
  }
  return Array.from(byId.values());
}

export async function updateOrderStatus(
  id: string,
  orderStatus: OrderStatus
): Promise<Order> {
  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TableName.SITE_ORDERS,
        Key: { id },
        UpdateExpression: "set #orderStatus = :orderStatus",
        ExpressionAttributeNames: { "#orderStatus": "orderStatus" },
        ExpressionAttributeValues: { ":orderStatus": orderStatus },
        ReturnValues: "ALL_NEW",
      })
    );
    return result.Attributes as Order;
  } catch (error) {
    // Заявка могла быть не сохранена в БД (буфер) — обновляем её в памяти.
    const index = unsavedOrders.findIndex((order) => order.id === id);
    if (index !== -1) {
      unsavedOrders[index] = { ...unsavedOrders[index], orderStatus };
      return unsavedOrders[index];
    }
    throw error;
  }
}

export async function deleteOrder(id: string): Promise<void> {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: TableName.SITE_ORDERS,
        Key: { id },
      })
    );
  } finally {
    removeUnsavedOrder(id);
  }
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
  const result = await docClient.send(
    new ScanCommand({ TableName: TableName.SITE_VISITS })
  );
  return (result.Items as Visit[]) ?? [];
}

export async function deleteVisit(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.SITE_VISITS,
      Key: { id },
    })
  );
}
