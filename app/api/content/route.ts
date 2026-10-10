import { NextResponse } from "next/server";
import { ensureSiteContentTable, isDatabaseAvailable } from "@/lib/db";
import {
  getAllGalleryPhotos,
  getAllProcedurePhotos,
  getAllSiteServices,
  getSiteContent,
  isSiteCollectionInitialized,
} from "@/lib/models";
import { DEFAULT_BACKGROUND } from "@/lib/site-content";
import type {
  PublicContent,
  SiteAbout,
  SiteBenefit,
  SiteContacts,
  SiteTestimonial,
} from "@/lib/site-content";

export const dynamic = "force-dynamic";
const responseHeaders = { "Cache-Control": "no-store" };
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

function parseContent<T>(
  id: string,
  fallback: (payload: Record<string, unknown>) => T | null
): Promise<T | null> {
  return ensureSiteContentTable().then(() => getSiteContent(id)).then((doc) =>
    doc ? fallback(doc.payload as Record<string, unknown>) : null
  );
}

function settledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "Database is unavailable in static mode" },
      { status: 503, headers: responseHeaders }
    );
  }

    const results = await Promise.allSettled([
      getAllSiteServices().then(async (items) => items.length > 0 || await isSiteCollectionInitialized("services") ? items : null),
      parseContent<SiteContacts>("contacts", (p) =>
        p && typeof p.phone === "string"
          ? {
              phone: p.phone,
              instagram: String(p.instagram ?? ""),
              telegram: String(p.telegram ?? ""),
              email: String(p.email ?? ""),
              address: String(p.address ?? ""),
            }
          : null
      ),
      parseContent<SiteAbout>("about", (p) =>
        p && typeof p.p1 === "string"
          ? { p1: p.p1, p2: String(p.p2 ?? ""), p3: String(p.p3 ?? "") }
          : null
      ),
      parseContent<SiteBenefit[]>("benefits", (p) =>
        Array.isArray(p.items) ? (p.items as SiteBenefit[]) : null
      ),
      parseContent<SiteTestimonial[]>("testimonials", (p) =>
        Array.isArray(p.items) ? (p.items as SiteTestimonial[]) : null
      ),
      getAllGalleryPhotos().then(async (items) => items.length > 0 || await isSiteCollectionInitialized("gallery") ? items : null),
      parseContent<{ src?: string }>("background", (p) =>
        p && typeof p.src === "string" && p.src ? { src: p.src } : null
      ),
      parseContent<{ src?: string; size?: number }>("logo", (p) =>
        p && (typeof p.src === "string" || typeof p.size === "number")
          ? {
              src: typeof p.src === "string" && p.src ? p.src : undefined,
              size: typeof p.size === "number" ? p.size : undefined,
            }
          : null
      ),
      ensureSiteContentTable().then(() => getAllProcedurePhotos()),
    ]);

    if (results.some((result) => result.status === "rejected")) {
      console.error("[content] Часть контента недоступна; сохранены успешно прочитанные разделы");
    }
    if (results.every((result) => result.status === "rejected")) {
      return NextResponse.json(
        { error: "Контент временно недоступен" },
        { status: 503, headers: responseHeaders }
      );
    }

    const services = settledValue(results[0]);
    const contacts = settledValue(results[1]);
    const about = settledValue(results[2]);
    const benefits = settledValue(results[3]);
    const testimonials = settledValue(results[4]);
    const galleryDoc = settledValue(results[5]);
    const background = settledValue(results[6]);
    const logo = settledValue(results[7]);
    const procedurePhotos = settledValue(results[8]);
    const unavailableSections = results.flatMap((result, index) =>
      result.status === "rejected" ? [...(sectionKeys[index] ?? [])] : []
    );

    const gallery =
      galleryDoc != null
        ? galleryDoc.map((photo) => ({
            id: photo.id,
            title: photo.title,
            category: photo.category,
            src: photo.src,
          }))
        : null;

    const content: PublicContent & { unavailableSections: (keyof PublicContent)[] } = {
      services,
      contacts,
      about,
      benefits,
      testimonials,
      gallery,
      background: background?.src ?? DEFAULT_BACKGROUND,
      logo: logo?.src ?? null,
      logoSize: logo?.size ?? null,
      procedurePhotos:
        procedurePhotos && Object.keys(procedurePhotos).length > 0
          ? procedurePhotos
          : null,
      unavailableSections,
    };

    return NextResponse.json(content, { headers: responseHeaders });
}
