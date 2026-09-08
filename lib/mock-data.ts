// Мок-данные для статического режима (без БД)
// Используются когда USE_DATABASE=false или БД недоступна

import { Order, Service, Visit } from "./models";
import {
  DEFAULT_ABOUT,
  DEFAULT_BENEFITS,
  DEFAULT_CONTACTS,
  DEFAULT_TESTIMONIALS,
  getDefaultServices,
} from "./site-content";

export const mockServices: Service[] = [
  {
    id: "mock-service-1",
    name: "API Gateway",
    description: "Шлюз для микросервисной архитектуры",
    status: "active",
    url: "https://api.example.com",
    createdAt: new Date("2024-01-15").toISOString(),
    updatedAt: new Date("2024-01-15").toISOString(),
  },
  {
    id: "mock-service-2",
    name: "Auth Service",
    description: "Сервис аутентификации и авторизации",
    status: "active",
    url: "https://auth.example.com",
    createdAt: new Date("2024-02-01").toISOString(),
    updatedAt: new Date("2024-02-01").toISOString(),
  },
  {
    id: "mock-service-3",
    name: "ML Pipeline",
    description: "Пайплайн для обработки данных с AI",
    status: "deploying",
    url: undefined,
    createdAt: new Date("2024-03-10").toISOString(),
    updatedAt: new Date("2024-03-10").toISOString(),
  },
];

export const mockSiteServices = getDefaultServices();

export const mockSiteContent = {
  contacts: DEFAULT_CONTACTS,
  about: DEFAULT_ABOUT,
  benefits: DEFAULT_BENEFITS,
  testimonials: DEFAULT_TESTIMONIALS,
};

export const mockOrders: Order[] = [
  {
    id: "mock-order-1",
    name: "Азиза Каримова",
    phone: "+998 90 123-45-67",
    service: "Генеральная уборка квартиры",
    date: "2026-09-10",
    time: "10:00",
    address: "Ташкент, ул. Амира Темура, 15, кв. 12",
    comment: "Желательно два сотрудника, есть маленькие дети.",
    orderStatus: "order",
    createdAt: new Date("2026-09-01T08:30:00Z").toISOString(),
  },
  {
    id: "mock-order-2",
    name: "Игорь Смирнов",
    phone: "+998 93 375-27-02",
    service: "Химчистка дивана",
    date: "2026-09-12",
    time: "14:00",
    address: "Ташкент, Юнусабадский р-н, ул. Богишамол, 8",
    comment: "",
    orderStatus: "application",
    createdAt: new Date("2026-09-02T12:10:00Z").toISOString(),
  },
];

export const mockVisits: Visit[] = [
  {
    id: "mock-visit-1",
    visitorId: "mock-visitor-1",
    path: "/",
    referrer: "",
    isNewVisitor: true,
    date: "2026-09-01",
    createdAt: new Date("2026-09-01T08:00:00Z").toISOString(),
  },
  {
    id: "mock-visit-2",
    visitorId: "mock-visitor-1",
    path: "/#services",
    referrer: "https://www.instagram.com/biouborka.uz",
    isNewVisitor: false,
    date: "2026-09-02",
    createdAt: new Date("2026-09-02T09:15:00Z").toISOString(),
  },
  {
    id: "mock-visit-3",
    visitorId: "mock-visitor-2",
    path: "/",
    referrer: "https://t.me/biouborka_uz",
    isNewVisitor: true,
    date: "2026-09-03",
    createdAt: new Date("2026-09-03T14:45:00Z").toISOString(),
  },
];
