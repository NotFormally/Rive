"use client";

import React, { useState, useEffect } from "react";
import { Anchor, Compass, Users, TrendingUp, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function IntelligenceJourney() {
  const t = useTranslations("LandingPage");
  const [activePhase, setActivePhase] = useState(0);
  const [boatPosition, setBoatPosition] = useState(0);

  // Animate boat position
  useEffect(() => {
    setBoatPosition((activePhase / 3) * 100);
  }, [activePhase]);

  const phases = [
    {
      milestone: 40,
      title: t("journey_phase0_title"),
      subtitle: t("journey_phase0_sub"),
      description: t("journey_phase0_desc"),
      features: [t("journey_phase0_f1"), t("journey_phase0_f2"), t("journey_phase0_f3")],
      color: "bg-[#1A2332]",
      borderColor: "border-blue-500/30",
      icon: "MapPin",
      iconColor: "text-blue-400",
      unlocked: t("journey_phase0_unlock"),
    },
    {
      milestone: 65,
      title: t("journey_phase1_title"),
      subtitle: t("journey_phase1_sub"),
      description: t("journey_phase1_desc"),
      features: [t("journey_phase1_f1"), t("journey_phase1_f2"), t("journey_phase1_f3")],
      color: "bg-[#1A2332]",
      borderColor: "border-cyan-500/30",
      icon: "TrendingUp",
      iconColor: "text-cyan-400",
      unlocked: t("journey_phase1_unlock"),
    },
    {
      milestone: 95,
      title: t("journey_phase2_title"),
      subtitle: t("journey_phase2_sub"),
      description: t("journey_phase2_desc"),
      features: [t("journey_phase2_f1"), t("journey_phase2_f2"), t("journey_phase2_f3")],
      color: "bg-[#1A2332]",
      borderColor: "border-emerald-500/30",
      icon: "Compass",
      iconColor: "text-emerald-400",
      unlocked: t("journey_phase2_unlock"),
    },
    {
      milestone: 100,
      title: t("journey_phase3_title"),
      subtitle: t("journey_phase3_sub"),
      description: t("journey_phase3_desc"),
      features: [t("journey_phase3_f1"), t("journey_phase3_f2"), t("journey_phase3_f3")],
      color: "bg-[#1A2332]",
      borderColor: "border-amber-500/30",
      icon: "CheckCircle2",
      iconColor: "text-amber-400",
      unlocked: t("journey_phase3_unlock"),
    },
  ];

  return (
    <section className="py-20 px-4 bg-[#0B131E] relative overflow-hidden text-[#F2F0E9]">
      {/* Soft geometric background accent */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-screen-xl mx-auto relative z-10">
        <h2 className="text-3xl md:text-5xl font-cormorant italic font-bold text-center mb-4 text-[#F2F0E9]">
          {t("journey_title")}
        </h2>
        <p className="text-center font-outfit text-slate-300 mb-16 max-w-2xl mx-auto text-lg">
          {t("journey_subtitle")}
        </p>

        {/* Animated Timeline */}
        <div className="mb-16 max-w-4xl mx-auto">
          {/* Visual Timeline with Boat */}
          <div className="relative h-24 bg-[#121A26] rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden">
            {/* The waterline string */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-[#CC5833]/20 via-[#CC5833] to-[#00FFAA] opacity-50"></div>

            {/* Boat Animation */}
            <div
              className="absolute top-1/2 -mt-4 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-20"
              style={{
                left: `calc(10% + ${boatPosition * 0.8}%)`, // map 0-100 to 10%-90% so boat doesn't fall off
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="text-3xl filter drop-shadow-[0_0_10px_rgba(204,88,51,0.5)]">⛵</div>
            </div>

            {/* Waypoints */}
            <div className="absolute inset-0 flex items-center justify-between px-8 md:px-12 z-10">
              {phases.map((phase, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center cursor-pointer group"
                  onClick={() => setActivePhase(idx)}
                >
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 backdrop-blur-md
                      ${
                        activePhase === idx
                          ? "bg-[#CC5833] border-[#CC5833] scale-110 shadow-[0_0_20px_rgba(204,88,51,0.4)] text-white"
                          : "bg-[#1A2332] border-white/20 text-white/50 group-hover:border-white/50 group-hover:text-white"
                      }
                    `}
                  >
                    <span className="font-outfit font-bold text-xs md:text-sm">
                      {phase.milestone}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Phase Details */}
        <div className="grid lg:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto bg-[#121A26] border border-white/5 p-8 md:p-12 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden">
          {/* Subtle glow behind the active icon */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>

          {/* Left: Animated Icon */}
          <div className="flex justify-center items-center relative z-10 lg:justify-end">
            <div
              className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center transition-all duration-500 ${phases[activePhase].color} ${phases[activePhase].borderColor} border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]`}
            >
              {phases[activePhase].icon === "MapPin" && (
                <MapPin size={48} className={phases[activePhase].iconColor} />
              )}
              {phases[activePhase].icon === "TrendingUp" && (
                <TrendingUp size={48} className={phases[activePhase].iconColor} />
              )}
              {phases[activePhase].icon === "Compass" && (
                <Compass size={48} className={phases[activePhase].iconColor} />
              )}
              {phases[activePhase].icon === "CheckCircle2" && (
                <CheckCircle2 size={48} className={phases[activePhase].iconColor} />
              )}
            </div>
          </div>

          {/* Middle & Right: Phase Info */}
          <div className="lg:col-span-2 relative z-10">
            <h3 className="font-jakarta text-3xl md:text-4xl font-bold mb-2 text-white">
              {phases[activePhase].title}
            </h3>
            <p className="font-plex-mono text-sm tracking-widest uppercase text-[#CC5833] mb-6">
              {phases[activePhase].subtitle}
            </p>
            <p className="font-outfit text-lg text-slate-300 mb-8 leading-relaxed max-w-xl">
              {phases[activePhase].description}
            </p>

            <div className="mb-8">
              <p className="font-jakarta text-xs uppercase tracking-wider text-slate-400 mb-4">
                {t("journey_features_title")}
              </p>
              <div className="flex flex-wrap gap-3">
                {phases[activePhase].features.map((feat, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-[#1A2332] border border-white/5 rounded-xl text-sm font-outfit text-slate-200 shadow-sm"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>

            <div className="inline-flex items-center gap-3 px-5 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
              <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
              <span className="font-outfit text-sm font-medium text-indigo-200">
                <span className="text-slate-400 mr-2">{t("journey_power_unlocked")}</span>
                {phases[activePhase].unlocked}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
