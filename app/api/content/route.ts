import { NextResponse } from "next/server";
import { getServerPublicContent } from "@/lib/server-public-content";

export const dynamic = "force-dynamic";
const responseHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  const content = await getServerPublicContent();
  if (!content) {
    return NextResponse.json(
      { error: "Контент временно недоступен" },
      { status: 503, headers: responseHeaders }
    );
  }
  return NextResponse.json(content, { headers: responseHeaders });
}
