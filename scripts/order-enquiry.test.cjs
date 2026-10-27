const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const cache = new Map();
function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("require", "module", "exports", output)(
    (id) => {
      if (id.startsWith("@/") || id.startsWith(".")) {
        const target = id.startsWith("@/")
          ? path.resolve(root, id.slice(2))
          : path.resolve(path.dirname(file), id);
        return load(`${path.relative(root, target)}.ts`);
      }
      return require(id);
    },
    module,
    module.exports
  );
  return module.exports;
}

const { buildOrderFormSchema, buildQuickOrderSchema } = load(
  "lib/validation/order-form.ts"
);
const { orderSchema } = load("lib/validation.ts");
const messages = {
  name: "name",
  phone: "phone",
  service: "service",
  date: "date",
  time: "time",
  address: "address",
};
const contact = {
  name: "Test Customer",
  phone: "+998 93 000 00 00",
  service: "cleaning-general",
};

test("initial enquiry accepts blank scheduling details and is compatible with the API", () => {
  const parsed = buildOrderFormSchema(messages).parse({
    ...contact,
    date: "",
    time: "",
    address: "",
    comment: "",
  });
  assert.equal(orderSchema.safeParse(parsed).success, true);
  assert.equal(orderSchema.safeParse(contact).success, true);
});

test("customer may still supply scheduling details", () => {
  const parsed = buildOrderFormSchema(messages).parse({
    ...contact,
    date: "2026-10-30",
    time: "10:00",
    address: "Tashkent",
    comment: "Windows",
  });
  assert.equal(parsed.date, "2026-10-30");
  assert.equal(parsed.address, "Tashkent");
  assert.equal(orderSchema.safeParse(parsed).success, true);
});

test("short forms still require a real contact and selected service", () => {
  for (const schema of [
    buildQuickOrderSchema(messages),
    buildOrderFormSchema(messages),
  ]) {
    const input = { ...contact, date: "", time: "", address: "" };
    for (const missing of ["name", "phone", "service"]) {
      assert.equal(
        schema.safeParse({ ...input, [missing]: "" }).success,
        false,
        missing
      );
    }
    assert.equal(
      schema.safeParse({ ...input, phone: "not-a-phone" }).success,
      false
    );
  }
});

test("optional details retain API size limits", () => {
  const schema = buildOrderFormSchema(messages);
  const input = { ...contact, date: "", time: "", address: "" };
  for (const [field, length] of [
    ["date", 21],
    ["time", 21],
    ["address", 501],
    ["comment", 2001],
  ]) {
    assert.equal(
      schema.safeParse({ ...input, [field]: "a".repeat(length) }).success,
      false,
      field
    );
  }
});
