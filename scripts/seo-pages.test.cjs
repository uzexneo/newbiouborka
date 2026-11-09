const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const modules = new Map();
function load(relative) {
  let file = path.resolve(root, relative);
  if (!path.extname(file)) file += ".ts";
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} };
  modules.set(file, module);
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
    fileName: file,
  }).outputText;
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    URL,
    URLSearchParams,
    require(id) {
      if (id === "lucide-react") return {};
      if (id.startsWith("@/")) return load(id.slice(2));
      if (id.startsWith("."))
        return load(path.relative(root, path.resolve(path.dirname(file), id)));
      throw new Error(`Unexpected dependency: ${id}`);
    },
  });
  return module.exports;
}
const pages = load("lib/cleaning-service-pages.ts");
const schema = load("lib/seo-jsonld.ts");
const { locales, localizeHref } = load("lib/i18n/config.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));

test("every cleaning landing is self-canonical and links to all versions of the same service", () => {
  const seen = new Set();
  for (const locale of locales)
    for (const slug of pages.CLEANING_SERVICE_SLUGS) {
      const metadata = pages.buildCleaningServiceMetadata(slug, locale);
      const url =
        "https://biouborka.uz" + pages.cleaningServicePath(slug, locale);
      assert.equal(metadata.alternates.canonical, url);
      assert.equal(seen.has(url), false);
      seen.add(url);
      assert.equal(Object.keys(metadata.alternates.languages).length, 4);
      for (const target of locales)
        assert.equal(
          localizeHref(pages.cleaningServicePath(slug, locale), target),
          pages.cleaningServicePath(slug, target)
        );
      const data = pages.getCleaningServicePage(slug, locale);
      assert.ok(
        data.heading && data.description && data.scope.length && data.faq.length
      );
      assert.equal(
        data.serviceId,
        slug === "generalnaya" ? "cleaning-general" : "cleaning-renovation"
      );
      assert.equal(Boolean(data.discount), slug === "generalnaya");
    }
  assert.equal(seen.size, 6);
  assert.equal(pages.isCleaningServiceSlug("not-a-service"), false);
});

test("sitemap advertises every new landing once without exposing admin routes", () => {
  const urls = load("app/sitemap.ts")
    .default()
    .map((item) => item.url);
  assert.equal(urls.length, new Set(urls).size);
  assert.equal(
    urls.some((url) => /\/admin|\/api\//.test(url)),
    false
  );
  for (const locale of locales)
    for (const slug of pages.CLEANING_SERVICE_SLUGS) {
      assert.equal(
        urls.filter(
          (url) =>
            url ===
            "https://biouborka.uz" + pages.cleaningServicePath(slug, locale)
        ).length,
        1
      );
    }
});

test("structured business data uses current public contacts and never fabricates prices or ratings", () => {
  const contacts = {
    phone: "+998 90 123 45 67",
    email: "public@example.test",
    address: "Confirmed street, 37",
    instagram: "",
    telegram: "",
  };
  const graph = schema.getSchemaOrgJsonLd("ru", { contacts })["@graph"];
  const business = graph.find((node) => node["@type"] === "LocalBusiness");
  assert.equal(business.telephone, "+998901234567");
  assert.equal(business.email, contacts.email);
  assert.equal(business.address.streetAddress, contacts.address);
  const withoutAddress = schema.getSchemaOrgJsonLd("ru", {
    contacts: { ...contacts, address: "" },
  })["@graph"][0];
  assert.equal("address" in withoutAddress, false);
  for (const json of [
    schema.getSchemaOrgJsonLd("ru", { contacts }),
    schema.getServiceCategoryJsonLdBySlug("uborka", "ru", { contacts }),
    schema.getServicesHubJsonLdDefault("ru", { contacts }),
  ]) {
    const serialized = JSON.stringify(json);
    for (const key of [
      "aggregateRating",
      "reviewRating",
      "priceRange",
      "latitude",
      "longitude",
      "lowPrice",
      "highPrice",
    ])
      assert.equal(serialized.includes('"' + key + '"'), false, key);
    assert.equal(serialized.includes('"@type":"Offer"'), false);
  }
});

test("FAQ markup uses the same text as the visible localized FAQ", () => {
  const { dictionaries } = load("lib/i18n/translations.ts");
  const { FAQ_ITEMS } = load("lib/i18n/content.ts");
  for (const locale of locales) {
    const faq = schema
      .getSchemaOrgJsonLd(locale)
      ["@graph"].find((node) => node["@type"] === "FAQPage");
    assert.deepEqual(
      plain(
        faq.mainEntity.map((item) => [item.name, item.acceptedAnswer.text])
      ),
      plain(
        FAQ_ITEMS.map((item) => [
          dictionaries[locale][item.questionKey],
          dictionaries[locale][item.answerKey],
        ])
      )
    );
  }
});

test("editable content cannot close its JSON-LD script element", () => {
  const value = {
    name: "</script><script>untrusted()</script>",
    description: "<test> & text",
  };
  const serialized = schema.serializeJsonLd(value);
  assert.equal(serialized.includes("<"), false);
  assert.deepEqual(JSON.parse(serialized), value);
});
