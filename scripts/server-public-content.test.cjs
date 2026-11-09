const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function compile(source, fileName) {
  return ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
}
require.extensions[".ts"] = (module, fileName) =>
  module._compile(
    compile(fs.readFileSync(fileName, "utf8"), fileName),
    fileName
  );

const clone = (value) => JSON.parse(JSON.stringify(value));

function loader(overrides = {}) {
  const fixture = {
    available: true,
    initialized: true,
    services: [
      {
        id: "cleaning-general",
        categoryId: "cleaning",
        categoryTitle: "Уборка",
        name: "Актуальная генеральная уборка",
        price: "37 500 сум/м²",
        sortOrder: 0,
        createdAt: "2026-11-08",
        privateNote: "not-public",
      },
    ],
    gallery: [
      {
        id: "g-current",
        title: "Текущая работа",
        category: "apartment",
        src: "/assets/current.webp",
        privateNote: "not-public",
      },
    ],
    docs: {
      contacts: {
        phone: "+998 93 375 27 02",
        email: "public@example.test",
        address: "",
        instagram: "",
        telegram: "",
        privateNote: "not-public",
      },
      about: {
        p1: "Актуальный текст",
        p2: "",
        p3: "",
        privateNote: "not-public",
      },
      benefits: { items: [] },
      testimonials: { items: [] },
      background: {
        src: "/assets/current-background.webp",
        privateNote: "not-public",
      },
      logo: {
        src: "/assets/current-logo.webp",
        size: 48,
        privateNote: "not-public",
      },
    },
    photos: { cleaning: "/assets/current-procedure.webp" },
    failed: [],
    stalled: [],
    ...overrides,
  };
  const reads = [];
  const timers = new Map();
  let nextTimer = 0;
  const read = (key, value) => {
    reads.push(key);
    if (fixture.failed.includes(key))
      return Promise.reject(new Error("internal diagnostic"));
    if (fixture.stalled.includes(key)) return new Promise(() => {});
    return Promise.resolve(value());
  };
  const modules = {
    "server-only": {},
    // Request-scope cache behavior belongs to React/Next integration. These
    // unit tests exercise reads, deadlines and the public serialization boundary.
    react: { cache: (fn) => fn },
    "next/server": { connection: async () => {} },
    "./db": {
      isDatabaseAvailable: () => fixture.available,
      ensureSiteContentTable: () => read("ensure-content", () => undefined),
    },
    "./models": {
      getAllSiteServices: () => read("services", () => fixture.services),
      getAllGalleryPhotos: () => read("gallery", () => fixture.gallery),
      getAllProcedurePhotos: () =>
        read("procedurePhotos", () => fixture.photos),
      isSiteCollectionInitialized: () => Promise.resolve(fixture.initialized),
      getSiteContent: (id) =>
        read(id, () =>
          fixture.docs[id]
            ? { id, payload: fixture.docs[id], privateNote: "not-public" }
            : null
        ),
    },
  };
  const exports = {};
  const fileName = path.join(__dirname, "../lib/server-public-content.ts");
  vm.runInNewContext(
    compile(fs.readFileSync(fileName, "utf8"), fileName),
    {
      exports,
      process: { env: {} },
      require: (id) => {
        if (!(id in modules))
          throw new Error(`Unexpected server dependency: ${id}`);
        return modules[id];
      },
      setTimeout: (fn, ms) => {
        const id = ++nextTimer;
        timers.set(id, { fn, ms });
        return id;
      },
      clearTimeout: (id) => timers.delete(id),
    },
    { filename: fileName }
  );
  return {
    fixture,
    reads,
    timers,
    get: exports.getServerPublicContent,
    expirePending: async () => {
      // Drain resolved reads before firing only the outstanding deadlines.
      await new Promise(setImmediate);
      for (const [id, timer] of [...timers]) {
        assert.ok(
          timer.ms > 0 && timer.ms <= 3000,
          "public SSR has a bounded deadline"
        );
        timers.delete(id);
        timer.fn();
      }
    },
  };
}

test("SSR content uses current saved public fields without leaking database metadata", async () => {
  const instance = loader();
  const content = clone(await instance.get());
  assert.deepEqual(content.services, [
    {
      id: "cleaning-general",
      categoryId: "cleaning",
      categoryTitle: "Уборка",
      name: "Актуальная генеральная уборка",
      price: "37 500 сум/м²",
      sortOrder: 0,
    },
  ]);
  assert.equal(content.contacts.email, "public@example.test");
  assert.equal(
    content.contacts.address,
    "",
    "an empty saved address stays empty"
  );
  assert.equal(content.about.p1, "Актуальный текст");
  assert.deepEqual(content.gallery, [
    {
      id: "g-current",
      title: "Текущая работа",
      category: "apartment",
      src: "/assets/current.webp",
    },
  ]);
  assert.equal(JSON.stringify(content).includes("not-public"), false);
  assert.equal(JSON.stringify(content).includes("createdAt"), false);
  assert.deepEqual(content.unavailableSections, []);
  assert.equal(instance.timers.size, 0);
});

test("database unavailability returns null without attempting content reads", async () => {
  const instance = loader({ available: false });
  assert.equal(await instance.get(), null);
  assert.equal(instance.reads.length, 0);
  assert.equal(instance.timers.size, 0);
});

test("all failed sections return null without exposing internal errors", async () => {
  const instance = loader({
    failed: [
      "services",
      "gallery",
      "contacts",
      "about",
      "benefits",
      "testimonials",
      "background",
      "logo",
      "ensure-content",
    ],
  });
  assert.equal(await instance.get(), null);
  assert.equal(instance.timers.size, 0);
});

test("a timed out media section preserves successful services and contacts", async () => {
  const instance = loader({
    stalled: ["gallery"],
    failed: ["procedurePhotos"],
  });
  const pending = instance.get();
  await instance.expirePending();
  const content = clone(await pending);
  assert.equal(content.services[0].price, "37 500 сум/м²");
  assert.equal(content.contacts.email, "public@example.test");
  assert.equal(content.gallery, null);
  assert.equal(content.procedurePhotos, null);
  assert.deepEqual(content.unavailableSections.sort(), [
    "gallery",
    "procedurePhotos",
  ]);
  assert.equal(instance.timers.size, 0);
});

test("explicitly empty initialized collections remain empty", async () => {
  const instance = loader({ services: [], gallery: [] });
  const content = clone(await instance.get());
  assert.deepEqual(content.services, []);
  assert.deepEqual(content.gallery, []);
  assert.deepEqual(content.benefits, []);
  assert.deepEqual(content.testimonials, []);
});

test("uninitialized collections remain null so the established fallback can render", async () => {
  const instance = loader({ services: [], gallery: [], initialized: false });
  const content = clone(await instance.get());
  assert.equal(content.services, null);
  assert.equal(content.gallery, null);
  assert.deepEqual(content.unavailableSections, []);
});

test("separate server reads do not retain a stale saved price in application memory", async () => {
  const instance = loader();
  assert.equal((await instance.get()).services[0].price, "37 500 сум/м²");
  instance.fixture.services[0].price = "41 000 сум/м²";
  assert.equal((await instance.get()).services[0].price, "41 000 сум/м²");
});

test("provider exposes server content in its first render before browser effects", async () => {
  const instance = loader();
  const initialContent = await instance.get();
  const siteContent = require("../lib/site-content.ts");
  const translations = require("../lib/i18n/translations.ts");
  const contentMeta = require("../lib/i18n/content.ts");
  const localization = require("../lib/i18n/site-content.ts");
  const gallery = require("../lib/gallery-data.ts");
  const fileName = path.join(__dirname, "../lib/site-content-provider.tsx");
  const exports = {};
  const modules = {
    react: {
      createContext: () => ({ Provider: "provider" }),
      useContext: () => {
        throw new Error("Unexpected context read");
      },
      useEffect: () => {},
      useRef: (value) => ({ current: value }),
      useState: (value) => [value, () => {}],
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "next/navigation": { usePathname: () => "/" },
    "@/lib/i18n/language-provider": {
      useLanguage: () => ({
        locale: "ru",
        t: (key) => translations.dictionaries.ru[key],
      }),
    },
    "@/lib/i18n/site-content": localization,
    "@/lib/i18n/content": contentMeta,
    "@/lib/gallery-data": gallery,
    "@/lib/site-content": siteContent,
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
  const value = exports.SiteContentProvider({ children: null, initialContent })
    .props.value;
  assert.equal(value.services[0].services[0].price, "37 500 сум/м²");
  assert.equal(
    value.services[0].services[0].name,
    "Актуальная генеральная уборка"
  );
  assert.equal(value.contacts.email, "public@example.test");
  assert.equal(value.about.p1, "Актуальный текст");
  assert.equal(value.isDynamic, true);
});

function providerHarness() {
  const siteContent = require("../lib/site-content.ts");
  const translations = require("../lib/i18n/translations.ts");
  const contentMeta = require("../lib/i18n/content.ts");
  const localization = require("../lib/i18n/site-content.ts");
  const gallery = require("../lib/gallery-data.ts");
  const fileName = path.join(__dirname, "../lib/site-content-provider.tsx");
  const hooks = [];
  let hookIndex = 0;
  let rerender = false;
  let pathname = "/";
  let pendingEffect;
  let committedEffect;
  let cleanup;
  let apiContent;
  let fetches = 0;
  const listeners = new Map();
  const exports = {};
  const modules = {
    react: {
      createContext: () => ({ Provider: "provider" }),
      useContext: () => {
        throw new Error("Unexpected context read");
      },
      useState: (initial) => {
        const index = hookIndex++;
        if (!(index in hooks)) hooks[index] = initial;
        return [
          hooks[index],
          (value) => {
            const next =
              typeof value === "function" ? value(hooks[index]) : value;
            if (!Object.is(next, hooks[index])) {
              hooks[index] = next;
              rerender = true;
            }
          },
        ];
      },
      useRef: (initial) => {
        const index = hookIndex++;
        if (!(index in hooks)) hooks[index] = { current: initial };
        return hooks[index];
      },
      useEffect: (effect, deps) => {
        pendingEffect = { effect, deps };
      },
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "next/navigation": { usePathname: () => pathname },
    "@/lib/i18n/language-provider": {
      useLanguage: () => ({
        locale: "ru",
        t: (key) => translations.dictionaries.ru[key],
      }),
    },
    "@/lib/i18n/site-content": localization,
    "@/lib/i18n/content": contentMeta,
    "@/lib/gallery-data": gallery,
    "@/lib/site-content": siteContent,
  };
  const target = {
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: (name) => listeners.delete(name),
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
      window: target,
      document: { ...target, visibilityState: "visible" },
      AbortController,
      AbortSignal,
      fetch: async () => {
        fetches++;
        return { ok: true, json: async () => apiContent };
      },
    },
    { filename: fileName }
  );
  return {
    setApiContent: (value) => {
      apiContent = value;
    },
    fetchCount: () => fetches,
    listeners,
    close: () => cleanup?.(),
    render: (initialContent, nextPath = pathname) => {
      pathname = nextPath;
      let value;
      let passes = 0;
      do {
        hookIndex = 0;
        rerender = false;
        value = exports.SiteContentProvider({ children: null, initialContent })
          .props.value;
        assert.ok(
          ++passes < 10,
          "prop reconciliation must settle without a render loop"
        );
      } while (rerender);
      const changed =
        !committedEffect ||
        pendingEffect.deps.some(
          (dep, index) => !Object.is(dep, committedEffect.deps[index])
        );
      if (changed) {
        cleanup?.();
        cleanup = pendingEffect.effect();
        committedEffect = pendingEffect;
      }
      return value;
    },
  };
}

test("a persisted provider applies new SSR props and preserves only unavailable sections", async () => {
  const original = await loader().get();
  const harness = providerHarness();
  harness.setApiContent(original);
  assert.equal(
    harness.render(original).services[0].services[0].price,
    "37 500 сум/м²"
  );
  const updated = clone(original);
  updated.services[0].price = "42 000 сум/м²";
  assert.equal(
    harness.render(updated).services[0].services[0].price,
    "42 000 сум/м²"
  );
  assert.equal(
    harness.fetchCount(),
    0,
    "complete incoming snapshots do not need an immediate fetch"
  );
  const partial = {
    ...updated,
    services: null,
    contacts: { ...updated.contacts, email: "new-public@example.test" },
    unavailableSections: ["services"],
  };
  harness.setApiContent(partial);
  const value = harness.render(partial);
  assert.equal(value.services[0].services[0].price, "42 000 сум/м²");
  assert.equal(value.contacts.email, "new-public@example.test");
  await new Promise(setImmediate);
  harness.close();
});

test("SPA navigation refreshes saved prices while a full first snapshot avoids a duplicate fetch", async () => {
  const original = await loader().get();
  const harness = providerHarness();
  const updated = clone(original);
  updated.services[0].price = "43 000 сум/м²";
  harness.setApiContent(updated);
  harness.render(original, "/");
  assert.equal(harness.fetchCount(), 0);
  harness.render(original, "/uslugi/uborka/generalnaya");
  await new Promise(setImmediate);
  assert.equal(harness.fetchCount(), 1);
  const value = harness.render(original, "/uslugi/uborka/generalnaya");
  assert.equal(value.services[0].services[0].price, "43 000 сум/м²");
  for (const event of [
    "biouborka:content-updated",
    "focus",
    "pageshow",
    "visibilitychange",
  ]) {
    assert.equal(harness.listeners.has(event), true, event);
  }
  harness.close();
});
