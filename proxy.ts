import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Permanent (301) redirects for legacy query-parameter language URLs so search
// engines and old bookmarks land on the new indexable paths.
export function proxy(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang");
  if (lang === "uzKrill" || lang === "uzLatin") {
    const url = request.nextUrl.clone();
    url.pathname = lang === "uzKrill" ? "/uz-krill" : "/uz-latin";
    url.search = "";
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
