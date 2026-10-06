export const EXCLUDED_ANALYTICS_PATH_PATTERN =
  /^\/(?:admin|api|_next|demo|assets)(?:\/|$)|^\/(?:robots\.txt|sitemap\.xml|favicon\.ico)\/?$/i;

export function isPublicAnalyticsPath(path: string): boolean {
  const pathname = path.split(/[?#]/, 1)[0];
  return !EXCLUDED_ANALYTICS_PATH_PATTERN.test(pathname);
}
