import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminPanel } from "@/components/admin/admin-panel";

export const metadata: Metadata = {
  title: "Панель управления",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const authenticated = verifySessionToken(
    cookieStore.get(SESSION_COOKIE)?.value
  );

  return authenticated ? <AdminPanel /> : <AdminLogin />;
}
