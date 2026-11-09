import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import { ensureSiteContentTable, isDatabaseAvailable } from "./db";
import {
  getAllGalleryPhotos,
  getAllProcedurePhotos,
  getAllSiteServices,
  getSiteContent,
  isSiteCollectionInitialized,
} from "./models";
import type { PublicContent, SiteAbout, SiteContacts } from "./site-content";

export type PublicContentResponse = PublicContent & {
  unavailableSections: (keyof PublicContent)[];
};

// Bound response latency without caching potentially outdated prices.
const CONTENT_READ_TIMEOUT_MS = 2_500;
const sectionKeys = [
  ["services"],
  ["contacts"],
  ["about"],
  ["benefits"],
  ["testimonials"],
  ["gallery"],
  ["background"],
  ["logo", "logoSize"],
  ["procedurePhotos"],
] as const;

async function readContent<T>(
  id: string,
  select: (payload: Record<string, unknown>) => T | null
): Promise<T | null> {
  const doc = await getSiteContent(id);
  return doc ? select(doc.payload) : null;
}

async function boundedRead<T>(read: Promise<T>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const value = await Promise.race([
      read,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("PUBLIC_CONTENT_TIMEOUT")),
          CONTENT_READ_TIMEOUT_MS
        );
      }),
    ]);
    return { value, failed: false };
  } catch {
    return { value: null, failed: true };
  } finally {
    clearTimeout(timer);
  }
}

async function readPublicContent(): Promise<PublicContentResponse | null> {
  if (!isDatabaseAvailable()) return null;
  const [
    services,
    contacts,
    about,
    benefits,
    testimonials,
    gallery,
    background,
    logo,
    photos,
  ] = await Promise.all([
    boundedRead(
      getAllSiteServices().then(async (items) => {
        if (!items.length && !(await isSiteCollectionInitialized("services")))
          return null;
        // Only public fields cross the server/client boundary.
        return items.map(
          ({ id, categoryId, categoryTitle, name, price, sortOrder }) => ({
            id,
            categoryId,
            categoryTitle,
            name,
            price,
            sortOrder,
          })
        );
      })
    ),
    boundedRead(
      readContent<SiteContacts>("contacts", (p) =>
        typeof p.phone === "string"
          ? {
              phone: p.phone,
              instagram: String(p.instagram ?? ""),
              telegram: String(p.telegram ?? ""),
              email: String(p.email ?? ""),
              address: String(p.address ?? ""),
            }
          : null
      )
    ),
    boundedRead(
      readContent<SiteAbout>("about", (p) =>
        typeof p.p1 === "string"
          ? {
              p1: p.p1,
              p2: String(p.p2 ?? ""),
              p3: String(p.p3 ?? ""),
            }
          : null
      )
    ),
    boundedRead(
      readContent("benefits", (p) =>
        Array.isArray(p.items)
          ? p.items.map((item) => ({
              title: String(item.title ?? ""),
              desc: String(item.desc ?? ""),
            }))
          : null
      )
    ),
    boundedRead(
      readContent("testimonials", (p) =>
        Array.isArray(p.items)
          ? p.items.map((item) => ({
              name: String(item.name ?? ""),
              location: String(item.location ?? ""),
              text: String(item.text ?? ""),
              rating: Number(item.rating),
            }))
          : null
      )
    ),
    boundedRead(
      getAllGalleryPhotos().then(async (items) => {
        if (!items.length && !(await isSiteCollectionInitialized("gallery")))
          return null;
        return items.map(({ id, title, category, src }) => ({
          id,
          title,
          category,
          src,
        }));
      })
    ),
    boundedRead(
      readContent("background", (p) =>
        typeof p.src === "string" && p.src ? p.src : null
      )
    ),
    boundedRead(
      readContent("logo", (p) =>
        typeof p.src === "string" || typeof p.size === "number"
          ? {
              src: typeof p.src === "string" && p.src ? p.src : null,
              size: typeof p.size === "number" ? p.size : null,
            }
          : null
      )
    ),
    boundedRead(ensureSiteContentTable().then(() => getAllProcedurePhotos())),
  ]);
  const results = [
    services,
    contacts,
    about,
    benefits,
    testimonials,
    gallery,
    background,
    logo,
    photos,
  ];
  if (results.every((result) => result.failed)) return null;
  return {
    services: services.value,
    contacts: contacts.value,
    about: about.value,
    benefits: benefits.value,
    testimonials: testimonials.value,
    gallery: gallery.value,
    background: background.value,
    logo: logo.value?.src ?? null,
    logoSize: logo.value?.size ?? null,
    procedurePhotos:
      photos.value && Object.keys(photos.value).length ? photos.value : null,
    unavailableSections: results.flatMap((result, index) =>
      result.failed ? [...(sectionKeys[index] ?? [])] : []
    ),
  };
}

// React deduplicates layout/page/metadata reads within one render.
// connection() excludes live content from build-time prerendered HTML.
export const getServerPublicContent = cache(
  async (): Promise<PublicContentResponse | null> => {
    if (process.env.OUTPUT_MODE === "export") return null;
    await connection();
    return readPublicContent();
  }
);
