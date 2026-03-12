"use client";

import React from "react";
import { Target, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function GamificationTeaser() {
  const t = useTranslations("LandingPage");

  return (
    <section className="py-20 px-4 bg-[#0B131E] relative">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-[#121A26] to-[#1A2332] border border-indigo-500/20 shadow-[0_20px_60px_rgba(99,102,241,0.15)] rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
          
          <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Target size={40} />
          </div>

          <h2 className="text-3xl md:text-5xl font-cormorant italic font-bold text-white mb-6 relative z-10">
            {t("gamification_title")}
          </h2>
          
          <p className="font-outfit text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 relative z-10">
            {t("gamification_desc")}
          </p>

          <Link
            href="/audit"
            className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-jakarta font-bold rounded-xl transition-all hover:-translate-y-1 shadow-[0_10px_25px_rgba(99,102,241,0.4)] relative z-10"
          >
            {t("gamification_cta")}
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
