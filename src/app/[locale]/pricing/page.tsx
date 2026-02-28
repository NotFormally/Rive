import { Link } from "@/i18n/routing";
import { Check } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { WasteCostCalculator } from "@/components/WasteCostCalculator";
import { SocialProofBanner } from "@/components/SocialProofBanner";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale;
  const t = await getTranslations({ locale, namespace: 'Meta' });
  return {
    title: t('pricing_title'),
    description: t('pricing_description'),
  };
}

export default function PricingPage() {
  const t = useTranslations("Pricing");

  const tiers = [
    {
      name: "Essence",
      priceId: "Essence_mensuel",
      price: 59,
      description: t('tier_essential_desc'),
      features: [
        t('feature_editor'),
        t('feature_logbook'),
        t('feature_i18n'),
      ],
      color: "bg-[#1A1A1A]",
      textColor: "text-[#F2F0E9]",
      borderColor: "border-[#1A1A1A]",
      ctaColor: "bg-[#F2F0E9] text-[#1A1A1A] hover:bg-white",
      iconColor: "text-[#F2F0E9]/60",
      featured: true,
    },
    {
      name: "Performance",
      priceId: "Performance_mensuel",
      price: 129,
      description: t('tier_performance_desc'),
      includesFrom: "Essence",
      features: [
        t('feature_foodcost'),
        t('feature_bcg'),
        t('feature_insta'),
        t('feature_ocr'),
      ],
      color: "bg-white",
      textColor: "text-[#1A1A1A]",
      borderColor: "border-black/10",
      ctaColor: "bg-[#1A1A1A] text-[#F2F0E9] hover:bg-[#333]",
      iconColor: "text-[#1A1A1A]/40",
      featured: false,
    },
    {
      name: "Intelligence",
      priceId: "Intelligence_mensuel",
      price: 249,
      description: t('tier_intelligence_desc'),
      includesFrom: "Performance",
      features: [
        t('feature_reservations'),
        t('feature_preplists'),
        t('feature_support'),
      ],
      color: "bg-[#1A1A1A]",
      textColor: "text-[#F2F0E9]",
      borderColor: "border-[#1A1A1A]",
      ctaColor: "bg-[#F2F0E9] text-[#1A1A1A] hover:bg-white",
      iconColor: "text-[#F2F0E9]/60",
      featured: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F2F0E9] noise-bg">
      {/* Minimal Navbar */}
      <nav className="flex items-center justify-between px-8 md:px-24 py-6 max-w-screen-xl mx-auto">
        <Link href="/" className="font-outfit font-semibold text-xl text-[#1A1A1A] tracking-[0.3em] uppercase">
          RIVE
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-[#2E4036] hover:-translate-y-[1px] transition-transform"
        >
          {t('nav_login')}
        </Link>
      </nav>

      {/* Header */}
      <div className="text-center pt-16 pb-8 px-8">
        <h1 className="font-jakarta font-bold text-5xl md:text-6xl text-[#1A1A1A] tracking-tight mb-6">
          {t('title')}
        </h1>
        <p className="font-outfit text-xl text-slate-500 max-w-xl mx-auto mb-6">
          {t('subtitle')}
        </p>
        <div className="inline-flex items-center gap-2 bg-[#2E4036] text-[#F2F0E9] font-outfit text-sm font-medium px-5 py-2 rounded-full">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          {t('badge_free')}
        </div>
      </div>

      {/* Waste Cost Calculator Section */}
      <div className="max-w-screen-xl mx-auto px-8 md:px-24 pb-16 pt-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-jakarta font-bold text-2xl md:text-3xl text-[#1A1A1A] text-center mb-3">
            {t('waste_calculator_title')}
          </h2>
          <p className="font-outfit text-sm text-slate-500 text-center mb-8">
            {t('waste_calculator_subtitle')}
          </p>
          <WasteCostCalculator variant="pricing" />
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="max-w-screen-xl mx-auto px-8 md:px-24 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`${tier.color} ${tier.textColor} rounded-2xl p-8 md:p-10 border ${tier.borderColor} relative flex flex-col h-full transition-colors duration-300`}
            >
              {/* Featured badge */}
              {tier.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 border border-current/20 bg-[#1A1A1A] text-[#F2F0E9] font-plex-mono text-[10px] font-medium uppercase tracking-[0.2em] px-4 py-1.5 rounded-full whitespace-nowrap">
                  {t('pricing_popular')}
                </div>
              )}

              {/* Name + Price */}
              <div className="mb-8 pt-4">
                <h2 className="font-outfit font-semibold text-sm uppercase tracking-[0.2em] opacity-50 mb-4">{tier.name}</h2>
                <div className="flex items-baseline gap-1">
                  <span className="font-jakarta font-bold text-5xl tracking-tight">{tier.price}$</span>
                  <span className="font-outfit text-sm opacity-40">
                    {t('month')}
                  </span>
                </div>
                <p className="font-outfit text-sm opacity-50 mt-3">
                  {tier.description}
                </p>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-current/10 mb-6" />

              {/* Features */}
              <div className="mb-8 flex-1">
                <h3 className="font-plex-mono text-[10px] uppercase tracking-[0.2em] opacity-40 mb-4">
                  {t('section_get')}
                </h3>
                {tier.includesFrom && (
                  <p className="font-outfit text-xs opacity-40 mb-3">
                    {t('pricing_includes', { tier: tier.includesFrom })}
                  </p>
                )}
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm font-outfit">
                      <Check className={`w-4 h-4 ${tier.iconColor} shrink-0`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="mt-auto">
                <CheckoutButton
                  priceId={tier.priceId}
                  cta={t('cta_start')}
                  ctaColor={tier.ctaColor}
                  presentationClasses="rounded-full"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof Banner */}
        <div className="mt-16">
          <SocialProofBanner variant="pricing" />
        </div>

        {/* Customized / Groups Tier */}
        <div className="mt-20 w-full max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 md:p-12 border border-black/10 relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-jakarta font-bold text-3xl mb-3 text-[#1A1A1A]">
                {t('enterprise_custom_title')}
              </h2>
              <p className="font-outfit text-slate-500 text-lg">
                {t('enterprise_custom_desc')}
              </p>
            </div>
            <a
              href="mailto:dock@rivehub.com"
              className="px-8 py-4 bg-[#1A1A1A] text-[#F2F0E9] font-outfit font-medium rounded-full hover:bg-[#333] transition-colors whitespace-nowrap flex-shrink-0"
            >
              {t('enterprise_custom_cta')}
            </a>
          </div>
        </div>

        {/* Trust Elements */}
        <div className="mt-24 text-center">
          <p className="font-plex-mono text-xs text-slate-400 uppercase tracking-widest mb-4">
            {t('powered_by')}
          </p>
          <div className="flex items-center justify-center gap-8 text-slate-400 font-outfit text-sm">
            <span>Anthropic AI</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>Supabase</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>Next.js</span>
          </div>
        </div>
      </div>
    </div>
  );
}
