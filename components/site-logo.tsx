"use client";

import { Leaf } from "lucide-react";
import { useSiteContent } from "@/lib/site-content-provider";

export function SiteLogo() {
  const { logo, logoSize } = useSiteContent();

  if (logo) {
    return (
      <div
        className="flex items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-border"
        style={{ width: logoSize, height: logoSize }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt="Логотип компании"
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground"
      style={{ width: logoSize, height: logoSize }}
    >
      <Leaf className="h-4 w-4" />
    </div>
  );
}
