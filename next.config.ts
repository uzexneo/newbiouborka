import type { NextConfig } from "next";

const basePath =
  process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : "";

const nextConfig: NextConfig = {
  ...(process.env.SEO_VERIFICATION_THREAD_WORKERS === "1" && {
    experimental: { workerThreads: true, webpackBuildWorker: false, cpus: 2 },
  }),
  output: process.env.OUTPUT_MODE === "export" ? "export" : undefined,

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.biouborka.uz" }],
        destination: "https://biouborka.uz/:path*",
        permanent: true,
      },
      {
        source: "/prais",
        destination: "/#services",
        permanent: true,
      },
      {
        source: "/uborka",
        destination: "/uslugi/uborka",
        permanent: true,
      },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
  },

  ...(basePath && {
    basePath,
    assetPrefix: basePath,
  }),

  ...(process.env.OUTPUT_MODE === "export" && {
    images: {
      unoptimized: true,
    },
  }),
  allowedDevOrigins: ["*"],

  devIndicators: false,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
