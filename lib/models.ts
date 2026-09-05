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

// --- Заявки клиентов ---

export interface Order {
  id: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  address: string;
  comment?: string;
  createdAt: string;
}

export type OrderInput = Omit<Order, "id" | "createdAt">;

export async function createOrder(data: OrderInput): Promise<Order> {
  const order: Order = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await docClient.send(
    new PutCommand({ TableName: TableName.SITE_ORDERS, Item: order })
  );
  return order;
}

export async function getAllOrders(): Promise<Order[]> {
  const result = await docClient.send(
    new ScanCommand({ TableName: TableName.SITE_ORDERS })
  );
  return (result.Items as Order[]) ?? [];
}

export async function deleteOrder(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TableName.SITE_ORDERS,
      Key: { id },
    })
  );
}
