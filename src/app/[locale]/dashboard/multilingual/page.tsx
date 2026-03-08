"use client";

import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Check, Languages } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, { name: string; native: string; flag: string }> = {
  en: { name: "English", native: "English", flag: "🇬🇧" },
  fr: { name: "French", native: "Français", flag: "🇫🇷" },
  es: { name: "Spanish", native: "Español", flag: "🇪🇸" },
  de: { name: "German", native: "Deutsch", flag: "🇩🇪" },
  it: { name: "Italian", native: "Italiano", flag: "🇮🇹" },
  pt: { name: "Portuguese", native: "Português", flag: "🇧🇷" },
  nl: { name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  pl: { name: "Polish", native: "Polski", flag: "🇵🇱" },
  ru: { name: "Russian", native: "Русский", flag: "🇷🇺" },
  tr: { name: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  ar: { name: "Arabic", native: "العربية", flag: "🇸🇦" },
  hi: { name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  bn: { name: "Bengali", native: "বাংলা", flag: "🇧🇩" },
  pa: { name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  ta: { name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  ja: { name: "Japanese", native: "日本語", flag: "🇯🇵" },
  ko: { name: "Korean", native: "한국어", flag: "🇰🇷" },
  "zh-CN": { name: "Chinese (Simplified)", native: "简体中文", flag: "🇨🇳" },
  "zh-HK": { name: "Chinese (Traditional)", native: "繁體中文", flag: "🇭🇰" },
  th: { name: "Thai", native: "ไทย", flag: "🇹🇭" },
  vi: { name: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳" },
  id: { name: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩" },
  ms: { name: "Malay", native: "Bahasa Melayu", flag: "🇲🇾" },
  tl: { name: "Filipino", native: "Tagalog", flag: "🇵🇭" },
  nan: { name: "Min Nan", native: "閩南語", flag: "🇹🇼" },
};

export default function MultilingualPage() {
  const t = useTranslations("Sidebar");
  const locale = useLocale();
  const { profile } = useAuth();
  const allLocales = routing.locales;
  const currentInfo = LOCALE_LABELS[locale] || { name: locale, native: locale, flag: "🌐" };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Globe className="w-7 h-7 text-cyan-400" />
        <h1 className="text-2xl font-outfit font-bold text-foreground">
          {t("nav_multilingual_team") || "Multilingual Team"}
        </h1>
      </div>

      {/* Current Language */}
      <Card className="border-cyan-500/20 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-outfit flex items-center gap-2">
            <Languages className="w-5 h-5 text-cyan-400" />
            {t("active_language") || "Active Language"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
            <span className="text-3xl">{currentInfo.flag}</span>
            <div>
              <p className="font-outfit font-bold text-lg text-foreground">{currentInfo.native}</p>
              <p className="text-sm text-muted-foreground">{currentInfo.name}</p>
            </div>
            <Check className="w-5 h-5 text-cyan-400 ml-auto" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {profile?.restaurant_name
              ? `${profile.restaurant_name} — ${currentInfo.native}`
              : currentInfo.native}
          </p>
        </CardContent>
      </Card>

      {/* All Supported Languages */}
      <Card className="border-white/5 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-outfit flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            {allLocales.length} {t("active_language") ? "Languages" : "Languages"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {allLocales.map((loc) => {
              const info = LOCALE_LABELS[loc] || { name: loc, native: loc, flag: "🌐" };
              const isCurrent = loc === locale;
              return (
                <Link
                  key={loc}
                  href="/dashboard/multilingual"
                  locale={loc}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all text-sm ${
                    isCurrent
                      ? "bg-cyan-500/10 border border-cyan-500/20 text-foreground font-semibold"
                      : "hover:bg-white/5 border border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-lg">{info.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-outfit">{info.native}</p>
                    <p className="text-xs opacity-60 truncate">{info.name}</p>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
