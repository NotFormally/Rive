"use client";

import { useTranslations } from "next-intl";
import { Plug, Brain, BellRing } from "lucide-react";

const steps = [
  { icon: Plug, key: "step1" },
  { icon: Brain, key: "step2" },
  { icon: BellRing, key: "step3" },
] as const;

export function HowItWorks() {
  const t = useTranslations("HowItWorks");

  return (
    <section className="py-24 md:py-32 px-8 md:px-24 bg-[#F2F0E9]">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="scroll-reveal font-jakarta text-3xl md:text-4xl font-bold text-[#1A1A1A]">
            {t("title")}
          </h2>
          <p className="scroll-reveal font-outfit text-lg text-[#1A1A1A]/50 mt-4 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-[1px] bg-[#CC5833]/20" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="scroll-reveal relative flex flex-col items-center text-center px-6">
                {/* Step number + icon */}
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-[#1A1A1A] flex items-center justify-center relative z-10">
                    <Icon className="w-10 h-10 text-[#CC5833]" strokeWidth={1.5} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#CC5833] text-white font-plex-mono text-xs font-bold flex items-center justify-center z-20">
                    {i + 1}
                  </span>
                </div>

                <h3 className="font-jakarta font-bold text-xl text-[#1A1A1A] mb-3">
                  {t(`${step.key}_title`)}
                </h3>
                <p className="font-outfit text-[#1A1A1A]/60 text-sm leading-relaxed max-w-xs">
                  {t(`${step.key}_desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
