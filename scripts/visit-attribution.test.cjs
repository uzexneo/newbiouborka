const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { randomUUID } = require("node:crypto");
const { test } = require("node:test");
const ts = require("typescript");

// Browser, clock and network are isolated. No real requests or leads are sent.
function harness({
  blockedStorage = false,
  initialUrl = "https://example.test/?gclid=click-A&utm_source=google&utm_medium=cpc&phone=private#secret",
} = {}) {
  const root = path.resolve(__dirname, "..");
  let now = Date.UTC(2026, 9, 26, 10);
  const cache = new Map();
  const local = new Map();
  const session = new Map();
  const storage = (map) => ({
    getItem(key) {
      if (blockedStorage) throw new Error("Storage blocked");
      return map.get(key) ?? null;
    },
    setItem(key, value) {
      if (blockedStorage) throw new Error("Storage blocked");
      map.set(key, value);
    },
  });
  const window = {
    location: new URL(initialUrl),
    localStorage: storage(local),
    sessionStorage: storage(session),
  };
  const document = {
    referrer: "https://www.google.com/search?private=omit#secret",
  };
  class Clock extends Date {
    static now() {
      return now;
    }
  }
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
    vm.runInNewContext(
      source,
      {
        module,
        exports: module.exports,
        require(id) {
          if (id === "./db" || id === "@/lib/db")
            throw new Error("Database forbidden");
          if (id.startsWith("@/") || id.startsWith(".")) {
            const target = id.startsWith("@/")
              ? path.resolve(root, id.slice(2))
              : path.resolve(path.dirname(file), id);
            return load(target.endsWith(".ts") ? target : target + ".ts");
          }
          return require(id);
        },
        window,
        document,
        crypto: { randomUUID },
        Date: Clock,
        URL,
        URLSearchParams,
        setTimeout,
        clearTimeout,
        AbortController,
        Uint8Array,
        console: { warn() {}, error() {} },
      },
      { filename: file }
    );
    return module.exports;
  }
  return {
    load,
    local,
    session,
    window,
    document,
    advance(ms) {
      now += ms;
    },
    navigate(url) {
      window.location = new URL(url);
    },
  };
}
const plain = (value) => JSON.parse(JSON.stringify(value));

test("lead and pending visit share identifiers before any visit is saved", () => {
  const h = harness();
  const context = h.load("lib/visit-context.ts");
  const analytics = h.load("lib/analytics.ts");
  const visit = context.getBrowserVisit();
  const lead = analytics.captureLeadAttribution();
  for (const key of ["visitorId", "sessionId", "visitId"])
    assert.equal(lead[key], visit[key]);
  assert.equal(visit.isNewVisitor, true);
  assert.equal(
    h.local.size,
    0,
    "a failed or pending save does not confirm a visitor"
  );
  assert.equal(lead.gclid, "click-A");
  assert.equal(lead.landingUrl, "https://example.test/");
  assert.equal(lead.referrer, "https://www.google.com/search");
  assert.equal(JSON.stringify(lead).includes("private"), false);
  assert.equal(JSON.stringify(visit).includes("private"), false);
  context.confirmBrowserVisit(visit);
  assert.equal(h.local.get("biouborka.visitorId"), visit.visitorId);
  assert.equal(context.getBrowserVisit().isNewVisitor, false);
});

test("internal navigation preserves campaign and session while linking the current page", () => {
  const h = harness();
  const analytics = h.load("lib/analytics.ts");
  const first = analytics.captureLeadAttribution();
  h.navigate("https://example.test/uslugi/uborka");
  const second = analytics.captureLeadAttribution();
  const visit = h.load("lib/visit-context.ts").getBrowserVisit();
  assert.equal(second.gclid, "click-A");
  assert.equal(second.landingUrl, "https://example.test/");
  assert.equal(second.visitorId, first.visitorId);
  assert.equal(second.sessionId, first.sessionId);
  assert.notEqual(second.visitId, first.visitId);
  assert.equal(second.visitId, visit.visitId);
});

test("a new campaign on the same page has its own visit and replaces old tags", () => {
  const h = harness();
  const analytics = h.load("lib/analytics.ts");
  const first = analytics.captureLeadAttribution();
  h.navigate("https://example.test/?gclid=click-B");
  const second = analytics.captureLeadAttribution();
  assert.equal(second.gclid, "click-B");
  assert.equal(second.utm_source, undefined);
  assert.notEqual(second.visitId, first.visitId);
  assert.equal(second.sessionId, first.sessionId);
});

test("expired sessions do not attach an old advertising click to a later direct lead", () => {
  const h = harness();
  const analytics = h.load("lib/analytics.ts");
  const first = analytics.captureLeadAttribution();
  h.navigate("https://example.test/uslugi/uborka");
  h.advance(30 * 60 * 1000);
  const second = analytics.captureLeadAttribution();
  assert.equal(second.gclid, undefined);
  assert.notEqual(second.sessionId, first.sessionId);
  assert.notEqual(second.visitId, first.visitId);
  assert.equal(second.visitorId, first.visitorId);
});

test("blocked storage preserves linking in memory and administrative pages remain excluded", () => {
  const h = harness({ blockedStorage: true });
  const analytics = h.load("lib/analytics.ts");
  const first = analytics.captureLeadAttribution();
  h.navigate("https://example.test/uslugi/uborka");
  const second = analytics.captureLeadAttribution();
  assert.equal(second.gclid, first.gclid);
  assert.equal(second.visitorId, first.visitorId);
  assert.equal(second.sessionId, first.sessionId);
  h.navigate("https://example.test/admin?gclid=private");
  assert.equal(analytics.captureLeadAttribution(), undefined);
  assert.equal(h.load("lib/visit-context.ts").getBrowserVisit(), undefined);
});

test("visit retries keep exact identifiers and require durable confirmation", async () => {
  const h = harness();
  const visit = h.load("lib/visit-context.ts").getBrowserVisit();
  const { submitVisitWithRetry } = h.load("lib/visit-tracking.ts");
  const bodies = [];
  assert.equal(
    await submitVisitWithRetry(visit, {
      wait: async () => {},
      fetcher: async (_, options) => {
        bodies.push(options.body);
        return bodies.length === 1
          ? { status: 503, ok: false }
          : {
              status: 201,
              ok: true,
              json: async () => ({ ok: true, saved: true, id: visit.visitId }),
            };
      },
    }),
    true
  );
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0], bodies[1]);
  assert.deepEqual(JSON.parse(bodies[0]), plain(visit));
  for (const response of [
    { status: 202, ok: true, json: async () => ({ ok: true, saved: false }) },
    {
      status: 201,
      ok: true,
      json: async () => ({ ok: true, saved: true, id: randomUUID() }),
    },
  ])
    assert.equal(
      await submitVisitWithRetry(visit, { fetcher: async () => response }),
      false
    );
});

test("server schemas retain linkage, sanitize URLs and reject unbounded metadata", () => {
  const h = harness();
  const attribution = h.load("lib/analytics.ts").captureLeadAttribution();
  const { orderSchema, visitSchema } = h.load("lib/validation.ts");
  const lead = orderSchema.parse({
    name: "Synthetic",
    phone: "+998900000000",
    service: "Synthetic",
    attribution,
  });
  assert.deepEqual(plain(lead.attribution), plain(attribution));
  assert.equal(
    orderSchema.safeParse({
      ...lead,
      attribution: { ...attribution, secret: "bad" },
    }).success,
    false
  );
  assert.equal(
    orderSchema.safeParse({
      ...lead,
      attribution: { ...attribution, sessionId: "invalid" },
    }).success,
    false
  );
  assert.equal(
    orderSchema.safeParse({
      ...lead,
      attribution: { ...attribution, referrer: "invalid" },
    }).success,
    false
  );
  const visit = visitSchema.parse({
    ...h.load("lib/visit-context.ts").getBrowserVisit(),
    path: "/?email=private&gclid=allowed",
  });
  assert.equal(visit.path, "/?gclid=allowed");
});
