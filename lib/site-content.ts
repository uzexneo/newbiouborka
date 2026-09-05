// Типы и дефолтный (русскоязычный) контент сайта.
// Динамический контент хранится в DynamoDB (site_services, site_content);
// эти значения используются как стартовые данные и фолбэк при недоступности БД.

import type { GalleryItem } from "./gallery-data";

export const DEFAULT_BACKGROUND = "/assets/hero-cleaning.png";

export interface SiteService {
  id: string;
  categoryId: string;
  categoryTitle: string;
  name: string;
  price: string;
  sortOrder: number;
}

export interface SiteCategory {
  id: string;
  title: string;
  services: SiteService[];
}

export interface SiteContacts {
  phone: string;
  instagram: string;
  telegram: string;
  email: string;
}

export interface SiteAbout {
  p1: string;
  p2: string;
  p3: string;
}

export interface SiteBenefit {
  title: string;
  desc: string;
}

export interface SiteTestimonial {
  name: string;
  location: string;
  text: string;
  rating: number;
}

export interface PublicContent {
  services: SiteService[] | null;
  contacts: SiteContacts | null;
  about: SiteAbout | null;
  benefits: SiteBenefit[] | null;
  testimonials: SiteTestimonial[] | null;
  gallery: GalleryItem[] | null;
  background: string | null;
}

export const DEFAULT_CONTACTS: SiteContacts = {
  phone: "+998 93 375 27 02",
  instagram: "https://www.instagram.com/biouborka.uz",
  telegram: "https://t.me/biouborka_uz",
  email: "info@biouborka.uz",
};

export const DEFAULT_ABOUT: SiteAbout = {
  p1: "BIOUBORKA.UZ — профессиональный сервис экологичной уборки в Ташкенте. Мы объединили многолетний опыт клининга с современными био-технологиями, чтобы предложить вам чистоту без компромиссов для здоровья.",
  p2: "Все наши средства имеют сертификаты безопасности и полностью биоразлагаемы. Мы принципиально не используем хлор, агрессивные щёлочи и синтетические отдушки — только эффективные ферментные и растительные составы.",
  p3: "Наша цель — сделать ваш дом не просто чистым, а по-настоящему безопасным для вас, ваших детей и домашних питомцев.",
};

export const DEFAULT_BENEFITS: SiteBenefit[] = [
  {
    title: "Безопасные средства",
    desc: "Только сертифицированные био-средства без хлора и агрессивной химии.",
  },
  {
    title: "Гипоаллергенно",
    desc: "Уборка безопасна для детей, аллергиков и домашних питомцев.",
  },
  {
    title: "Глубокое очищение",
    desc: "Профессиональный подход к чистоте в каждом уголке вашего дома.",
  },
];

export const DEFAULT_TESTIMONIALS: SiteTestimonial[] = [
  {
    name: "Анна",
    location: "Чиланзарский район",
    text: "Заказала генеральную уборку после ремонта. Ребята приехали вовремя, всё сделали идеально. Даже окна помыли до блеска! Очень довольна.",
    rating: 5,
  },
  {
    name: "Сергей",
    location: "Мирабадский район",
    text: "Давно искал экологичную уборку в Ташкенте. Никакой химии, всё пахнет свежестью. У меня аллергия, и после уборки ни разу не чихнул. Рекомендую!",
    rating: 5,
  },
  {
    name: "Марина",
    location: "Юнусабадский район",
    text: "Заказывала химчистку дивана. Пятна от кофе и вина — всё вывели. Диван как новый! Цена адекватная, приехали прямо на дом.",
    rating: 5,
  },
  {
    name: "Дмитрий",
    location: "Шайхантахурский район",
    text: "Пользуюсь услугами уже три месяца — поддерживающая уборка раз в неделю. Всегда чисто, аккуратно, без напоминаний.",
    rating: 4,
  },
];

export interface DefaultCategoryInput {
  id: string;
  title: string;
  services: { id: string; name: string; price: string }[];
}

const DEFAULT_CATEGORIES: DefaultCategoryInput[] = [
  {
    id: "cleaning",
    title: "Уборка",
    services: [
      {
        id: "cleaning-general",
        name: "Генеральная уборка",
        price: "25 000 сум/м²",
      },
      {
        id: "cleaning-disinfection",
        name: "Уборка после дезинфекции",
        price: "от 30 000 сум/м²",
      },
      {
        id: "cleaning-renovation",
        name: "Уборка после ремонта",
        price: "от 25 000 сум/м²",
      },
      {
        id: "cleaning-fire",
        name: "Уборка после пожара",
        price: "от 35 000 сум/м²",
      },
      { id: "cleaning-office", name: "Уборка офисов", price: "по договору" },
      {
        id: "cleaning-territory",
        name: "Уборка прилегающей территории",
        price: "по договору",
      },
    ],
  },
  {
    id: "windows",
    title: "Мойка окон, витражей и фасадов",
    services: [
      { id: "windows-windows", name: "Мойка окон", price: "25 000 сум/м²" },
      {
        id: "windows-balconies",
        name: "Мойка балконов и витражей",
        price: "от 20 000 сум/м²",
      },
      {
        id: "windows-facades",
        name: "Мойка фасадов",
        price: "от 20 000 сум/м²",
      },
      {
        id: "windows-alpinism",
        name: "Промышленный альпинизм",
        price: "от 30 000 сум/м²",
      },
      { id: "windows-roofs", name: "Уборка крыш", price: "по договору" },
    ],
  },
  {
    id: "carpets",
    title: "Химчистка ковров",
    services: [
      {
        id: "carpets-home",
        name: "Химчистка ковров на дому",
        price: "25 000 сум/м²",
      },
      {
        id: "carpets-covering",
        name: "Химчистка ковровых покрытий",
        price: "25 000 сум/м²",
      },
    ],
  },
  {
    id: "furniture",
    title: "Химчистка мягкой мебели",
    services: [
      {
        id: "furniture-sofa",
        name: "Химчистка дивана",
        price: "100 000 сум за посадочное место",
      },
      {
        id: "furniture-armchair",
        name: "Химчистка кресла",
        price: "от 100 000 сум",
      },
      {
        id: "furniture-office-chair",
        name: "Химчистка офисного стула",
        price: "70 000 сум",
      },
    ],
  },
  {
    id: "mattresses",
    title: "Химчистка матрацев",
    services: [
      {
        id: "mattresses-single",
        name: "Односпальный матрац",
        price: "300 000 сум с двух сторон",
      },
      {
        id: "mattresses-double",
        name: "Двуспальный матрац",
        price: "600 000 сум с двух сторон",
      },
    ],
  },
  {
    id: "leather",
    title: "Химчистка кожаной мебели",
    services: [
      {
        id: "leather-sofa",
        name: "Химчистка кожаного дивана",
        price: "от 400 000 сум",
      },
      {
        id: "leather-armchair",
        name: "Химчистка кожаного кресла",
        price: "от 150 000 сум",
      },
      {
        id: "leather-chairs",
        name: "Химчистка кожаных стульев",
        price: "от 25 000 сум",
      },
    ],
  },
  {
    id: "floors",
    title: "Уход за полами",
    services: [
      {
        id: "floors-cleaning",
        name: "Глубокая очистка полов",
        price: "по договору",
      },
      {
        id: "floors-protection",
        name: "Защитные покрытия",
        price: "по договору",
      },
      {
        id: "floors-polishing",
        name: "Полировка мрамора и гранита",
        price: "по договору",
      },
    ],
  },
  {
    id: "kitchen",
    title: "Кухня",
    services: [
      { id: "kitchen-stove", name: "Чистка плиты", price: "100 000 сум" },
      {
        id: "kitchen-fridge",
        name: "Чистка холодильника",
        price: "100 000 сум",
      },
      {
        id: "kitchen-equipment",
        name: "Чистка кухонного оборудования",
        price: "100 000 сум",
      },
      {
        id: "kitchen-general",
        name: "Генеральная уборка кухни",
        price: "700 000 сум",
      },
    ],
  },
  {
    id: "other",
    title: "Прочие услуги",
    services: [
      { id: "other-disinfection", name: "Дезинфекция", price: "по договору" },
      { id: "other-odors", name: "Устранение запахов", price: "по договору" },
      { id: "other-mold", name: "Устранение плесени", price: "по договору" },
      { id: "other-night", name: "Ночные услуги", price: "по договору" },
      {
        id: "other-soil",
        name: "Доплата за сильную загрязнённость",
        price: "по договору",
      },
    ],
  },
];

let defaultServicesCache: SiteService[] | null = null;

export function getDefaultServices(): SiteService[] {
  if (!defaultServicesCache) {
    let index = 0;
    defaultServicesCache = DEFAULT_CATEGORIES.flatMap((category) =>
      category.services.map((service) => ({
        id: service.id,
        categoryId: category.id,
        categoryTitle: category.title,
        name: service.name,
        price: service.price,
        sortOrder: index++,
      }))
    );
  }
  return defaultServicesCache;
}

export function groupServicesByCategory(
  services: SiteService[]
): SiteCategory[] {
  const map = new Map<string, SiteCategory>();
  for (const service of services) {
    const key = service.categoryId || service.categoryTitle || "other";
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        title: service.categoryTitle || key,
        services: [],
      });
    }
    map.get(key)!.services.push(service);
  }
  return Array.from(map.values()).map((category) => ({
    ...category,
    services: [...category.services].sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}
