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

function daysFromTodayUTC(days: number): string {
  const today = new Date().toISOString().split("T")[0];
  const d = new Date(today + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

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
    date: daysFromTodayUTC(2),
    time: "10:00",
    address: "Ташкент, ул. Амира Темура, 15, кв. 12",
    comment: "Желательно два сотрудника, есть маленькие дети.",
    orderStatus: "order",
    createdAt: `${daysFromTodayUTC(-7)}T08:30:00Z`,
  },
  {
    id: "mock-order-2",
    name: "Игорь Смирнов",
    phone: "+998 93 375-27-02",
    service: "Химчистка дивана",
    date: daysFromTodayUTC(4),
    time: "14:00",
    address: "Ташкент, Юнусабадский р-н, ул. Богишамол, 8",
    comment: "",
    orderStatus: "application",
    createdAt: `${daysFromTodayUTC(-6)}T12:10:00Z`,
  },
];

export const mockVisits: Visit[] = [
  {
    id: "mock-visit-1",
    visitorId: "mock-visitor-1",
    path: "/",
    referrer: "",
    isNewVisitor: true,
    date: daysFromTodayUTC(-7),
    createdAt: `${daysFromTodayUTC(-7)}T08:00:00Z`,
  },
  {
    id: "mock-visit-2",
    visitorId: "mock-visitor-1",
    path: "/#services",
    referrer: "https://www.instagram.com/biouborka.uz",
    isNewVisitor: false,
    date: daysFromTodayUTC(-6),
    createdAt: `${daysFromTodayUTC(-6)}T09:15:00Z`,
  },
  {
    id: "mock-visit-3",
    visitorId: "mock-visitor-2",
    path: "/",
    referrer: "https://t.me/biouborka_uz",
    isNewVisitor: true,
    date: daysFromTodayUTC(-5),
    createdAt: `${daysFromTodayUTC(-5)}T14:45:00Z`,
  },
];
