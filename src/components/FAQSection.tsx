"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

function FAQItem({ questionKey, t }: { questionKey: string; t: ReturnType<typeof useTranslations> }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#1A1A1A]/10 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 md:py-6 text-left group"
      >
        <span className="font-jakarta font-semibold text-base md:text-lg text-[#1A1A1A] pr-8 group-hover:text-[#CC5833] transition-colors">
          {t(`${questionKey}_q`)}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-[#CC5833] shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100 pb-5" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <p className="font-outfit text-[#1A1A1A]/60 text-sm md:text-base leading-relaxed max-w-3xl">
            {t(`${questionKey}_a`)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FAQSection() {
  const t = useTranslations("FAQ");

  return (
    <section className="py-24 md:py-32 px-8 md:px-24 bg-[#F2F0E9]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="scroll-reveal font-jakarta text-3xl md:text-4xl font-bold text-[#1A1A1A]">
            {t("title")}
          </h2>
          <p className="scroll-reveal font-outfit text-lg text-[#1A1A1A]/50 mt-4">
            {t("subtitle")}
          </p>
        </div>

        <div className="scroll-reveal bg-white rounded-2xl px-6 md:px-8 divide-y divide-transparent">
          {FAQ_KEYS.map((key) => (
            <FAQItem key={key} questionKey={key} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
