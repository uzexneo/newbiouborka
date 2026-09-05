"use client";

import { Leaf } from "lucide-react";
import { useSiteContent } from "@/lib/site-content-provider";

export function SiteLogo() {
  const { logo } = useSiteContent();

  if (logo) {
    return (
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-border">
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
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <Leaf className="h-4 w-4" />
    </div>
  );
}
