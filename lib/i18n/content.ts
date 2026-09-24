import type { LucideIcon } from "lucide-react";
import { ShieldCheck, Wind, Sparkles, Heart, Users, Award } from "lucide-react";
import type { TranslationKey } from "./translations";

export interface ServiceItemMeta {
  id: string;
  titleKey: TranslationKey;
  priceKey: TranslationKey;
}

export interface ServiceCategoryMeta {
  id: string;
  icon: string;
  titleKey: TranslationKey;
  noteKey: TranslationKey;
  procedureKey: TranslationKey;
  photo: string;
  services: ServiceItemMeta[];
}

export const SERVICE_CATEGORIES: ServiceCategoryMeta[] = [
  {
    id: "cleaning",
    icon: "Home",
    titleKey: "services.c0.title",
    noteKey: "services.c0.note",
    procedureKey: "services.c0.proc",
    photo: "/assets/photo_102@03-08-2026_09-58-07.webp",
    services: [
      {
        id: "cleaning-general",
        titleKey: "services.c0.i0.title",
        priceKey: "services.c0.i0.price",
      },
      {
        id: "cleaning-disinfection",
        titleKey: "services.c0.i1.title",
        priceKey: "services.c0.i1.price",
      },
      {
        id: "cleaning-renovation",
        titleKey: "services.c0.i2.title",
        priceKey: "services.c0.i2.price",
      },
      {
        id: "cleaning-fire",
        titleKey: "services.c0.i3.title",
        priceKey: "services.c0.i3.price",
      },
      {
        id: "cleaning-office",
        titleKey: "services.c0.i4.title",
        priceKey: "services.c0.i4.price",
      },
      {
        id: "cleaning-territory",
        titleKey: "services.c0.i5.title",
        priceKey: "services.c0.i5.price",
      },
    ],
  },
  {
    id: "windows",
    icon: "Droplets",
    titleKey: "services.c1.title",
    noteKey: "services.c1.note",
    procedureKey: "services.c1.proc",
    photo: "/assets/photo_231@03-08-2026_10-01-02.webp",
    services: [
      {
        id: "windows-windows",
        titleKey: "services.c1.i0.title",
        priceKey: "services.c1.i0.price",
      },
      {
        id: "windows-balconies",
        titleKey: "services.c1.i1.title",
        priceKey: "services.c1.i1.price",
      },
      {
        id: "windows-facades",
        titleKey: "services.c1.i2.title",
        priceKey: "services.c1.i2.price",
      },
      {
        id: "windows-alpinism",
        titleKey: "services.c1.i3.title",
        priceKey: "services.c1.i3.price",
      },
      {
        id: "windows-roofs",
        titleKey: "services.c1.i4.title",
        priceKey: "services.c1.i4.price",
      },
    ],
  },
  {
    id: "carpets",
    icon: "Layers",
    titleKey: "services.c2.title",
    noteKey: "services.c2.note",
    procedureKey: "services.c2.proc",
    photo: "/assets/photo_147@03-08-2026_09-59-36.webp",
    services: [
      {
        id: "carpets-home",
        titleKey: "services.c2.i0.title",
        priceKey: "services.c2.i0.price",
      },
      {
        id: "carpets-covering",
        titleKey: "services.c2.i1.title",
        priceKey: "services.c2.i1.price",
      },
    ],
  },
  {
    id: "furniture",
    icon: "Sofa",
    titleKey: "services.c3.title",
    noteKey: "services.c3.note",
    procedureKey: "services.c3.proc",
    photo: "/assets/photo_138@03-08-2026_09-59-36.webp",
    services: [
      {
        id: "furniture-sofa",
        titleKey: "services.c3.i0.title",
        priceKey: "services.c3.i0.price",
      },
      {
        id: "furniture-armchair",
        titleKey: "services.c3.i1.title",
        priceKey: "services.c3.i1.price",
      },
      {
        id: "furniture-office-chair",
        titleKey: "services.c3.i2.title",
        priceKey: "services.c3.i2.price",
      },
    ],
  },
  {
    id: "mattresses",
    icon: "BedDouble",
    titleKey: "services.c4.title",
    noteKey: "services.c4.note",
    procedureKey: "services.c4.proc",
    photo: "/assets/photo_191@03-08-2026_09-59-37.webp",
    services: [
      {
        id: "mattresses-single",
        titleKey: "services.c4.i0.title",
        priceKey: "services.c4.i0.price",
      },
      {
        id: "mattresses-double",
        titleKey: "services.c4.i1.title",
        priceKey: "services.c4.i1.price",
      },
    ],
  },
  {
    id: "leather",
    icon: "Armchair",
    titleKey: "services.c5.title",
    noteKey: "services.c5.note",
    procedureKey: "services.c5.proc",
    photo: "/assets/photo_216@03-08-2026_09-59-37.webp",
    services: [
      {
        id: "leather-sofa",
        titleKey: "services.c5.i0.title",
        priceKey: "services.c5.i0.price",
      },
      {
        id: "leather-armchair",
        titleKey: "services.c5.i1.title",
        priceKey: "services.c5.i1.price",
      },
      {
        id: "leather-chairs",
        titleKey: "services.c5.i2.title",
        priceKey: "services.c5.i2.price",
      },
    ],
  },
  {
    id: "floors",
    icon: "Brush",
    titleKey: "services.c6.title",
    noteKey: "services.c6.note",
    procedureKey: "services.c6.proc",
    photo: "/assets/photo_125@03-08-2026_09-59-36.webp",
    services: [
      {
        id: "floors-cleaning",
        titleKey: "services.c6.i0.title",
        priceKey: "services.c6.i0.price",
      },
      {
        id: "floors-protection",
        titleKey: "services.c6.i1.title",
        priceKey: "services.c6.i1.price",
      },
      {
        id: "floors-polishing",
        titleKey: "services.c6.i2.title",
        priceKey: "services.c6.i2.price",
      },
    ],
  },
  {
    id: "kitchen",
    icon: "CookingPot",
    titleKey: "services.c7.title",
    noteKey: "services.c7.note",
    procedureKey: "services.c7.proc",
    photo: "/assets/photo_110@03-08-2026_09-58-07.webp",
    services: [
      {
        id: "kitchen-stove",
        titleKey: "services.c7.i0.title",
        priceKey: "services.c7.i0.price",
      },
      {
        id: "kitchen-fridge",
        titleKey: "services.c7.i1.title",
        priceKey: "services.c7.i1.price",
      },
      {
        id: "kitchen-equipment",
        titleKey: "services.c7.i2.title",
        priceKey: "services.c7.i2.price",
      },
      {
        id: "kitchen-general",
        titleKey: "services.c7.i3.title",
        priceKey: "services.c7.i3.price",
      },
    ],
  },
  {
    id: "other",
    icon: "Sparkles",
    titleKey: "services.c8.title",
    noteKey: "services.c8.note",
    procedureKey: "services.c8.proc",
    photo: "/assets/photo_233@03-08-2026_10-01-02.webp",
    services: [
      {
        id: "other-disinfection",
        titleKey: "services.c8.i0.title",
        priceKey: "services.c8.i0.price",
      },
      {
        id: "other-odors",
        titleKey: "services.c8.i1.title",
        priceKey: "services.c8.i1.price",
      },
      {
        id: "other-mold",
        titleKey: "services.c8.i2.title",
        priceKey: "services.c8.i2.price",
      },
      {
        id: "other-night",
        titleKey: "services.c8.i3.title",
        priceKey: "services.c8.i3.price",
      },
      {
        id: "other-soil",
        titleKey: "services.c8.i4.title",
        priceKey: "services.c8.i4.price",
      },
    ],
  },
];

export const ALL_SERVICES: ServiceItemMeta[] = SERVICE_CATEGORIES.flatMap(
  (category) => category.services
);

export interface ServicePageFaqMeta {
  qKey: TranslationKey;
  aKey: TranslationKey;
}

export interface ServicePageMeta {
  slug: string;
  categoryId: string;
  h1Key: TranslationKey;
  seoTitleKey: TranslationKey;
  seoDescKey: TranslationKey;
  introKey: TranslationKey;
  faq: ServicePageFaqMeta[];
}

export const SERVICE_PAGES: ServicePageMeta[] = [
  {
    slug: "uborka",
    categoryId: "cleaning",
    h1Key: "uslugi.uborka.h1",
    seoTitleKey: "uslugi.uborka.seoTitle",
    seoDescKey: "uslugi.uborka.seoDesc",
    introKey: "uslugi.uborka.intro",
    faq: [
      { qKey: "uslugi.uborka.faq1q", aKey: "uslugi.uborka.faq1a" },
      { qKey: "uslugi.uborka.faq2q", aKey: "uslugi.uborka.faq2a" },
      { qKey: "uslugi.uborka.faq3q", aKey: "uslugi.uborka.faq3a" },
    ],
  },
  {
    slug: "moyka-okon",
    categoryId: "windows",
    h1Key: "uslugi.moyka-okon.h1",
    seoTitleKey: "uslugi.moyka-okon.seoTitle",
    seoDescKey: "uslugi.moyka-okon.seoDesc",
    introKey: "uslugi.moyka-okon.intro",
    faq: [
      { qKey: "uslugi.moyka-okon.faq1q", aKey: "uslugi.moyka-okon.faq1a" },
      { qKey: "uslugi.moyka-okon.faq2q", aKey: "uslugi.moyka-okon.faq2a" },
      { qKey: "uslugi.moyka-okon.faq3q", aKey: "uslugi.moyka-okon.faq3a" },
    ],
  },
  {
    slug: "ximchistka-kovrov",
    categoryId: "carpets",
    h1Key: "uslugi.ximchistka-kovrov.h1",
    seoTitleKey: "uslugi.ximchistka-kovrov.seoTitle",
    seoDescKey: "uslugi.ximchistka-kovrov.seoDesc",
    introKey: "uslugi.ximchistka-kovrov.intro",
    faq: [
      {
        qKey: "uslugi.ximchistka-kovrov.faq1q",
        aKey: "uslugi.ximchistka-kovrov.faq1a",
      },
      {
        qKey: "uslugi.ximchistka-kovrov.faq2q",
        aKey: "uslugi.ximchistka-kovrov.faq2a",
      },
      {
        qKey: "uslugi.ximchistka-kovrov.faq3q",
        aKey: "uslugi.ximchistka-kovrov.faq3a",
      },
    ],
  },
  {
    slug: "ximchistka-myagkoy-mebeli",
    categoryId: "furniture",
    h1Key: "uslugi.ximchistka-myagkoy-mebeli.h1",
    seoTitleKey: "uslugi.ximchistka-myagkoy-mebeli.seoTitle",
    seoDescKey: "uslugi.ximchistka-myagkoy-mebeli.seoDesc",
    introKey: "uslugi.ximchistka-myagkoy-mebeli.intro",
    faq: [
      {
        qKey: "uslugi.ximchistka-myagkoy-mebeli.faq1q",
        aKey: "uslugi.ximchistka-myagkoy-mebeli.faq1a",
      },
      {
        qKey: "uslugi.ximchistka-myagkoy-mebeli.faq2q",
        aKey: "uslugi.ximchistka-myagkoy-mebeli.faq2a",
      },
      {
        qKey: "uslugi.ximchistka-myagkoy-mebeli.faq3q",
        aKey: "uslugi.ximchistka-myagkoy-mebeli.faq3a",
      },
    ],
  },
  {
    slug: "ximchistka-matracev",
    categoryId: "mattresses",
    h1Key: "uslugi.ximchistka-matracev.h1",
    seoTitleKey: "uslugi.ximchistka-matracev.seoTitle",
    seoDescKey: "uslugi.ximchistka-matracev.seoDesc",
    introKey: "uslugi.ximchistka-matracev.intro",
    faq: [
      {
        qKey: "uslugi.ximchistka-matracev.faq1q",
        aKey: "uslugi.ximchistka-matracev.faq1a",
      },
      {
        qKey: "uslugi.ximchistka-matracev.faq2q",
        aKey: "uslugi.ximchistka-matracev.faq2a",
      },
      {
        qKey: "uslugi.ximchistka-matracev.faq3q",
        aKey: "uslugi.ximchistka-matracev.faq3a",
      },
    ],
  },
  {
    slug: "ximchistka-kozhanoy-mebeli",
    categoryId: "leather",
    h1Key: "uslugi.ximchistka-kozhanoy-mebeli.h1",
    seoTitleKey: "uslugi.ximchistka-kozhanoy-mebeli.seoTitle",
    seoDescKey: "uslugi.ximchistka-kozhanoy-mebeli.seoDesc",
    introKey: "uslugi.ximchistka-kozhanoy-mebeli.intro",
    faq: [
      {
        qKey: "uslugi.ximchistka-kozhanoy-mebeli.faq1q",
        aKey: "uslugi.ximchistka-kozhanoy-mebeli.faq1a",
      },
      {
        qKey: "uslugi.ximchistka-kozhanoy-mebeli.faq2q",
        aKey: "uslugi.ximchistka-kozhanoy-mebeli.faq2a",
      },
      {
        qKey: "uslugi.ximchistka-kozhanoy-mebeli.faq3q",
        aKey: "uslugi.ximchistka-kozhanoy-mebeli.faq3a",
      },
    ],
  },
  {
    slug: "uhod-za-polami",
    categoryId: "floors",
    h1Key: "uslugi.uhod-za-polami.h1",
    seoTitleKey: "uslugi.uhod-za-polami.seoTitle",
    seoDescKey: "uslugi.uhod-za-polami.seoDesc",
    introKey: "uslugi.uhod-za-polami.intro",
    faq: [
      {
        qKey: "uslugi.uhod-za-polami.faq1q",
        aKey: "uslugi.uhod-za-polami.faq1a",
      },
      {
        qKey: "uslugi.uhod-za-polami.faq2q",
        aKey: "uslugi.uhod-za-polami.faq2a",
      },
      {
        qKey: "uslugi.uhod-za-polami.faq3q",
        aKey: "uslugi.uhod-za-polami.faq3a",
      },
    ],
  },
  {
    slug: "kuhnya",
    categoryId: "kitchen",
    h1Key: "uslugi.kuhnya.h1",
    seoTitleKey: "uslugi.kuhnya.seoTitle",
    seoDescKey: "uslugi.kuhnya.seoDesc",
    introKey: "uslugi.kuhnya.intro",
    faq: [
      { qKey: "uslugi.kuhnya.faq1q", aKey: "uslugi.kuhnya.faq1a" },
      { qKey: "uslugi.kuhnya.faq2q", aKey: "uslugi.kuhnya.faq2a" },
      { qKey: "uslugi.kuhnya.faq3q", aKey: "uslugi.kuhnya.faq3a" },
    ],
  },
  {
    slug: "prochie-uslugi",
    categoryId: "other",
    h1Key: "uslugi.prochie-uslugi.h1",
    seoTitleKey: "uslugi.prochie-uslugi.seoTitle",
    seoDescKey: "uslugi.prochie-uslugi.seoDesc",
    introKey: "uslugi.prochie-uslugi.intro",
    faq: [
      {
        qKey: "uslugi.prochie-uslugi.faq1q",
        aKey: "uslugi.prochie-uslugi.faq1a",
      },
      {
        qKey: "uslugi.prochie-uslugi.faq2q",
        aKey: "uslugi.prochie-uslugi.faq2a",
      },
      {
        qKey: "uslugi.prochie-uslugi.faq3q",
        aKey: "uslugi.prochie-uslugi.faq3a",
      },
    ],
  },
];

export function getServicePageBySlug(
  slug: string
): ServicePageMeta | undefined {
  return SERVICE_PAGES.find((page) => page.slug === slug);
}

export function getServiceCategoryById(
  id: string
): ServiceCategoryMeta | undefined {
  return SERVICE_CATEGORIES.find((category) => category.id === id);
}

// Категории услуг, для которых администратор может загрузить фото процедуры
// в блоке «Как проходит процедура» (должны совпадать с id в SERVICE_CATEGORIES).
export const PROCEDURE_CATEGORY_IDS = [
  "cleaning",
  "windows",
  "carpets",
  "furniture",
  "mattresses",
  "leather",
  "floors",
  "kitchen",
  "other",
] as const;

export interface TextCardMeta {
  icon: LucideIcon;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}

export const BENEFITS: TextCardMeta[] = [
  {
    icon: ShieldCheck,
    titleKey: "benefits.0.title",
    descKey: "benefits.0.desc",
  },
  { icon: Wind, titleKey: "benefits.1.title", descKey: "benefits.1.desc" },
  {
    icon: Sparkles,
    titleKey: "benefits.2.title",
    descKey: "benefits.2.desc",
  },
];

export const VALUES: TextCardMeta[] = [
  { icon: Heart, titleKey: "values.0.title", descKey: "values.0.desc" },
  { icon: Users, titleKey: "values.1.title", descKey: "values.1.desc" },
  { icon: Award, titleKey: "values.2.title", descKey: "values.2.desc" },
];

export interface TestimonialMeta {
  nameKey: TranslationKey;
  locationKey: TranslationKey;
  textKey: TranslationKey;
  rating: number;
}

export const TESTIMONIALS: TestimonialMeta[] = [
  {
    nameKey: "testimonials.0.name",
    locationKey: "testimonials.0.location",
    textKey: "testimonials.0.text",
    rating: 5,
  },
  {
    nameKey: "testimonials.1.name",
    locationKey: "testimonials.1.location",
    textKey: "testimonials.1.text",
    rating: 5,
  },
  {
    nameKey: "testimonials.2.name",
    locationKey: "testimonials.2.location",
    textKey: "testimonials.2.text",
    rating: 5,
  },
  {
    nameKey: "testimonials.3.name",
    locationKey: "testimonials.3.location",
    textKey: "testimonials.3.text",
    rating: 4,
  },
];

export interface FaqMeta {
  questionKey: TranslationKey;
  answerKey: TranslationKey;
}

export const FAQ_ITEMS: FaqMeta[] = [
  { questionKey: "faq.q0", answerKey: "faq.a0" },
  { questionKey: "faq.q1", answerKey: "faq.a1" },
  { questionKey: "faq.q2", answerKey: "faq.a2" },
  { questionKey: "faq.q3", answerKey: "faq.a3" },
  { questionKey: "faq.q4", answerKey: "faq.a4" },
  { questionKey: "faq.q5", answerKey: "faq.a5" },
  { questionKey: "faq.q6", answerKey: "faq.a6" },
  { questionKey: "faq.q7", answerKey: "faq.a7" },
  { questionKey: "faq.q8", answerKey: "faq.a8" },
];

export function categoryKey(category: string): TranslationKey {
  switch (category) {
    case "apartment":
      return "gallery.apartment";
    case "furniture":
      return "gallery.furniture";
    case "office":
      return "gallery.office";
    case "after-renovation":
      return "gallery.after-renovation";
    default:
      return "gallery.all";
  }
}

export function galleryTitleKey(id: string): TranslationKey {
  return `gallery.${id}` as TranslationKey;
}
