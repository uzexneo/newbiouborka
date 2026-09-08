"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Settings,
  Package,
  Phone,
  FileText,
  Images,
  ImageIcon,
  Inbox,
  LogOut,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AdminServices } from "@/components/admin/admin-services";
import { AdminContacts } from "@/components/admin/admin-contacts";
import { AdminTexts } from "@/components/admin/admin-texts";
import { AdminGallery } from "@/components/admin/admin-gallery";
import { AdminMedia } from "@/components/admin/admin-media";
import { AdminApplications } from "@/components/admin/admin-applications";
import { AdminLogo } from "@/components/admin/admin-logo";
import { AdminAnalytics } from "@/components/admin/admin-analytics";

const sections = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard },
  { id: "services", label: "Услуги и цены", icon: Package },
  { id: "contacts", label: "Контакты", icon: Phone },
  { id: "texts", label: "Тексты сайта", icon: FileText },
  { id: "gallery", label: "Галерея", icon: Images },
  { id: "media", label: "Фон сайта", icon: ImageIcon },
  { id: "logo", label: "Логотип", icon: ImageIcon },
  { id: "applications", label: "Заявки клиентов", icon: Inbox },
  { id: "analytics", label: "Аналитика", icon: BarChart3 },
] as const;

type SectionId = (typeof sections)[number]["id"];

export function AdminPanel() {
  const router = useRouter();
  const [active, setActive] = useState<SectionId>("overview");

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      toast.success("Вы вышли из панели управления");
      router.refresh();
    } catch {
      toast.error("Не удалось выйти. Попробуйте ещё раз.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Панель управления
            </h1>
            <p className="text-sm text-muted-foreground">
              BIOUBORKA.UZ — управление контентом сайта
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Выйти
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Button
                key={section.id}
                variant={active === section.id ? "default" : "ghost"}
                onClick={() => setActive(section.id)}
                className={cn(
                  "justify-start gap-2 whitespace-nowrap",
                  active === section.id && "data-[slot=button]:bg-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </Button>
            );
          })}
        </nav>

        <Card>
          <CardHeader>
            <CardTitle>
              {sections.find((s) => s.id === active)?.label}
            </CardTitle>
            <CardDescription>
              {active === "overview"
                ? "Разделы панели управления будут доступны по мере реализации."
                : active === "analytics"
                  ? "Статистика посещаемости сайта за выбранный период."
                  : "Изменения сохраняются в базу данных и мгновенно отражаются на сайте."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {active === "overview" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sections
                  .filter((s) => s.id !== "overview")
                  .map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActive(section.id)}
                        className="flex flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">
                          {section.label}
                        </span>
                      </button>
                    );
                  })}
              </div>
            ) : active === "services" ? (
              <AdminServices />
            ) : active === "contacts" ? (
              <AdminContacts />
            ) : active === "texts" ? (
              <AdminTexts />
            ) : active === "gallery" ? (
              <AdminGallery />
            ) : active === "media" ? (
              <AdminMedia />
            ) : active === "logo" ? (
              <AdminLogo />
            ) : active === "applications" ? (
              <AdminApplications />
            ) : active === "analytics" ? (
              <AdminAnalytics />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Settings className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Раздел будет реализован в следующей задаче.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
