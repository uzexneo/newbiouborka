"use client";

import { useState } from "react";
import { Leaf } from "lucide-react";
import { useSiteContent } from "@/lib/site-content-provider";

export function SiteLogo({ showName }: { showName?: string }) {
  const { logo, logoSize } = useSiteContent();
  const [failed, setFailed] = useState(false);

  if (logo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt="Логотип компании"
        style={{ height: logoSize, width: "auto" }}
        className="object-contain"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span
        className="flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
        style={{ width: logoSize, height: logoSize }}
      >
        <Leaf className="h-4 w-4" />
      </span>
      {showName ? (
        <span className="text-lg font-semibold tracking-tight">{showName}</span>
      ) : null}
    </span>
  );
}
