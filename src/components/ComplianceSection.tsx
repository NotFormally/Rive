"use client";

import { useTranslations } from "next-intl";
import { Shield, Thermometer, ClipboardCheck, MapPin, AlertTriangle, FileCheck } from "lucide-react";

const COMPLIANCE_FEATURES = [
  { key: "geo_adaptive", icon: MapPin, color: "from-emerald-500/20 to-emerald-600/5", iconColor: "text-emerald-400", borderColor: "border-emerald-500/20" },
  { key: "checklists", icon: ClipboardCheck, color: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-400", borderColor: "border-blue-500/20" },
  { key: "temperature", icon: Thermometer, color: "from-orange-500/20 to-orange-600/5", iconColor: "text-orange-400", borderColor: "border-orange-500/20" },
  { key: "alerts", icon: AlertTriangle, color: "from-red-500/20 to-red-600/5", iconColor: "text-red-400", borderColor: "border-red-500/20" },
  { key: "audit_trail", icon: FileCheck, color: "from-indigo-500/20 to-indigo-600/5", iconColor: "text-indigo-400", borderColor: "border-indigo-500/20" },
  { key: "digital_records", icon: Shield, color: "from-violet-500/20 to-violet-600/5", iconColor: "text-violet-400", borderColor: "border-violet-500/20" },
] as const;

const JURISDICTIONS = ["MAPAQ", "FDA", "DDPP", "CFIA", "ACIA"];

export function ComplianceSection() {
  const t = useTranslations("ComplianceSection");

  return (
    <section className="relative py-24 md:py-32 bg-[#0B131E] text-[#F2F0E9] overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #F2F0E9 1px, transparent 0)`,
        backgroundSize: "32px 32px",
      }} />

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#2E4036]/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-screen-xl mx-auto px-8 md:px-24">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="scroll-reveal inline-flex items-center gap-2 bg-[#2E4036]/30 border border-[#2E4036]/50 px-4 py-1.5 rounded-full mb-6">
            <Shield className="w-4 h-4 text-[#2E4036]" />
            <span className="font-plex-mono text-xs uppercase tracking-[0.2em] text-emerald-400/80">HACCP</span>
          </div>
          <h2 className="scroll-reveal font-cormorant italic font-semibold text-4xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
            {t("title")}
          </h2>
          <p className="scroll-reveal font-outfit text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Jurisdiction badges */}
        <div className="scroll-reveal flex flex-wrap items-center justify-center gap-3 mb-16">
          {JURISDICTIONS.map((j) => (
            <div key={j} className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 font-plex-mono text-xs tracking-wider text-slate-300">
              {j}
            </div>
          ))}
          <div className="bg-[#CC5833]/10 border border-[#CC5833]/30 rounded-full px-4 py-1.5 font-plex-mono text-xs tracking-wider text-[#CC5833]">
            {t("more_jurisdictions")}
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {COMPLIANCE_FEATURES.map(({ key, icon: Icon, color, iconColor, borderColor }) => (
            <div
              key={key}
              className={`scroll-reveal group relative bg-[#1A1A1A] rounded-[2rem] p-7 border ${borderColor} hover:border-white/20 transition-all duration-500 hover:translate-y-[-2px]`}
            >
              {/* Gradient glow on hover */}
              <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className={`w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="font-jakarta font-bold text-lg mb-2">{t(`${key}_title`)}</h3>
                <p className="font-outfit text-sm text-slate-400 leading-relaxed">{t(`${key}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA stat bar */}
        <div className="scroll-reveal mt-16 bg-[#1A1A1A] rounded-[2rem] border border-white/[0.06] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-jakarta font-bold text-2xl md:text-3xl mb-2">{t("cta_title")}</h3>
            <p className="font-outfit text-slate-400 text-base">{t("cta_desc")}</p>
          </div>
          <div className="flex items-center gap-6">
            {/* Stat pills */}
            <div className="text-center">
              <div className="font-cormorant font-bold text-4xl text-emerald-400">100%</div>
              <div className="font-plex-mono text-[10px] uppercase tracking-widest text-slate-500 mt-1">{t("stat_digital")}</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="font-cormorant font-bold text-4xl text-[#CC5833]">0</div>
              <div className="font-plex-mono text-[10px] uppercase tracking-widest text-slate-500 mt-1">{t("stat_paper")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
