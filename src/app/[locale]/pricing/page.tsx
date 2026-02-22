import { Link } from "@/i18n/routing";
import { Check, X } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { useTranslations } from "next-intl";

// Force rebuild cache
export default function PricingPage() {
  const t = useTranslations("Pricing");
  const tiers = [
    {
      name: t('tier_essential_name'),
      emoji: "🌱",
      badge: t('tier_essential_badge'),
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL,
      price: 49,
      description: t('tier_essential_desc'),
      features: [
        { name: t('feature_editor'), included: true },
        { name: t('feature_logbook'), included: true },
        { name: t('feature_i18n'), included: true },
        { name: t('feature_foodcost'), included: false },
        { name: t('feature_bcg'), included: false },
        { name: t('feature_insta'), included: false },
        { name: t('feature_ocr'), included: false },
        { name: t('feature_support'), included: false },
      ],
      cta: t('cta_trial'),
      color: "bg-[#2E4036]",
      textColor: "text-[#F2F0E9]",
      borderColor: "border-[#2E4036]",
      ctaColor: "bg-[#CC5833] text-white hover:bg-[#b84d2d]",
      iconColor: "text-green-400",
      dimIconColor: "text-[#F2F0E9]/20",
      dimTextColor: "text-[#F2F0E9]/40",
      featureTextColor: "text-[#F2F0E9]/90",
      presentationClasses: "md:scale-[1.05] z-10 shadow-2xl shadow-[#2E4036]/30 ring-2 ring-[#CC5833]",
      isTrial: true,
    },
    {
      name: t('tier_performance_name'),
      emoji: "⚡",
      badge: t('tier_performance_badge'),
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PERFORMANCE,
      price: 99,
      description: t('tier_performance_desc'),
      features: [
        { name: t('feature_editor'), included: true },
        { name: t('feature_logbook'), included: true },
        { name: t('feature_i18n'), included: true },
        { name: t('feature_foodcost'), included: true },
        { name: t('feature_bcg'), included: true },
        { name: t('feature_insta'), included: true },
        { name: t('feature_ocr'), included: false },
        { name: t('feature_support'), included: false },
      ],
      cta: t('cta_trial'),
      color: "bg-[#F2F0E9]",
      textColor: "text-[#1A1A1A]",
      borderColor: "border-slate-300",
      ctaColor: "bg-[#1A1A1A] text-[#F2F0E9] hover:bg-[#333]",
      iconColor: "text-[#2E4036]",
      dimIconColor: "text-slate-200",
      dimTextColor: "text-slate-400",
      featureTextColor: "text-[#1A1A1A]",
      presentationClasses: "shadow-sm",
      isTrial: true,
    },
    {
      name: t('tier_enterprise_name'),
      emoji: "🏛️",
      badge: t('tier_enterprise_badge'),
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTREPRISE,
      price: 149,
      description: t('tier_enterprise_desc'),
      features: [
        { name: t('feature_editor'), included: true },
        { name: t('feature_logbook'), included: true },
        { name: t('feature_i18n'), included: true },
        { name: t('feature_foodcost'), included: true },
        { name: t('feature_bcg'), included: true },
        { name: t('feature_insta'), included: true },
        { name: t('feature_ocr'), included: true },
        { name: t('feature_support'), included: true },
      ],
      cta: t('cta_contact'),
      color: "bg-[#1A1A1A]",
      textColor: "text-[#F2F0E9]",
      borderColor: "border-[#1A1A1A]",
      ctaColor: "bg-[#2E4036] text-white hover:bg-[#1a251f]",
      iconColor: "text-[#CC5833]",
      dimIconColor: "text-[#F2F0E9]/10",
      dimTextColor: "text-[#F2F0E9]/30",
      featureTextColor: "text-[#F2F0E9]/80",
      presentationClasses: "shadow-xl shadow-black/20",
      isTrial: false,
    },
  ];
  return (
    <div className="min-h-screen bg-[#F2F0E9] noise-bg">
      {/* Minimal Navbar */}
      <nav className="flex items-center justify-between px-8 md:px-24 py-6 max-w-screen-xl mx-auto">
        <Link href="/" className="font-outfit font-bold text-2xl text-[#1A1A1A] tracking-tight">
          Rive
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-[#2E4036] hover:-translate-y-[1px] transition-transform"
        >
          {t('nav_login')}
        </Link>
      </nav>

      {/* Header */}
      <div className="text-center pt-16 pb-20 px-8">
        <h1 className="font-jakarta font-bold text-5xl md:text-6xl text-[#1A1A1A] tracking-tight mb-6">
          {t('title')}
        </h1>
        <p className="font-outfit text-xl text-slate-500 max-w-xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="max-w-screen-xl mx-auto px-8 md:px-24 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 items-center">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`${tier.color} ${tier.textColor} rounded-[2rem] p-8 border ${tier.borderColor} relative flex flex-col ${tier.presentationClasses} hover:-translate-y-2 transition-transform duration-500`}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black/10 backdrop-blur-md text-inherit border border-current/10 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full whitespace-nowrap overflow-hidden">
                 <span className="opacity-90">{tier.badge}</span>
              </div>

              <div className="mb-8 pt-4">
                <div className="text-4xl mb-4 transform hover:scale-110 transition-transform origin-left">{tier.emoji}</div>
                <h2 className={`font-jakarta font-bold text-2xl mb-2 ${tier.name === 'Entreprise' ? 'font-serif italic text-3xl' : ''}`}>{tier.name}</h2>
                <p className={`font-outfit text-sm ${tier.dimTextColor}`}>
                  {tier.description}
                </p>
              </div>

              <div className="mb-8">
                <span className="font-jakarta font-bold text-5xl">{tier.price}$</span>
                <span className={`font-outfit text-sm ml-1 ${tier.dimTextColor}`}>
                  {t('month')}
                </span>
              </div>

              <ul className="space-y-3 mb-10 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature.name} className={`flex items-center gap-3 text-sm font-outfit ${feature.included ? tier.featureTextColor : tier.dimTextColor}`}>
                    {feature.included ? (
                      <Check className={`w-4 h-4 ${tier.iconColor} shrink-0`} />
                    ) : (
                      <X className={`w-4 h-4 ${tier.dimIconColor} shrink-0`} />
                    )}
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>

              <CheckoutButton 
                priceId={tier.priceId} 
                cta={tier.cta} 
                ctaColor={tier.ctaColor}
                isTrial={tier.isTrial}
              />
            </div>
          ))}
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
