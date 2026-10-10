"use client";

export function refreshPublicContent(): void {
  window.dispatchEvent(new Event("biouborka:content-updated"));
}
