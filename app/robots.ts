import type { MetadataRoute } from "next";

const baseUrl = "https://biouborka.uz";

export default function robots(): MetadataRoute.Robots {
  if (process.env.NODE_ENV === "development") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/demo"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
