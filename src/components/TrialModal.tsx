"use client";

import { useState } from "react";
import { X, Sparkles, BookOpen, ShieldCheck, Languages, BarChart3, Camera, Image, CreditCard } from "lucide-react";

const TRIAL_FEATURES = [
  { icon: BookOpen, label: "150 notes IA", desc: "Logbook intelligent" },
  { icon: ShieldCheck, label: "40 actions correctives", desc: "Suggestions IA" },
  { icon: Languages, label: "30 traductions", desc: "Multilingue" },
  { icon: BarChart3, label: "2 analyses de menu", desc: "Optimisation de carte" },
  { icon: Image, label: "20 posts Instagram", desc: "Contenu IA" },
  { icon: Camera, label: "10 scans de reçus", desc: "Numérisation IA" },
];

type TrialModalProps = {
  isOpen: boolean;
  onClose: () => void;
  priceId?: string;
};

export function TrialModal({ isOpen, onClose, priceId }: TrialModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl bg-[#F2F0E9] rounded-[2rem] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#2E4036] px-8 md:px-12 pt-10 pb-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#CC5833] p-2.5 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="font-jakarta font-bold text-2xl">Essai 100% gratuit</h2>
          </div>
          <p className="font-outfit text-white/80 text-base leading-relaxed max-w-lg">
            Créez votre espace restaurant en 30 secondes. <strong className="text-white">Aucune carte de crédit requise.</strong> Accédez à toutes les fonctionnalités IA de Rive avec des quotas généreux.
          </p>
        </div>

        {/* Quota Grid */}
        <div className="px-6 sm:px-8 md:px-12 py-8">
          <p className="font-plex-mono text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-5">
            Vos crédits gratuits
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {TRIAL_FEATURES.map((feature) => (
              <div
                key={feature.label}
                className="flex flex-row items-start gap-3 md:gap-4 bg-white rounded-xl p-3 md:p-4 border border-slate-100 hover:-translate-y-0.5 transition-transform duration-300"
              >
                <div className="bg-[#2E4036]/10 p-1.5 rounded-lg shrink-0 mt-0.5">
                  <feature.icon className="w-4 h-4 md:w-5 md:h-5 text-[#2E4036]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-jakarta font-bold text-[13px] md:text-sm text-[#1A1A1A] leading-tight mb-0.5">{feature.label}</p>
                  <p className="font-outfit text-[11px] md:text-sm text-slate-400 leading-tight">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 md:px-12 pb-10 space-y-4">
          <a
            href="/signup"
            className="block w-full text-center py-4 rounded-[2rem] font-bold text-base bg-[#CC5833] text-white hover:bg-[#b84d2d] transition-all duration-300 hover:scale-[1.03] shadow-lg shadow-[#CC5833]/20"
          >
            Créer mon espace gratuitement →
          </a>

          {priceId && (
            <a
              href={`/signup?plan=${priceId}&checkout=true`}
              className="flex items-center justify-center gap-2 w-full text-center py-3.5 rounded-[2rem] font-semibold text-sm bg-transparent border-2 border-[#2E4036]/20 text-[#2E4036] hover:border-[#2E4036]/50 hover:bg-[#2E4036]/5 transition-all duration-300"
            >
              <CreditCard className="w-4 h-4" />
              S'abonner maintenant
            </a>
          )}

          <p className="text-center font-outfit text-xs text-slate-400">
            Le paiement n'intervient qu'une fois vos crédits gratuits épuisés.
          </p>
        </div>
      </div>
    </div>
  );
}
