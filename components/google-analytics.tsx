"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  EXCLUDED_ANALYTICS_PATH_PATTERN,
  isPublicAnalyticsPath,
} from "@/lib/analytics-paths";

const GA_ID = "G-7E7Y9R3R19";
const GA_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;

export function GoogleAnalytics() {
  const pathname = usePathname();

  if (!isPublicAnalyticsPath(pathname)) return null;

  return (
    <>
      <Script src={GA_SRC} strategy="afterInteractive" />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          // Check the current path at send time, including SPA history events.
          Object.defineProperty(window, 'ga-disable-${GA_ID}', {
            configurable: true,
            get: function() {
              return ${EXCLUDED_ANALYTICS_PATH_PATTERN.toString()}.test(window.location.pathname);
            }
          });
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
