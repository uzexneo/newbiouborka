import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  getSiteContent,
  putSiteContent,
  type SiteContentId,
} from "@/lib/models";
import {
  DEFAULT_ABOUT,
  DEFAULT_BENEFITS,
  DEFAULT_CONTACTS,
  DEFAULT_TESTIMONIALS,
} from "@/lib/site-content";

const contactsSchema = z.object({
  type: z.literal("contacts"),
  phone: z.string().min(1).max(40),
  instagram: z.string().max(500).optional(),
  telegram: z.string().max(500).optional(),
  email: z.string().email().optional().or(z.literal("")),
});

const aboutSchema = z.object({
  type: z.literal("about"),
  p1: z.string().min(1).max(5000),
  p2: z.string().max(5000).optional(),
  p3: z.string().max(5000).optional(),
});

const benefitSchema = z.object({
  title: z.string().min(1).max(300),
  desc: z.string().max(3000),
});

const benefitsSchema = z.object({
  type: z.literal("benefits"),
  items: z.array(benefitSchema).max(20),
});

const testimonialSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.string().max(200).optional(),
  text: z.string().min(1).max(5000),
  rating: z.number().int().min(1).max(5).optional(),
});

const testimonialsSchema = z.object({
  type: z.literal("testimonials"),
  items: z.array(testimonialSchema).max(30),
});

const saveSchema = z.discriminatedUnion("type", [
  contactsSchema,
  aboutSchema,
  benefitsSchema,
  testimonialsSchema,
]);

function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

async function ensureContentSeeded() {
  const results = await Promise.all([
    getSiteContent("contacts"),
    getSiteContent("about"),
    getSiteContent("benefits"),
    getSiteContent("testimonials"),
  ]);
  if (!results[0]) await putSiteContent("contacts", { ...DEFAULT_CONTACTS });
  if (!results[1]) await putSiteContent("about", { ...DEFAULT_ABOUT });
  if (!results[2])
    await putSiteContent("benefits", { items: [...DEFAULT_BENEFITS] });
  if (!results[3])
    await putSiteContent("testimonials", { items: [...DEFAULT_TESTIMONIALS] });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json({
      contacts: DEFAULT_CONTACTS,
      about: DEFAULT_ABOUT,
      benefits: DEFAULT_BENEFITS,
      testimonials: DEFAULT_TESTIMONIALS,
    });
  }

  try {
    await ensureContentSeeded();
    const [contacts, about, benefits, testimonials] = await Promise.all([
      getSiteContent("contacts"),
      getSiteContent("about"),
      getSiteContent("benefits"),
      getSiteContent("testimonials"),
    ]);

    return NextResponse.json({
      contacts: contacts?.payload ?? DEFAULT_CONTACTS,
      about: about?.payload ?? DEFAULT_ABOUT,
      benefits: benefits?.payload ?? DEFAULT_BENEFITS,
      testimonials: testimonials?.payload ?? DEFAULT_TESTIMONIALS,
    });
  } catch (error) {
    console.error("Ошибка получения контента:", error);
    return NextResponse.json(
      { error: "Ошибка получения контента" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  const parsed = saveSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { type, ...payload } = parsed.data;

  try {
    const doc = await putSiteContent(type as SiteContentId, payload);
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Ошибка сохранения контента:", error);
    return NextResponse.json(
      { error: "Ошибка сохранения контента" },
      { status: 500 }
    );
  }
}
