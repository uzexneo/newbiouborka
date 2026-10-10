const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

// Use the existing TypeScript dependency without spawning a test worker or
// adding a DOM library. This suite covers data selection, not browser effects.
const compile = (source, fileName) =>
  ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
require.extensions[".ts"] = (module, fileName) => {
  module._compile(
    compile(fs.readFileSync(fileName, "utf8"), fileName),
    fileName
  );
};

const { SERVICE_CATEGORIES } = require("../lib/i18n/content.ts");
const { dictionaries } = require("../lib/i18n/translations.ts");
const { localizeSiteServices } = require("../lib/i18n/site-content.ts");
const content = require("../lib/site-content.ts");
const { galleryItems } = require("../lib/gallery-data.ts");
const defaults = content.getDefaultServices();

function providerValue(dynamic, locale = "ru") {
  const fileName = path.join(__dirname, "../lib/site-content-provider.tsx");
  const exports = {};
  let stateIndex = 0;
  const react = {
    createContext: () => ({ Provider: "content-provider" }),
    useContext: () => {
      throw new Error("Unexpected useContext in selection test");
    },
    useEffect: () => {},
    useState: () => [stateIndex++ === 0 ? dynamic : true, () => {}],
  };
  const modules = {
    react,
    "react/jsx-runtime": require("react/jsx-runtime"),
    "@/lib/i18n/language-provider": {
      useLanguage: () => ({ locale, t: (key) => dictionaries[locale][key] }),
    },
    "@/lib/i18n/site-content": { localizeSiteServices },
    "@/lib/i18n/content": require("../lib/i18n/content.ts"),
    "@/lib/gallery-data": { galleryItems },
    "@/lib/site-content": content,
  };
  vm.runInNewContext(
    compile(fs.readFileSync(fileName, "utf8"), fileName),
    {
      exports,
      require: (id) => {
        if (!(id in modules))
          throw new Error(`Unexpected provider dependency: ${id}`);
        return modules[id];
      },
    },
    { filename: fileName }
  );
  return exports.SiteContentProvider({ children: null }).props.value;
}

test("all known default services translate by ID without changing prices", () => {
  for (const locale of ["uzKrill", "uzLatin"]) {
    const localized = localizeSiteServices(defaults, locale);
    for (const service of localized) {
      const category = SERVICE_CATEGORIES.find(
        (entry) => entry.id === service.categoryId
      );
      const item = category.services.find((entry) => entry.id === service.id);
      assert.equal(
        service.categoryTitle,
        dictionaries[locale][category.titleKey],
        service.id
      );
      assert.equal(
        service.name,
        dictionaries[locale][item.titleKey],
        service.id
      );
      const original = defaults.find((entry) => entry.id === service.id);
      if (original.price === dictionaries.ru[item.priceKey]) {
        assert.equal(
          service.price,
          dictionaries[locale][item.priceKey],
          service.id
        );
      } else {
        assert.equal(service.id, "furniture-office-chair");
        assert.equal(
          service.price,
          locale === "uzLatin" ? "25 000 so'm" : "25 000 сўм"
        );
        assert.equal(service.price.includes("40 000"), false);
      }
    }
  }
});

test("changed numeric prices translate the units and keep the saved amount", () => {
  const service = { ...defaults[0], price: "37 500 сум/м²" };
  assert.equal(
    localizeSiteServices([service], "uzLatin")[0].price,
    "37 500 so'm/m²"
  );
  assert.equal(
    localizeSiteServices([service], "uzKrill")[0].price,
    "37 500 сўм/м²"
  );
  assert.equal(
    localizeSiteServices([{ ...service, price: "0 сум/м²" }], "uzLatin")[0]
      .price,
    "0 so'm/m²"
  );
});

test("custom service names, categories and price wording remain exactly saved", () => {
  const service = {
    ...defaults[0],
    categoryTitle: "Авторская категория",
    name: "Особенная уборка",
    price: "По индивидуальной смете",
  };
  const unknown = {
    ...service,
    id: "custom-service",
    categoryId: "custom-category",
    price: "$25 за час",
  };
  for (const locale of ["ru", "uzKrill", "uzLatin"]) {
    assert.deepEqual(localizeSiteServices([service, unknown], locale), [
      service,
      unknown,
    ]);
  }
});

test("localization does not mutate source records or revive an empty service list", () => {
  const saved = structuredClone(defaults);
  const snapshot = structuredClone(saved);
  localizeSiteServices(saved, "uzLatin");
  assert.deepEqual(saved, snapshot);
  assert.deepEqual(localizeSiteServices([], "uzLatin"), []);
  assert.deepEqual(content.groupServicesByCategory([]), []);
});

test("provider preserves explicitly empty collections in every language", () => {
  for (const locale of ["ru", "uzKrill", "uzLatin"]) {
    const value = providerValue(
      { services: [], gallery: [], benefits: [], testimonials: [] },
      locale
    );
    assert.equal(value.services.length, 0);
    assert.equal(value.gallery.length, 0);
    assert.equal(value.benefits.length, 0, `benefits: ${locale}`);
    assert.equal(value.testimonials.length, 0, `testimonials: ${locale}`);
  }
});

test("provider uses translated defaults only for null or unavailable content", () => {
  for (const locale of ["ru", "uzKrill", "uzLatin"]) {
    const value = providerValue(null, locale);
    const services = value.services.flatMap((category) => category.services);
    assert.equal(services.length, defaults.length);
    assert.equal(
      services[0].name,
      dictionaries[locale]["services.c0.i0.title"]
    );
    assert.equal(value.gallery.length, galleryItems.length);
  }
});

test("provider exposes saved prices and custom names on localized service pages", () => {
  const saved = [
    { ...defaults[0], name: "Авторская уборка", price: "45 000 сум/м²" },
  ];
  for (const locale of ["uzKrill", "uzLatin"]) {
    const service = providerValue({ services: saved }, locale).services[0]
      .services[0];
    assert.equal(service.name, "Авторская уборка");
    assert.match(service.price, /^45 000 /);
    assert.equal(service.price.includes("25 000"), false);
  }
});

test("Russian admin text is applied to RU and cannot overwrite Uzbek translations", () => {
  const saved = {
    about: { p1: "Свой текст", p2: "", p3: "" },
    benefits: [{ title: "Своя выгода", desc: "Описание" }],
    testimonials: [
      { name: "Клиент", location: "Место", text: "Отзыв", rating: 5 },
    ],
  };
  const ru = providerValue(saved);
  assert.deepEqual(ru.about, saved.about);
  assert.deepEqual(ru.benefits, saved.benefits);
  assert.deepEqual(ru.testimonials, saved.testimonials);
  for (const locale of ["uzKrill", "uzLatin"]) {
    const value = providerValue(saved, locale);
    assert.equal(value.about.p1, dictionaries[locale]["about.p1"]);
    assert.notEqual(value.benefits[0].title, saved.benefits[0].title);
    assert.notEqual(value.testimonials[0].text, saved.testimonials[0].text);
  }
});
