import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  createGalleryPhoto,
  getAllGalleryPhotos,
  getAllSiteServices,
  getSiteContent,
} from "@/lib/models";
import { galleryItems } from "@/lib/gallery-data";
import { DEFAULT_BACKGROUND } from "@/lib/site-content";
import type {
  PublicContent,
  SiteAbout,
  SiteBenefit,
  SiteContacts,
  SiteTestimonial,
} from "@/lib/site-content";

async function ensureGallerySeeded(): Promise<void> {
  const existing = await getAllGalleryPhotos();
  if (existing.length > 0) return;
  for (const item of galleryItems) {
    await createGalleryPhoto({ ...item, id: item.id });
  }
}

function parseContent<T>(
  id: string,
  fallback: (payload: Record<string, unknown>) => T | null
): Promise<T | null> {
  return getSiteContent(id).then((doc) =>
    doc ? fallback(doc.payload as Record<string, unknown>) : null
  );
}

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "Database is unavailable in static mode" },
      { status: 503 }
    );
  }

  try {
    const [
      services,
      contacts,
      about,
      benefits,
      testimonials,
      galleryDoc,
      background,
      logo,
    ] = await Promise.all([
      getAllSiteServices(),
      parseContent<SiteContacts>("contacts", (p) =>
        p && typeof p.phone === "string"
          ? {
              phone: p.phone,
              instagram: String(p.instagram ?? ""),
              telegram: String(p.telegram ?? ""),
              email: String(p.email ?? ""),
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
      ensureGallerySeeded().then(() => getAllGalleryPhotos()),
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
    ]);

    const gallery =
      galleryDoc && galleryDoc.length > 0
        ? galleryDoc.map((photo) => ({
            id: photo.id,
            title: photo.title,
            category: photo.category,
            src: photo.src,
          }))
        : null;

    const content: PublicContent = {
      services: services.length > 0 ? services : null,
      contacts,
      about,
      benefits: benefits && benefits.length > 0 ? benefits : null,
      testimonials:
        testimonials && testimonials.length > 0 ? testimonials : null,
      gallery,
      background: background?.src ?? DEFAULT_BACKGROUND,
      logo: logo?.src ?? null,
      logoSize: logo?.size ?? null,
    };

    return NextResponse.json(content);
  } catch (error) {
    console.error("Ошибка получения контента сайта:", error);
    return NextResponse.json(
      { error: "Ошибка получения контента сайта" },
      { status: 500 }
    );
  }
}
