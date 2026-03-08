import { Link } from "@/i18n/routing";
import { Check } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { WasteCostCalculator } from "@/components/WasteCostCalculator";
import { SocialProofBanner } from "@/components/SocialProofBanner";
import { RadarLogo } from "@/components/TelemetryScanner";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

/* ── Algorithmic SVG Art ─────────────────────────────────────────────── */

function EssencePattern() {
  // Dot grid — evokes structure, foundation, reliability
  const dots: { cx: number; cy: number; r: number; opacity: number }[] = [];
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 12; col++) {
      const cx = 20 + col * 30;
      const cy = 20 + row * 30;
      const dist = Math.sqrt((cx - 180) ** 2 + (cy - 180) ** 2);
      const opacity = Math.max(0.03, 0.18 - dist / 1200);
      const r = 1.5 + (Math.sin(row * 0.7 + col * 0.5) + 1) * 0.8;
      dots.push({ cx, cy, r, opacity });
    }
  }
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 380 380" fill="none" preserveAspectRatio="xMidYMid slice">
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="rgba(255, 255, 255, 0.15)" opacity={d.opacity} />
      ))}
    </svg>
  );
}

function PerformancePattern() {
  // Diagonal intersecting lines — evokes analysis, precision, metrics
  const lines: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
  for (let i = 0; i < 16; i++) {
    const offset = i * 28;
    lines.push({ x1: offset, y1: 0, x2: offset + 180, y2: 400, opacity: 0.04 + (i % 3) * 0.015 });
    lines.push({ x1: 400, y1: offset, x2: 0, y2: offset + 200, opacity: 0.03 + (i % 4) * 0.01 });
  }
  // Accent crossing points
  const crosses: { cx: number; cy: number; opacity: number }[] = [];
  for (let i = 1; i < 8; i++) {
    for (let j = 1; j < 6; j++) {
      if ((i + j) % 3 === 0) {
        crosses.push({ cx: i * 55, cy: j * 70, opacity: 0.06 });
      }
    }
  }
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" fill="none" preserveAspectRatio="xMidYMid slice">
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="rgba(0, 229, 255, 0.4)" strokeWidth="0.5" opacity={l.opacity} />
      ))}
      {crosses.map((c, i) => (
        <circle key={`c${i}`} cx={c.cx} cy={c.cy} r="2" fill="rgba(0, 229, 255, 0.7)" opacity={c.opacity} />
      ))}
    </svg>
  );
}

function IntelligencePattern() {
  // Constellation network — evokes AI, neural connections, intelligence
  const nodes: { x: number; y: number; r: number }[] = [];
  const seed = [
    [60, 50], [150, 30], [280, 70], [350, 40],
    [40, 140], [120, 120], [220, 160], [310, 130], [380, 170],
    [80, 230], [190, 210], [270, 250], [360, 220],
    [50, 310], [160, 290], [250, 330], [340, 300],
    [100, 370], [220, 380], [310, 360],
  ];
  seed.forEach(([x, y]) => {
    nodes.push({ x, y, r: 1.2 + Math.sin(x * 0.02 + y * 0.03) * 0.8 });
  });

  // Connect nearby nodes
  const edges: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = Math.sqrt((nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2);
      if (dist < 150) {
        edges.push({
          x1: nodes[i].x, y1: nodes[i].y,
          x2: nodes[j].x, y2: nodes[j].y,
          opacity: Math.max(0.02, 0.1 - dist / 1500),
        });
      }
    }
  }

  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" fill="none" preserveAspectRatio="xMidYMid slice">
      {edges.map((e, i) => (
        <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="rgba(255, 0, 122, 0.3)" strokeWidth="0.5" opacity={e.opacity} />
      ))}
      {nodes.map((n, i) => (
        <circle key={`n${i}`} cx={n.x} cy={n.y} r={n.r} fill="rgba(255, 0, 122, 0.2)" opacity={0.15} />
      ))}
    </svg>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

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
      name: t('tier_essential_name'),
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL,
      price: 59,
      description: t('tier_essential_desc'),
      features: [
        t('feature_logbook'),
        t('feature_editor'),
        t('feature_i18n'),
        t('feature_insta'),
        t('feature_foodcost'),
        t('feature_ocr'),
        t('feature_deposits'),
      ],
      color: "bg-card backdrop-blur-md",
      textColor: "text-foreground",
      borderColor: "border-white/10 hover:border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.03)] hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]",
      ctaColor: "bg-foreground text-background hover:bg-foreground/90",
      iconColor: "text-white/60",
      featured: false,
      pattern: "essence" as const,
    },
    {
      name: t('tier_performance_name'),
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PERFORMANCE,
      price: 129,
      description: t('tier_performance_desc'),
      includesFrom: "Essence",
      features: [
        t('feature_bcg'),
        t('feature_reservations'),
        t('feature_variance'),
        t('feature_production'),
        t('feature_unlimited_financial'),
      ],
      color: "bg-card backdrop-blur-md",
      textColor: "text-foreground",
      borderColor: "border-primary/50 shadow-[0_0_30px_rgba(0,229,255,0.15)]",
      ctaColor: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,229,255,0.4)]",
      iconColor: "text-primary",
      featured: false,
      pattern: "performance" as const,
    },
    {
      name: t('tier_intelligence_name'),
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTREPRISE,
      price: 249,
      description: t('tier_intelligence_desc'),
      includesFrom: "Performance",
      features: [
        t('feature_preplists'),
        t('feature_unlimited_all'),
        t('feature_support'),
      ],
      color: "bg-card/40 backdrop-blur-md",
      textColor: "text-foreground",
      borderColor: "border-accent/30 hover:border-accent/50 shadow-[0_0_30px_rgba(255,0,122,0.05)] hover:shadow-[0_0_30px_rgba(255,0,122,0.15)]",
      ctaColor: "bg-foreground text-background hover:bg-foreground/90",
      iconColor: "text-foreground/50",
      featured: false,
      pattern: "intelligence" as const,
    },
  ];

  const patternComponents = {
    essence: <EssencePattern />,
    performance: <PerformancePattern />,
    intelligence: <IntelligencePattern />,
  };

  return (
    <div className="min-h-screen bg-background noise-bg text-foreground">
      {/* Minimal Navbar */}
      <nav className="flex items-center justify-between px-8 md:px-24 py-6 max-w-screen-xl mx-auto">
        <Link href="/" className="font-outfit font-semibold text-xl text-foreground tracking-[0.3em] uppercase">
          RIVE
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-foreground/80 hover:text-foreground hover:-translate-y-[1px] transition-all"
        >
          {t('nav_login')}
        </Link>
      </nav>

      {/* Header */}
      <div className="text-center pt-16 pb-8 px-8">
        <h1 className="font-jakarta font-bold text-5xl md:text-6xl text-foreground tracking-tight mb-6">
          {t('title')}
        </h1>
        <p className="font-outfit text-xl text-muted-foreground max-w-xl mx-auto mb-6">
          {t('subtitle')}
        </p>
        <div className="inline-flex items-center gap-2 bg-card border border-border/50 text-foreground font-outfit text-sm font-medium px-5 py-2 rounded-full">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(0,229,255,0.8)]" />
          {t('badge_free')}
        </div>
      </div>

      {/* Waste Cost Calculator Section */}
      <div className="max-w-screen-xl mx-auto px-8 md:px-24 pb-16 pt-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-jakarta font-bold text-2xl md:text-3xl text-foreground text-center mb-3">
            {t('waste_calculator_title')}
          </h2>
          <p className="font-outfit text-sm text-muted-foreground text-center mb-8">
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
              className={`${tier.color} ${tier.textColor} rounded-2xl p-8 md:p-10 border ${tier.borderColor} relative flex flex-col h-full transition-colors duration-300 overflow-hidden`}
            >
              {/* Algorithmic Art Background */}
              <div className="pointer-events-none absolute inset-0 z-0">
                {patternComponents[tier.pattern]}
              </div>

              {/* Name + Price */}
              <div className="mb-8 pt-4 relative z-10">
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
              <div className="h-px w-full bg-current/10 mb-6 relative z-10" />

              {/* Features */}
              <div className="mb-8 flex-1 relative z-10">
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
              <div className="mt-auto relative z-10">
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
          <div className="bg-card backdrop-blur-md rounded-2xl p-8 md:p-12 border border-border/50 relative flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-jakarta font-bold text-3xl mb-3 text-foreground">
                {t('enterprise_custom_title')}
              </h2>
              <p className="font-outfit text-muted-foreground text-lg">
                {t('enterprise_custom_desc')}
              </p>
            </div>
            <a
              href="mailto:dock@rivehub.com"
              className="px-8 py-4 bg-foreground text-background font-outfit font-medium rounded-full hover:bg-foreground/90 transition-colors whitespace-nowrap flex-shrink-0"
            >
              {t('enterprise_custom_cta')}
            </a>
          </div>
        </div>

        {/* Trust Elements */}
        <div className="mt-24 text-center">
          <p className="font-plex-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
            {t('powered_by')}
          </p>
          <div className="flex items-center justify-center gap-8 text-muted-foreground font-outfit text-sm">
            <span>Anthropic AI</span>
            <span className="w-1 h-1 bg-muted-foreground/30 rounded-full"></span>
            <span>Supabase</span>
            <span className="w-1 h-1 bg-muted-foreground/30 rounded-full"></span>
            <span>Next.js</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-[#F2F0E9] rounded-t-[4rem] px-8 md:px-24 pt-16 pb-12 mt-24">
        <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row justify-between items-start gap-12">
          <div className="flex items-start gap-6">
            <RadarLogo className="w-[80px] md:w-[100px] h-auto shrink-0 -mt-1" />
            <div>
              <p className="font-plex-mono text-sm text-slate-400 mb-3">
                {t('footer_desc')}
              </p>
              <a href="mailto:dock@rivehub.com" className="font-outfit text-sm text-[#CC5833] inline-block hover:text-[#F2F0E9] transition-colors tracking-wide">
                dock@rivehub.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#2E4036]/30 border border-[#2E4036] px-4 py-2 rounded-full animate-pulse transition-opacity">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="font-plex-mono text-sm uppercase tracking-wider text-green-400">{t('footer_status')}</span>
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto mt-16 pt-8 border-t border-slate-800 text-slate-400 text-sm font-outfit flex justify-between">
          <p>{t('footer_rights')}</p>
          <div className="flex gap-6">
            <Link href="/cgu" className="hover:text-[#F2F0E9] transition-colors">{t('footer_privacy')}</Link>
            <Link href="/cgu" className="hover:text-[#F2F0E9] transition-colors">{t('footer_terms')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
