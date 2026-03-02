import { Link } from "@/i18n/routing";
import { ArrowRight, Brain, ShieldCheck, BarChart3, ScanLine, ChefHat, Globe, Zap, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rivehub.com'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale;
  const t = await getTranslations({ locale, namespace: 'AIPage' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default function AIRestaurantManagementPage() {
  const t = useTranslations("AIPage");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "AI for Restaurant Management — How Artificial Intelligence is Transforming Restaurant Operations",
    "description": "Discover how AI for restaurant management automates food cost tracking, HACCP compliance, menu engineering, and operational decisions. Learn why restaurants worldwide are switching to AI-powered platforms like Rive.",
    "author": { "@type": "Organization", "name": "Rive", "url": SITE_URL },
    "publisher": { "@type": "Organization", "name": "Rive", "url": SITE_URL, "logo": { "@type": "ImageObject", "url": `${SITE_URL}/favicon.ico` } },
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${SITE_URL}/en/ai-restaurant-management` },
    "datePublished": "2026-03-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "keywords": "AI for restaurant management, AI for restaurant, artificial intelligence restaurant, restaurant management software, AI food cost, restaurant automation, HACCP AI, menu engineering AI"
  };

  const features = [
    { icon: Brain, titleKey: "f1_title", descKey: "f1_desc" },
    { icon: ShieldCheck, titleKey: "f2_title", descKey: "f2_desc" },
    { icon: BarChart3, titleKey: "f3_title", descKey: "f3_desc" },
    { icon: ScanLine, titleKey: "f4_title", descKey: "f4_desc" },
    { icon: ChefHat, titleKey: "f5_title", descKey: "f5_desc" },
    { icon: Globe, titleKey: "f6_title", descKey: "f6_desc" },
  ];

  const benefits = [
    { icon: Zap, titleKey: "b1_title", descKey: "b1_desc" },
    { icon: TrendingUp, titleKey: "b2_title", descKey: "b2_desc" },
    { icon: ShieldCheck, titleKey: "b3_title", descKey: "b3_desc" },
  ];

  return (
    <div className="min-h-screen bg-[#F2F0E9] noise-bg">
      <JsonLd data={structuredData} />

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 md:px-24 py-6 max-w-screen-xl mx-auto">
        <Link href="/" className="font-outfit font-semibold text-xl text-[#1A1A1A] tracking-[0.3em] uppercase">
          RIVE
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm font-medium text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors">
            {t('nav_pricing')}
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-[#CC5833] text-[#F2F0E9] px-5 py-2 rounded-full hover:bg-[#b84d2d] transition-colors"
          >
            {t('nav_signup')}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 pb-20 px-8 md:px-24 max-w-screen-xl mx-auto text-center">
        <p className="font-plex-mono text-xs tracking-[0.3em] uppercase text-[#CC5833] mb-6">{t('hero_label')}</p>
        <h1 className="font-jakarta font-bold text-4xl md:text-6xl lg:text-7xl text-[#1A1A1A] tracking-tight leading-[1.1] mb-8 max-w-4xl mx-auto">
          {t('hero_title')}
        </h1>
        <p className="font-outfit text-lg md:text-xl text-[#1A1A1A]/60 max-w-2xl mx-auto mb-12 leading-relaxed">
          {t('hero_description')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 bg-[#CC5833] text-[#F2F0E9] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#b84d2d] transition-colors"
          >
            {t('hero_cta')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 border border-[#1A1A1A]/20 text-[#1A1A1A] px-8 py-4 rounded-full font-medium hover:bg-[#1A1A1A]/5 transition-colors"
          >
            {t('hero_cta_secondary')}
          </Link>
        </div>
      </section>

      {/* What is AI for Restaurant Management */}
      <section className="py-20 px-8 md:px-24 bg-[#1A1A1A]">
        <div className="max-w-screen-xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-jakarta font-bold text-3xl md:text-5xl text-[#F2F0E9] tracking-tight mb-6">
              {t('what_title')}
            </h2>
            <p className="font-outfit text-lg text-[#F2F0E9]/60 leading-relaxed">
              {t('what_description')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-[#F2F0E9]/5 rounded-2xl p-8 border border-[#F2F0E9]/10">
                <f.icon className="w-8 h-8 text-[#CC5833] mb-4" />
                <h3 className="font-jakarta font-bold text-lg text-[#F2F0E9] mb-3">{t(f.titleKey)}</h3>
                <p className="font-outfit text-sm text-[#F2F0E9]/50 leading-relaxed">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why AI for Your Restaurant */}
      <section className="py-20 px-8 md:px-24 max-w-screen-xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-jakarta font-bold text-3xl md:text-5xl text-[#1A1A1A] tracking-tight mb-6">
            {t('why_title')}
          </h2>
          <p className="font-outfit text-lg text-[#1A1A1A]/60 max-w-2xl mx-auto">
            {t('why_description')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <div key={i} className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-[#CC5833]/10 flex items-center justify-center mx-auto mb-6">
                <b.icon className="w-8 h-8 text-[#CC5833]" />
              </div>
              <h3 className="font-jakarta font-bold text-xl text-[#1A1A1A] mb-3">{t(b.titleKey)}</h3>
              <p className="font-outfit text-[#1A1A1A]/60 leading-relaxed">{t(b.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How Rive Uses AI */}
      <section className="py-20 px-8 md:px-24 bg-[#2E4036]">
        <div className="max-w-screen-xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-jakarta font-bold text-3xl md:text-5xl text-[#F2F0E9] tracking-tight mb-6">
              {t('how_title')}
            </h2>
            <p className="font-outfit text-lg text-[#F2F0E9]/60 leading-relaxed">
              {t('how_description')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-[#F2F0E9]/5 rounded-2xl p-8 border border-[#F2F0E9]/10">
                <span className="font-plex-mono text-xs text-[#CC5833] tracking-widest uppercase mb-3 block">{t(`step${n}_label`)}</span>
                <h3 className="font-jakarta font-bold text-lg text-[#F2F0E9] mb-3">{t(`step${n}_title`)}</h3>
                <p className="font-outfit text-sm text-[#F2F0E9]/50 leading-relaxed">{t(`step${n}_desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 md:px-24 max-w-screen-xl mx-auto text-center">
        <h2 className="font-jakarta font-bold text-3xl md:text-5xl text-[#1A1A1A] tracking-tight mb-6">
          {t('cta_title')}
        </h2>
        <p className="font-outfit text-lg text-[#1A1A1A]/60 max-w-xl mx-auto mb-10">
          {t('cta_description')}
        </p>
        <Link
          href="/signup"
          className="group inline-flex items-center gap-2 bg-[#CC5833] text-[#F2F0E9] px-10 py-5 rounded-full font-bold text-xl hover:bg-[#b84d2d] transition-colors"
        >
          {t('cta_button')} <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </Link>
        <p className="font-outfit text-sm text-[#1A1A1A]/40 mt-4">{t('cta_subtext')}</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A]/10 py-8 px-8 md:px-24">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-outfit font-semibold text-sm text-[#1A1A1A] tracking-[0.3em] uppercase">RIVE</Link>
          <p className="font-outfit text-xs text-[#1A1A1A]/40">&copy; {new Date().getFullYear()} Rive. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
