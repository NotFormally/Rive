"use client";

import { useTranslations } from "next-intl";
import { X, Check } from "lucide-react";

const COMPARISON_KEYS = ["inventory", "orders", "compliance", "management", "waste", "language"] as const;

export function BeforeAfterComparison() {
  const t = useTranslations("BeforeAfter");

  return (
    <section className="py-24 md:py-32 px-8 md:px-24 bg-white text-[#1A1A1A] border-t border-slate-100">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="scroll-reveal font-jakarta text-3xl md:text-4xl font-bold">
            {t("title")}
          </h2>
          <p className="scroll-reveal font-outfit text-lg text-slate-500 mt-4 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Comparison grid */}
        <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {/* Without Rive */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="font-jakarta font-bold text-lg text-[#1A1A1A]">{t("without_title")}</h3>
            </div>
            <ul className="space-y-4">
              {COMPARISON_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <X className="w-3 h-3 text-red-500" />
                  </span>
                  <span className="font-outfit text-sm text-slate-600 leading-relaxed">
                    {t(`without_${key}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* With Rive */}
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 md:p-8 relative overflow-hidden shadow-sm shadow-emerald-100">
            {/* Subtle glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-300/30 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-jakarta font-bold text-lg text-[#1A1A1A]">{t("with_title")}</h3>
              </div>
              <ul className="space-y-4">
                {COMPARISON_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100/50 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </span>
                    <span className="font-outfit text-sm text-slate-700 font-medium leading-relaxed">
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
