"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTranslations } from "next-intl";
import { Loader2, X, Sparkles, BookOpen, ShieldCheck, Languages, BarChart3, Camera, Image, CreditCard } from "lucide-react";

const TRIAL_FEATURE_ICONS = [BookOpen, ShieldCheck, Languages, BarChart3, Image, Camera];

type TrialModalProps = {
  isOpen: boolean;
  onClose: () => void;
  priceId?: string;
};

export function TrialModal({ isOpen, onClose, priceId }: TrialModalProps) {
  const t = useTranslations('TrialModal');
  const tCommon = useTranslations('Common');
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const features = TRIAL_FEATURE_ICONS.map((icon, i) => ({
    icon,
    label: t(`feature${i + 1}_label`),
    desc: t(`feature${i + 1}_desc`),
  }));

  const handleSubscribe = async () => {
    if (authLoading) return;
    
    // If not logged in, redirect to signup
    if (!profile) {
      window.location.assign(`/signup?plan=${priceId}&checkout=true`);
      return;
    }

    // If logged in, go straight to Stripe
    try {
      setLoading(true);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, restaurantId: profile.id })
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert(tCommon('error_payment'));
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl bg-[#F2F0E9] rounded-[2rem] shadow-2xl overflow-hidden"
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
            <h2 className="font-jakarta font-bold text-2xl">{t('title')}</h2>
          </div>
          <p className="font-outfit text-white/80 text-base leading-relaxed max-w-lg">
            {t('description_before')} <strong className="text-white">{t('description_bold')}</strong> {t('description_after')}
          </p>
        </div>

        {/* Quota Grid */}
        <div className="px-6 sm:px-8 md:px-12 py-8">
          <p className="font-plex-mono text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-5">
            {t('credits_label')}
          </p>
          <div className="flex flex-col gap-3 w-full">
            {features.map((feature) => (
              <div
                key={feature.label}
                className="flex flex-row items-start gap-3 md:gap-4 bg-white rounded-xl p-3 md:p-4 border border-slate-100 hover:-translate-y-0.5 transition-transform duration-300 min-w-0"
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
            {t('cta_free')}
          </a>

          {priceId && (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full text-center py-3.5 rounded-[2rem] font-semibold text-sm bg-transparent border-2 border-[#2E4036]/20 text-[#2E4036] hover:border-[#2E4036]/50 hover:bg-[#2E4036]/5 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  {t('cta_subscribe')}
                </>
              )}
            </button>
          )}

          <p className="text-center font-outfit text-xs text-slate-400">
            {t('footer_note')}
          </p>
        </div>
      </div>
    </div>
  );
}
