const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function harness(pathname = "/uslugi/uborka", gtag) {
  const calls = [];
  const root = path.resolve(__dirname, "..");
  const cache = new Map();
  const window = {
    location: {
      pathname,
      href: `https://example.test${pathname}?phone=private&name=private`,
    },
    gtag: gtag ?? ((...args) => calls.push(args)),
  };
  function load(relative) {
    const file = path.resolve(root, relative);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
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
      require(id) {
        if (id === "@/lib/analytics-paths")
          return load("lib/analytics-paths.ts");
        // This event must not touch attribution, storage, the DB or network.
        if (id.startsWith("@/")) return {};
        throw new Error(`Unexpected dependency: ${id}`);
      },
      window,
    });
    return module.exports;
  }
  return { analytics: load("lib/analytics.ts"), calls, window };
}

test("phone click is a distinct intent event with a stable placement and service id", () => {
  const h = harness();
  h.analytics.trackPhoneClick({
    location: "service_category",
    service: "cleaning",
  });
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls)), [
    [
      "event",
      "phone_click",
      { link_location: "service_category", service: "cleaning" },
    ],
  ]);
  assert.equal(JSON.stringify(h.calls).includes("generate_lead"), false);
  assert.equal(JSON.stringify(h.calls).includes("private"), false);
});

test("phone click suppresses admin and infrastructure pages", () => {
  for (const pathname of [
    "/admin",
    "/admin/applications",
    "/api/orders",
    "/_next/static/a.js",
  ]) {
    const h = harness(pathname);
    h.analytics.trackPhoneClick({ location: "footer" });
    assert.equal(h.calls.length, 0, pathname);
  }
});

test("phone click rejects unknown placements and discards non-id service values", () => {
  const h = harness();
  h.analytics.trackPhoneClick({ location: "+998900000000" });
  assert.equal(h.calls.length, 0);
  h.analytics.trackPhoneClick({
    location: "home_hero",
    service: "+998 90 000 00 00",
  });
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls)), [
    ["event", "phone_click", { link_location: "home_hero" }],
  ]);
});

test("blocked or failing analytics cannot interrupt the phone link handler", () => {
  const h = harness("/", () => {
    throw new Error("Tracking blocked");
  });
  assert.doesNotThrow(() =>
    h.analytics.trackPhoneClick({ location: "floating_call" })
  );
  h.window.gtag = undefined;
  assert.doesNotThrow(() =>
    h.analytics.trackPhoneClick({ location: "floating_call" })
  );
});
