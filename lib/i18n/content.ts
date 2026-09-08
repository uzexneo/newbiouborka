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
  services: ServiceItemMeta[];
}

export const SERVICE_CATEGORIES: ServiceCategoryMeta[] = [
  {
    id: "cleaning",
    icon: "Home",
    titleKey: "services.c0.title",
    noteKey: "services.c0.note",
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
