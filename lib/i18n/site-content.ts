import { SERVICE_CATEGORIES } from "./content";
import { dictionaries, type TranslationKey } from "./translations";
import { getDefaultServices, type SiteService } from "../site-content";
import type { Locale } from "./config";

const defaultServicesById = new Map(
  getDefaultServices().map((service) => [service.id, service])
);

function translatedCompactPrice(price: string, locale: Locale): string {
  const compact = /^(\d(?:[\d \u00a0\u202f]*\d)?) сум(\/м²)?$/.exec(price);
  if (!compact) return price;
  const currency = locale === "uzLatin" ? "so'm" : "сўм";
  const unit = compact[2] ? (locale === "uzLatin" ? "/m²" : "/м²") : "";
  return `${compact[1]} ${currency}${unit}`;
}

function translatedPrice(
  price: string,
  key: TranslationKey,
  locale: Locale
): string {
  const original = dictionaries.ru[key];
  const translated = dictionaries[locale][key];
  if (price === original) return translated;
  const numbers = price.match(/\d(?:[\d ]*\d)?/g) ?? [];
  const template = (value: string) => value.replace(/\d(?:[\d ]*\d)?/g, "#");
  if (
    template(price) !== template(original) ||
    numbers.length !== (translated.match(/\d(?:[\d ]*\d)?/g) ?? []).length
  ) {
    // Older saved prices can be shorter than the current dictionary wording.
    // Translate their units without appending prices that were never saved.
    return translatedCompactPrice(price, locale);
  }
  let index = 0;
  return translated.replace(/\d(?:[\d ]*\d)?/g, () => numbers[index++]);
}

// Keep saved prices and custom names. Known default labels use the selected
// language, so a Russian admin price list cannot replace all Uzbek labels.
export function localizeSiteServices(
  services: SiteService[],
  locale: Locale
): SiteService[] {
  if (locale === "ru") return services;
  return services.map((service) => {
    const category = SERVICE_CATEGORIES.find(
      (item) => item.id === service.categoryId
    );
    const item = category?.services.find((entry) => entry.id === service.id);
    const legacyDefault = defaultServicesById.get(service.id);
    const sameDefaultCategory =
      legacyDefault?.categoryId === service.categoryId;
    return {
      ...service,
      categoryTitle:
        category &&
        (service.categoryTitle === dictionaries.ru[category.titleKey] ||
          (sameDefaultCategory &&
            service.categoryTitle === legacyDefault?.categoryTitle))
          ? dictionaries[locale][category.titleKey]
          : service.categoryTitle,
      name:
        item &&
        (service.name === dictionaries.ru[item.titleKey] ||
          (sameDefaultCategory && service.name === legacyDefault?.name))
          ? dictionaries[locale][item.titleKey]
          : service.name,
      price: item
        ? translatedPrice(service.price, item.priceKey, locale)
        : service.price,
    };
  });
}
