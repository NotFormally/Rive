"use client";

import { useTranslations } from "next-intl";
import { X, Check } from "lucide-react";

const COMPARISON_KEYS = ["inventory", "orders", "compliance", "management", "waste"] as const;

export function BeforeAfterComparison() {
  const t = useTranslations("BeforeAfter");

  return (
    <section className="py-24 md:py-32 px-8 md:px-24 bg-[#1A1A1A] text-[#F2F0E9]">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="scroll-reveal font-jakarta text-3xl md:text-4xl font-bold">
            {t("title")}
          </h2>
          <p className="scroll-reveal font-outfit text-lg text-[#F2F0E9]/50 mt-4 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Comparison grid */}
        <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {/* Without Rive */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-6 md:p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <X className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="font-jakarta font-bold text-lg">{t("without_title")}</h3>
            </div>
            <ul className="space-y-4">
              {COMPARISON_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <X className="w-3 h-3 text-red-400" />
                  </span>
                  <span className="font-outfit text-sm text-[#F2F0E9]/60 leading-relaxed">
                    {t(`without_${key}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* With Rive */}
          <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 p-6 md:p-8 relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-jakarta font-bold text-lg">{t("with_title")}</h3>
              </div>
              <ul className="space-y-4">
                {COMPARISON_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </span>
                    <span className="font-outfit text-sm text-[#F2F0E9]/80 leading-relaxed">
                      {t(`with_${key}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
