"use client";

import { Globe } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { canLocalizePathname, isLocale, languages } from "@/lib/i18n/config";
import { useLanguage } from "@/lib/i18n/language-provider";

export function LanguageSwitcher() {
  const { locale, setLocale, isChangingLocale, t } = useLanguage();
  const pathname = usePathname();

  if (!canLocalizePathname(pathname)) {
    return null;
  }

  return (
    <Select
      value={locale}
      disabled={isChangingLocale}
      onValueChange={(value) => {
        if (isLocale(value)) setLocale(value);
      }}
      items={languages.map((lang) => ({
        value: lang.code,
        label: lang.nativeName,
      }))}
    >
      <SelectTrigger size="sm" aria-label={t("switch.label")}>
        <Globe className="size-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="font-medium">{lang.nativeName}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
