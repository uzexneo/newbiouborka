import {
  DEFAULT_CONTACTS,
  DEFAULT_TESTIMONIALS,
  getDefaultServices,
} from "./site-content";

export const SCHEMA_APP_NAME = "BIOUBORKA.UZ";
export const SCHEMA_APP_URL = "https://biouborka.uz";
const SCHEMA_IMAGE = `${SCHEMA_APP_URL}/assets/hero-cleaning.png`;

interface FaqItem {
  question: string;
  answer: string;
}

const DEFAULT_FAQ: FaqItem[] = [
  {
    question: "Что такое биоуборка и чем она отличается от обычной уборки?",
    answer:
      "Биоуборка — это профессиональная уборка с использованием экологичных, сертифицированных и полностью биоразлагаемых средств. Мы не используем хлор, агрессивные щёлочи и синтетические отдушки, поэтому уборка безопасна для здоровья людей и домашних питомцев.",
  },
  {
    question: "Сколько стоит уборка квартиры в Ташкенте?",
    answer:
      "Генеральная уборка — от 25 000 сум за квадратный метр. Итоговая стоимость зависит от площади, степени загрязнения и набора услуг. Точную цену менеджер назовёт после короткого описания ваших задач.",
  },
  {
    question: "Какие услуги вы предоставляете?",
    answer:
      "Мы выполняем уборку квартир и офисов, уборку после ремонта, мойку окон и фасадов, химчистку ковров, мягкой и кожаной мебели, матрацев, уход за полами, а также дезинфекцию, устранение запахов и плесени.",
  },
  {
    question: "Безопасна ли уборка для детей и аллергиков?",
    answer:
      "Да. Мы используем только био-средства без агрессивной химии, поэтому уборка безопасна для детей, аллергиков и домашних животных.",
  },
  {
    question: "Как быстро вы приедете?",
    answer:
      "В большинстве случаев мы можем приехать в день обращения или на следующий день. Позвоните нам или оставьте заявку, и мы подберём удобное время.",
  },
  {
    question: "Как записаться на уборку?",
    answer:
      "Оставьте заявку через форму на сайте, позвоните по телефону или напишите нам в Instagram или Telegram. Мы свяжемся с вами для уточнения деталей и удобного времени визита.",
  },
];

export interface SchemaOrgJsonLd {
  "@context": string;
  "@graph": unknown[];
}

function buildReviews() {
  return DEFAULT_TESTIMONIALS.map((t) => ({
    "@type": "Review",
    author: { "@type": "Person", name: t.name },
    reviewRating: {
      "@type": "Rating",
      ratingValue: t.rating,
      bestRating: 5,
    },
    reviewBody: t.text,
  }));
}

function buildAggregateRating() {
  if (DEFAULT_TESTIMONIALS.length === 0) return undefined;
  const average =
    DEFAULT_TESTIMONIALS.reduce((sum, t) => sum + t.rating, 0) /
    DEFAULT_TESTIMONIALS.length;
  return {
    "@type": "AggregateRating",
    ratingValue: Number(average.toFixed(1)),
    bestRating: 5,
    reviewCount: DEFAULT_TESTIMONIALS.length,
  };
}

function buildOffers() {
  return getDefaultServices().map((service) => ({
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name: service.name,
      category: service.categoryTitle,
      url: `${SCHEMA_APP_URL}/#${service.id}`,
      areaServed: "Ташкент",
    },
    priceSpecification: {
      "@type": "PriceSpecification",
      price: service.price,
      priceCurrency: "UZS",
    },
  }));
}

function buildLocalBusiness() {
  return {
    "@type": "LocalBusiness",
    "@id": `${SCHEMA_APP_URL}/#organization`,
    name: SCHEMA_APP_NAME,
    url: SCHEMA_APP_URL,
    image: SCHEMA_IMAGE,
    logo: `${SCHEMA_APP_URL}/assets/logo.png`,
    telephone: DEFAULT_CONTACTS.phone,
    priceRange: "от 25 000 сум",
    description:
      "Профессиональная экологичная уборка квартир и домов в Ташкенте. Био-средства, химчистка мебели и ковров, уборка после ремонта. Безопасно для здоровья.",
    address: {
      "@type": "PostalAddress",
      streetAddress: DEFAULT_CONTACTS.address,
      addressLocality: "Ташкент",
      addressRegion: "Ташкент",
      addressCountry: "UZ",
    },
    areaServed: "Ташкент",
    openingHours: "Mo-Su 09:00-21:00",
    sameAs: [DEFAULT_CONTACTS.instagram, DEFAULT_CONTACTS.telegram],
    makesOffer: buildOffers(),
    aggregateRating: buildAggregateRating(),
    review: buildReviews(),
  };
}

function buildFaq() {
  return DEFAULT_FAQ.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  }));
}

export function getSchemaOrgJsonLd(): SchemaOrgJsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildLocalBusiness(),
      {
        "@type": "FAQPage",
        mainEntity: buildFaq(),
      },
    ],
  };
}
