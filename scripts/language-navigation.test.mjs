import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canLocalizePathname,
  isLocale,
  localeFromPath,
  locales,
  localizeHref,
  localizePathname,
} from "../lib/i18n/config.ts";

test("each URL determines its language independently of the previous route", () => {
  for (const path of ["/", "/uslugi", "/uslugi/uborka"]) {
    for (const locale of locales) {
      const localized = localizePathname(path, locale);
      assert.equal(localeFromPath(localized), locale);
      assert.equal(localeFromPath(`${localized}/`), locale);
      assert.equal(localizePathname(localized, "ru"), path);
    }
  }
  assert.equal(localeFromPath("/admin"), "ru");
  assert.equal(localeFromPath("/uz-latin-other"), "ru");
  assert.equal(localeFromPath(null), null);
});

test("language changes retain the same service, tracking parameters and anchor", () => {
  assert.equal(
    localizeHref(
      "/uz-krill/uslugi/uborka",
      "uzLatin",
      "?gclid=abc&utm_source=google",
      "#faq-heading"
    ),
    "/uz-latin/uslugi/uborka?gclid=abc&utm_source=google#faq-heading"
  );
  assert.equal(
    localizeHref("/uz-latin", "ru", "?lang=uzLatin&gclid=abc", "#contacts"),
    "/?gclid=abc#contacts"
  );
  assert.equal(
    localizeHref("/", "uzKrill", "", "#services"),
    "/uz-krill#services"
  );
});

test("only existing multilingual route families expose the language selector", () => {
  for (const path of [
    "/",
    "/uslugi",
    "/uslugi/uborka",
    "/uz-latin",
    "/uz-krill/uslugi/uborka",
  ]) {
    assert.equal(canLocalizePathname(path), true, path);
  }
  for (const path of [
    "/admin",
    "/admin/orders",
    "/api/visits",
    "/demo",
    "/unknown",
  ]) {
    assert.equal(canLocalizePathname(path), false, path);
  }
  assert.equal(isLocale("uzLatin"), true);
  assert.equal(isLocale(null), false);
  assert.equal(isLocale("uz-latin"), false);
});
