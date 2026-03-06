"use client";

import { useTranslations } from "next-intl";
import { Barometre } from "@/components/Barometre";

export default function BarometrePage() {
  const t = useTranslations("Barometre");

  return (
    <div className="flex flex-col gap-6 md:gap-10">
      <header>
        <h1 className="text-3xl md:text-5xl font-jakarta font-bold text-foreground tracking-tighter mb-1 md:mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
          {t("page_title")}
        </h1>
        <p className="text-lg font-outfit text-primary/90 font-medium">
          {t("page_subtitle")}
        </p>
      </header>

      <Barometre />
    </div>
  );
}
