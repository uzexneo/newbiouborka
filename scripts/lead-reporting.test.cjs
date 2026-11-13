const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

// Synthetic records only. These tests never contact the site, DB or Ads.
const root = path.resolve(__dirname, "..");
function loader(overrides = {}) {
  const cache = new Map();
  function load(relative) {
    const file = path.resolve(root, relative);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText;
    vm.runInNewContext(
      source,
      {
        module,
        exports: module.exports,
        require: (id) => {
          if (Object.hasOwn(overrides, id)) return overrides[id];
          if (id.startsWith("@/") || id.startsWith(".")) {
            const target = id.startsWith("@/")
              ? path.resolve(root, id.slice(2))
              : path.resolve(path.dirname(file), id);
            return load(/\.tsx?$/.test(target) ? target : target + ".ts");
          }
          return require(id);
        },
        URL,
        URLSearchParams,
        Date,
        Error,
        AbortController,
        setTimeout,
        clearTimeout,
        console: { error() {}, warn() {} },
      },
      { filename: file }
    );
    return module.exports;
  }
  return load;
}

const helpers = loader()("lib/lead-reporting.ts");
const visit = {
  id: "35c14493-a1dd-44b2-87b1-817140f5a9bd",
  visitorId: "synthetic-browser",
  sessionId: "640de8bf-6146-400f-862c-a075de36226b",
  path: "/uslugi/uborka?gclid=synthetic-click",
  date: "2026-10-26",
  createdAt: "2026-10-26T09:00:00.000Z",
};
const lead = {
  id: "synthetic-order",
  service: "cleaning",
  createdAt: "2026-10-26T09:01:00.000Z",
  attribution: {
    visitorId: visit.visitorId,
    sessionId: visit.sessionId,
    visitId: visit.id,
    gclid: "synthetic-click",
  },
};

test("link requires the saved page, browser and session; legacy or mismatched IDs stay unlinked", () => {
  const match = helpers.matchLeadVisit(lead, visit);
  assert.equal(match.status, "matched");
  assert.equal(match.path, "/uslugi/uborka");
  assert.equal(match.path.includes("synthetic-click"), false);
  for (const changed of [
    undefined,
    { ...visit, id: "another-id" },
    { ...visit, visitorId: "another-browser" },
    { ...visit, sessionId: "another-session" },
    { ...visit, path: "/admin" },
    { ...visit, path: "//other.example/" },
    { ...visit, createdAt: "2026-10-24T09:00:00.000Z" },
    { ...visit, createdAt: "2026-10-27T09:00:00.000Z" },
  ])
    assert.equal(helpers.matchLeadVisit(lead, changed).status, "unlinked");
  assert.equal(
    helpers.matchLeadVisit(
      { ...lead, attribution: { gclid: "synthetic-click" } },
      visit
    ).status,
    "unlinked"
  );
  assert.equal(
    helpers.matchLeadVisit({ ...lead, attribution: undefined }, visit).status,
    "unlinked"
  );
});

test("late visit write may link to pending form, without assuming a verified real customer", () => {
  assert.equal(
    helpers.matchLeadVisit(lead, {
      ...visit,
      createdAt: "2026-10-26T09:02:00.000Z",
    }).status,
    "matched"
  );
  assert.equal(helpers.leadQuality(lead), "unreviewed");
  assert.equal(
    helpers.leadQuality({ ...lead, orderStatus: "order" }),
    "unreviewed"
  );
  assert.equal(helpers.leadQuality({ ...lead, name: "TEST" }), "unreviewed");
});

test("sources use recorded tags while missing historical attribution stays unknown", () => {
  assert.equal(helpers.leadSource(lead), "Google Реклама");
  assert.equal(
    helpers.leadSource({
      attribution: { utm_source: "google", utm_medium: "cpc" },
    }),
    "Google Реклама"
  );
  assert.equal(
    helpers.leadSource({ attribution: undefined }),
    "Источник не записан"
  );
  assert.equal(
    helpers.leadSource({
      attribution: { referrer: "https://biouborka.uz/uslugi" },
    }),
    "Переходы внутри сайта"
  );
});

test("paid Google tags share one channel without treating organic, empty tags or lookalike hosts as Ads", () => {
  const { trafficSource } = loader()("lib/traffic-source.ts");
  for (const attribution of [
    { utm_source: " Google ", utm_medium: " CPC " },
    { utm_source: "google", utm_medium: "ppc" },
    { gbraid: "synthetic-click", utm_source: "another-source" },
    { wbraid: "synthetic-click" },
  ])
    assert.equal(trafficSource(attribution), "Google Реклама");
  assert.equal(
    trafficSource({ gclid: "", referrer: "https://google.com/" }),
    "Google"
  );
  assert.equal(
    trafficSource({ utm_source: "google", utm_medium: "organic" }),
    "google / organic"
  );
  assert.equal(
    trafficSource({ utm_source: "bing", utm_medium: "cpc" }),
    "bing / cpc"
  );
  assert.equal(
    trafficSource({ referrer: "https://notgoogle.com/" }),
    "notgoogle.com"
  );
  assert.equal(trafficSource({ referrer: "invalid" }), "Источник не определён");
  assert.equal(trafficSource({}), "Прямые заходы / источник не определён");
});

function apiHarness({
  authorized = true,
  visitFailure = false,
  orders = [lead],
  visits = [visit],
} = {}) {
  const updates = [];
  const load = loader({
    "next/server": {
      NextResponse: {
        json: (body, options = {}) => ({
          body,
          status: options.status ?? 200,
          headers: options.headers,
        }),
      },
    },
    "@/lib/admin-auth": { isAdminRequest: () => authorized },
    "@/lib/db": {
      isDatabaseAvailable: () => true,
      ensureSiteVisitsTable: async () => {},
    },
    "@/lib/models": {
      getAllOrders: async () => orders,
      getAllVisits: async () => visits,
      getVisitById: async (id) => {
        if (visitFailure) throw new Error("Synthetic visit storage error");
        return visits.find((item) => item.id === id);
      },
      updateOrderLeadQuality: async (id, quality) => {
        updates.push({ id, quality });
        return { ...lead, leadQuality: quality };
      },
      updateOrderStatus: async (id, status) => {
        updates.push({ id, status });
        return {
          ...(orders.find((order) => order.id === id) ?? lead),
          orderStatus: status,
        };
      },
    },
  });
  return {
    ordersApi: load("app/api/admin/orders/route.ts"),
    analyticsApi: load("app/api/admin/analytics/route.ts"),
    updates,
  };
}

test("orders API preserves customer applications when visit storage is unavailable", async () => {
  const h = apiHarness({ visitFailure: true });
  const result = await h.ordersApi.GET({
    url: "https://example.test/api/admin/orders",
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.length, 1);
  assert.equal(result.body[0].id, lead.id);
  assert.equal(result.body[0].visitMatch.status, "unavailable");
});

test("orders API returns confirmed matching visit and protects reads/writes with admin auth", async () => {
  const h = apiHarness();
  const result = await h.ordersApi.GET({
    url: "https://example.test/api/admin/orders",
  });
  assert.equal(result.body[0].visitMatch.status, "matched");
  const denied = apiHarness({ authorized: false });
  assert.equal((await denied.ordersApi.GET({})).status, 401);
  assert.equal((await denied.ordersApi.PUT({})).status, 401);
  assert.equal(denied.updates.length, 0);
});

test("quality update is explicit, validated and cannot also change status or unknown fields", async () => {
  const h = apiHarness();
  const request = (body) => ({
    url: "https://example.test/api/admin/orders?id=synthetic-order",
    json: async () => body,
  });
  for (const body of [
    { leadQuality: "paid" },
    { leadQuality: "real", orderStatus: "order" },
    { leadQuality: "real", phone: "synthetic" },
    {},
  ])
    assert.equal((await h.ordersApi.PUT(request(body))).status, 400);
  assert.equal(h.updates.length, 0);
  const result = await h.ordersApi.PUT(request({ leadQuality: "real" }));
  assert.equal(result.status, 200);
  assert.equal(result.body.leadQuality, "real");
  assert.equal(h.updates.length, 1);
});

test("completed status is an explicit work outcome, not a quality or payment change", async () => {
  const fixture = { ...lead, leadQuality: "unreviewed", orderStatus: "order" };
  const h = apiHarness({ orders: [fixture] });
  const request = (body) => ({
    url: `https://example.test/api/admin/orders?id=${fixture.id}`,
    json: async () => body,
  });
  for (const body of [
    { orderStatus: "paid" },
    { orderStatus: "completed", leadQuality: "real" },
    { orderStatus: "completed", paid: true },
  ])
    assert.equal((await h.ordersApi.PUT(request(body))).status, 400);
  assert.equal(h.updates.length, 0);
  for (const status of ["completed", "order", "application"]) {
    const result = await h.ordersApi.PUT(request({ orderStatus: status }));
    assert.equal(result.status, 200);
    assert.equal(result.body.orderStatus, status);
    assert.equal(result.body.leadQuality, "unreviewed");
    assert.equal(Object.hasOwn(result.body, "paid"), false);
  }
  assert.equal(h.updates.length, 3);
});

test("analytics keeps real, unreviewed, tests and spam distinct, matching across visit boundary", async () => {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const testVisit = {
    ...visit,
    date: today,
    createdAt: today + "T06:00:00.000Z",
  };
  const fixture = { ...lead, createdAt: today + "T06:01:00.000Z" };
  const orders = [
    { ...fixture, id: "real", leadQuality: "real" },
    { ...fixture, id: "test", leadQuality: "test" },
    { ...fixture, id: "spam", leadQuality: "spam" },
    { ...fixture, id: "legacy", attribution: undefined, orderStatus: "order" },
  ];
  const h = apiHarness({ orders, visits: [testVisit] });
  const result = await h.analyticsApi.GET({
    url: "https://example.test/api/admin/analytics?days=7",
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.funnel.applications, 4);
  assert.equal(result.body.leadQuality.real, 1);
  assert.equal(result.body.leadQuality.test, 1);
  assert.equal(result.body.leadQuality.spam, 1);
  assert.equal(result.body.leadQuality.unreviewed, 1);
  assert.equal(result.body.linkedApplications, 3);
  assert.equal(result.body.realLinkedApplications, 1);
  assert.equal(result.body.byRealLeadSource.length, 1);
  assert.equal(result.body.byRealLeadSource[0].label, "Google Реклама");
  assert.equal(result.body.byRealLeadSource[0].count, 1);
});

function currentFixture() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return {
    lead: { ...lead, createdAt: today + "T06:01:00.000Z" },
    visit: { ...visit, date: today, createdAt: today + "T06:00:00.000Z" },
  };
}

test("analytics keeps booked orders including legacy data separate from completed and real completed", async () => {
  const fixture = currentFixture().lead;
  const orders = [
    {
      ...fixture,
      id: "real-completed",
      orderStatus: "completed",
      leadQuality: "real",
    },
    { ...fixture, id: "unreviewed-completed", orderStatus: "completed" },
    {
      ...fixture,
      id: "test-completed",
      orderStatus: "completed",
      leadQuality: "test",
    },
    {
      ...fixture,
      id: "spam-completed",
      orderStatus: "completed",
      leadQuality: "spam",
    },
    {
      ...fixture,
      id: "real-booked",
      orderStatus: "order",
      leadQuality: "real",
    },
    {
      ...fixture,
      id: "legacy-booked",
      orderStatus: "order",
      attribution: undefined,
    },
    { ...fixture, id: "legacy-application", attribution: undefined },
  ];
  const h = apiHarness({ orders, visits: [] });
  const result = await h.analyticsApi.GET({
    url: "https://example.test/api/admin/analytics?days=7",
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.funnel.applications, 7);
  assert.equal(result.body.funnel.orders, 6);
  assert.equal(result.body.funnel.completed, 4);
  assert.equal(result.body.realCompletedOrders, 1);
  assert.equal(result.body.leadQuality.real, 2);
  assert.equal(result.body.leadQuality.unreviewed, 3);
  assert.equal(result.body.leadQuality.test, 1);
  assert.equal(result.body.leadQuality.spam, 1);
});

test("views and real leads group Google Ads with either click IDs or google/cpc identically", async () => {
  const fixture = currentFixture();
  const tags = [
    { utm_source: "google", utm_medium: "cpc" },
    { gclid: "synthetic", utm_source: "another", utm_medium: "cpc" },
    { utm_source: "bing", utm_medium: "cpc" },
  ];
  const h = apiHarness({
    orders: tags.map((attribution, i) => ({
      ...fixture.lead,
      id: `lead-${i}`,
      leadQuality: "real",
      attribution,
    })),
    visits: tags.map((attribution, i) => ({
      ...fixture.visit,
      id: `visit-${i}`,
      path: `/uslugi/uborka?${new URLSearchParams(attribution)}`,
    })),
  });
  const result = await h.analyticsApi.GET({
    url: "https://example.test/api/admin/analytics?days=7",
  });
  assert.equal(result.status, 200);
  const expected = [
    { label: "Google Реклама", count: 2 },
    { label: "bing / cpc", count: 1 },
  ];
  for (const key of ["bySource", "byLeadSource", "byRealLeadSource"])
    assert.deepEqual(JSON.parse(JSON.stringify(result.body[key])), expected);
});

test("manual cost uses only qualified Google Ads inquiries and never produces a cost without them", () => {
  const { realGoogleAdsInquiries, costPerRealInquiry, manualAdSpendSchema } =
    loader()("lib/lead-cost.ts");
  const count = realGoogleAdsInquiries([
    { label: "Google Реклама", count: 2 },
    { label: "Google", count: 100 },
    { label: "google / organic", count: 100 },
    { label: "Источник не записан", count: 100 },
    { label: "bing / cpc", count: 100 },
    { label: "Google Реклама", count: -1 },
    { label: "Google Реклама", count: NaN },
  ]);
  assert.equal(count, 2);
  assert.equal(costPerRealInquiry(12, count), 6);
  assert.equal(costPerRealInquiry(0, count), 0);
  for (const [spend, leads] of [
    [12, 0],
    [0, 0],
    [-1, 1],
    [Infinity, 1],
    [NaN, 1],
    [12, -1],
    [12, NaN],
    [12, Infinity],
    [12, 1.5],
  ])
    assert.equal(costPerRealInquiry(spend, leads), null);
  assert.equal(manualAdSpendSchema.parse("12,50"), 12.5);
  assert.equal(manualAdSpendSchema.parse("12.123456"), 12.123456);
  assert.equal(manualAdSpendSchema.parse("0"), 0);
  for (const value of [
    "",
    " ",
    "NaN",
    "Infinity",
    "-1",
    "12,5,0",
    "1e5",
    "1000000001",
  ])
    assert.equal(manualAdSpendSchema.safeParse(value).success, false);
});
