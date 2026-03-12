"use client";

import { useTranslations } from "next-intl";
import { Play } from "lucide-react";

export function DemoVideoSection() {
  const t = useTranslations("DemoVideo");

  return (
    <section className="py-24 md:py-32 px-8 md:px-24 bg-[#F2F0E9]">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="scroll-reveal font-jakarta text-3xl md:text-4xl font-bold text-[#1A1A1A]">
            {t("title")}
          </h2>
          <p className="scroll-reveal font-outfit text-lg text-[#1A1A1A]/50 mt-4 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Browser frame mockup */}
        <div className="scroll-reveal max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-[#1A1A1A]/10">
            {/* Browser chrome */}
            <div className="bg-[#2E4036] px-4 py-3 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#CC5833]/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white/10 rounded-md px-4 py-1">
                  <span className="font-plex-mono text-xs text-white/50">{/* i18n-ignore */}app.rivehub.com/dashboard</span>
                </div>
              </div>
            </div>

            {/* Dashboard mockup content */}
            <div className="bg-[#1A1A1A] relative aspect-video flex items-center justify-center group cursor-pointer">
              {/* Stylized dashboard preview */}
              <div className="absolute inset-0 p-6 md:p-10 opacity-30">
                {/* Sidebar mock */}
                <div className="flex h-full gap-4">
                  <div className="w-16 md:w-20 flex flex-col gap-3">
                    <div className="w-full h-8 bg-white/10 rounded-md" />
                    <div className="w-full h-6 bg-[#CC5833]/20 rounded-md" />
                    <div className="w-full h-6 bg-white/5 rounded-md" />
                    <div className="w-full h-6 bg-white/5 rounded-md" />
                    <div className="w-full h-6 bg-white/5 rounded-md" />
                  </div>
                  {/* Main content mock */}
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex gap-3">
                      <div className="flex-1 h-20 md:h-24 bg-white/8 rounded-lg" />
                      <div className="flex-1 h-20 md:h-24 bg-white/8 rounded-lg" />
                      <div className="flex-1 h-20 md:h-24 bg-emerald-500/10 rounded-lg" />
                    </div>
                    <div className="flex-1 bg-white/5 rounded-lg" />
                    <div className="flex gap-3">
                      <div className="flex-1 h-16 bg-white/5 rounded-lg" />
                      <div className="flex-1 h-16 bg-[#CC5833]/10 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Play button overlay */}
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#CC5833] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-[#CC5833]/30">
                  <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="white" />
                </div>
                <span className="font-outfit text-sm text-[#F2F0E9]/60">
                  {t("play_label")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
