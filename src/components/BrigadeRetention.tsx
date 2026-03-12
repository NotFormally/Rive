"use client";

import React from "react";
import { Users, BookOpen, Award } from "lucide-react";
import { useTranslations } from "next-intl";

export function BrigadeRetention() {
  const t = useTranslations("LandingPage");

  return (
    <section className="py-24 px-4 bg-[#121A26] relative overflow-hidden border-t border-white/5">
      <div className="max-w-screen-xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 font-plex-mono text-sm tracking-widest uppercase mb-6">
            <Users size={16} />
            {t("brigade_badge")}
          </div>
          <h2 className="text-4xl md:text-5xl font-cormorant italic font-bold text-white mb-6">
            {t("brigade_title")}
          </h2>
          <p className="font-outfit text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t("brigade_desc")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="bg-[#1A2332] border border-white/5 p-8 rounded-[2rem] hover:border-emerald-500/30 transition-colors group">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users size={32} />
            </div>
            <h3 className="text-xl font-bold font-jakarta text-white mb-4">
              {t("brigade_f1_title")}
            </h3>
            <p className="text-slate-400 font-outfit leading-relaxed">
              {t("brigade_f1_desc")}
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#1A2332] border border-white/5 p-8 rounded-[2rem] hover:border-blue-500/30 transition-colors group">
            <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen size={32} />
            </div>
            <h3 className="text-xl font-bold font-jakarta text-white mb-4">
              {t("brigade_f2_title")}
            </h3>
            <p className="text-slate-400 font-outfit leading-relaxed">
              {t("brigade_f2_desc")}
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#1A2332] border border-white/5 p-8 rounded-[2rem] hover:border-amber-500/30 transition-colors group">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Award size={32} />
            </div>
            <h3 className="text-xl font-bold font-jakarta text-white mb-4">
              {t("brigade_f3_title")}
            </h3>
            <p className="text-slate-400 font-outfit leading-relaxed">
              {t("brigade_f3_desc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
