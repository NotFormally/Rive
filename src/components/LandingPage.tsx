"use client";

import { useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, RotateCw, Activity, Calendar, Thermometer, Globe } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";

// Register GSAP Plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function LandingPage() {
  const t = useTranslations('LandingPage');
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Entrance Animation
      gsap.from(".hero-text", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.2
      });

      // 2. Navbar Morphing Logic
      ScrollTrigger.create({
        trigger: ".hero-section",
        start: "bottom top",
        onEnter: () => {
          gsap.to(".navbar", {
            backgroundColor: "rgba(242, 240, 233, 0.6)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(0,0,0,0.05)",
            color: "#1A1A1A",
            duration: 0.3
          });
          gsap.to(".nav-btn", { backgroundColor: "#2E4036", color: "#F2F0E9" });
        },
        onLeaveBack: () => {
          gsap.to(".navbar", {
            backgroundColor: "transparent",
            backdropFilter: "blur(0px)",
            border: "1px solid transparent",
            color: "#F2F0E9",
            duration: 0.3
          });
          gsap.to(".nav-btn", { backgroundColor: "#F2F0E9", color: "#1A1A1A" });
        }
      });

      // 3. Shuffler Card Logic (Mock animation setup for now)
      const shufflerInterval = setInterval(() => {
        gsap.fromTo(".shuffler-item", 
          { y: 20, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.5)" }
        );
      }, 3000);

      return () => {
        clearInterval(shufflerInterval);
      };
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={container} className="noise-bg min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      
      {/* A. NAVBAR — "The Floating Island" */}
      <nav className="navbar fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full flex items-center gap-8 text-[#F2F0E9] transition-colors">
        <div className="font-outfit font-bold tracking-tight text-xl">Rive</div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="#features" className="hover:-translate-y-[1px] transition-transform">{t('nav_features')}</Link>
          <Link href="#philosophy" className="hover:-translate-y-[1px] transition-transform">{t('nav_philosophy')}</Link>
          <Link href="/pricing" className="hover:-translate-y-[1px] transition-transform">{t('nav_pricing')}</Link>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <Link 
            href="/signup" 
            className="nav-btn bg-[#F2F0E9] text-[#1A1A1A] px-5 py-2.5 rounded-full text-sm font-semibold hover:scale-[1.03] transition-transform duration-300"
          >
            {t('nav_cta')}
          </Link>
        </div>
      </nav>

        {/* B. HERO SECTION — "The Opening Shot" */}
      <section className="hero-section relative h-[100dvh] w-full flex items-center md:items-end pb-24 px-8 md:px-24">
        {/* Background Image with Global CSS Noise */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: "url('/hero-image.png')" }} /* Optional: A more restaurant-focused dark image */
        >
          {/* Heavy primary-to-black gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#2E4036]/90 to-[#1A1A1A]/70"></div>
        </div>

        <div className="relative z-10 max-w-5xl text-[#F2F0E9] pt-24 md:pt-0">
          <h1 className="flex flex-col gap-3">
            <span className="hero-text font-jakarta font-bold text-xl md:text-2xl tracking-widest uppercase text-[#CC5833] opacity-90">
              {t('hero_subtitle')}
            </span>
            <span className="hero-text font-cormorant italic text-6xl md:text-8xl tracking-tighter leading-[0.95] max-w-4xl">
              {t('hero_title')}
            </span>
          </h1>
          <p className="hero-text font-outfit text-lg md:text-xl mt-8 max-w-3xl opacity-90 leading-relaxed tracking-wide">
            {t('hero_description')}
          </p>
          <div className="hero-text mt-12">
            <Link 
              href="/signup" 
              className="group relative overflow-hidden inline-flex items-center justify-center gap-2 bg-[#CC5833] text-[#F2F0E9] px-8 py-4 rounded-[2rem] font-bold text-lg hover:scale-[1.03] transition-transform duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">{t('hero_cta')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
              <span className="absolute inset-0 bg-[#1A1A1A] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></span>
            </Link>
          </div>
        </div>
      </section>

      {/* C. THE 6 PILLARS — "Explicit Features & Use Cases" */}
      <section id="features" className="py-32 px-8 md:px-24 max-w-screen-2xl mx-auto bg-[#F2F0E9]">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <h2 className="font-cormorant italic text-5xl md:text-7xl text-[#1A1A1A] tracking-tighter leading-none mb-6">
            {t('features_title')}
          </h2>
        </div>

        <div className="flex flex-col gap-12 md:gap-24">
          
          {/* Feature 1: Logbook */}
          <div className="feature-row bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="flex flex-col gap-6">
                <div className="bg-[#2E4036]/10 w-16 h-16 rounded-2xl flex items-center justify-center"><Activity className="w-8 h-8 text-[#2E4036]" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#1A1A1A]">{t('f1_title')}</h3>
                <p className="font-outfit text-lg text-slate-600 leading-relaxed">{t('f1_desc')}</p>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Exemples d'utilisation</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-700">
                    <li className="flex gap-3"><span className="text-[#CC5833]">✦</span> {t('f1_ex1')}</li>
                    <li className="flex gap-3"><span className="text-[#CC5833]">✦</span> {t('f1_ex2')}</li>
                    <li className="flex gap-3"><span className="text-[#CC5833]">✦</span> {t('f1_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 bg-slate-50 rounded-[2rem] h-64 md:h-full min-h-[300px] border border-slate-100 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-4 bg-white shadow-sm rounded-xl border border-slate-200 p-6 rot-3 flex flex-col gap-4">
                 <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse"></div>
                 <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
                 <div className="h-3 w-2/3 bg-slate-100 rounded"></div>
                 <div className="mt-auto self-end px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Résolu</div>
               </div>
            </div>
          </div>

          {/* Feature 2: Compliance */}
          <div className="feature-row bg-[#1A1A1A] text-[#F2F0E9] rounded-[3rem] p-8 md:p-12 shadow-md grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-1 bg-[#232323] rounded-[2rem] h-64 md:h-full min-h-[300px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute flex flex-col gap-3">
                 <div className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-sm shadow-xl">
                   <Thermometer className="w-5 h-5" />
                   <span className="font-plex-mono text-sm">Frigo 2 : 8.5°C détecté</span>
                 </div>
                 <div className="bg-[#CC5833] text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-xl ml-8">
                   <RotateCw className="w-5 h-5 animate-spin-slow" />
                   <span className="font-outfit text-sm font-bold">Action : Jeter les aliments à risque</span>
                 </div>
              </div>
            </div>
            <div className="order-2">
              <div className="flex flex-col gap-6">
                <div className="bg-red-500/10 w-16 h-16 rounded-2xl flex items-center justify-center"><Thermometer className="w-8 h-8 text-red-500" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl">{t('f2_title')}</h3>
                <p className="font-outfit text-lg opacity-80 leading-relaxed">{t('f2_desc')}</p>
                <div className="bg-[#232323] p-6 rounded-2xl mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-500 mb-4">Exemples d'utilisation</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-300">
                    <li className="flex gap-3"><span className="text-red-400">✦</span> {t('f2_ex1')}</li>
                    <li className="flex gap-3"><span className="text-red-400">✦</span> {t('f2_ex2')}</li>
                    <li className="flex gap-3"><span className="text-red-400">✦</span> {t('f2_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Translations */}
          <div className="feature-row bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="flex flex-col gap-6">
                <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center"><Globe className="w-8 h-8 text-indigo-600" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#1A1A1A]">{t('f3_title')}</h3>
                <p className="font-outfit text-lg text-slate-600 leading-relaxed">{t('f3_desc')}</p>
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-50 mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-indigo-300 mb-4">Exemples d'utilisation</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-700">
                    <li className="flex gap-3"><span className="text-indigo-500">✦</span> {t('f3_ex1')}</li>
                    <li className="flex gap-3"><span className="text-indigo-500">✦</span> {t('f3_ex2')}</li>
                    <li className="flex gap-3"><span className="text-indigo-500">✦</span> {t('f3_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 bg-indigo-950 rounded-[2rem] h-64 md:h-full min-h-[300px] flex items-center justify-center relative overflow-hidden">
               <div className="text-center">
                 <div className="text-indigo-300 font-cormorant italic text-3xl mb-2 opacity-50 transition-opacity">"Nettoyer le sol ce soir"</div>
                 <div className="text-white font-cormorant italic text-4xl">"Limpiar el piso esta noche"</div>
               </div>
            </div>
          </div>

          {/* Feature 4: Food Cost & Menu Engineering */}
          <div className="feature-row bg-slate-50 border border-slate-200/60 rounded-[3rem] p-8 md:p-12 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-1 bg-white border border-slate-200 rounded-[2rem] h-64 md:h-full min-h-[300px] flex items-center justify-center relative overflow-hidden p-8">
               <div className="w-full flex justify-between items-end h-32 border-b border-slate-100 pb-2">
                 <div className="w-12 bg-slate-200 rounded-t-md h-12"></div>
                 <div className="w-12 bg-slate-300 rounded-t-md h-20"></div>
                 <div className="w-12 bg-[#CC5833] rounded-t-md h-32 animate-pulse shadow-lg"></div>
               </div>
            </div>
            <div className="order-2">
              <div className="flex flex-col gap-6">
                <div className="bg-[#CC5833]/10 w-16 h-16 rounded-2xl flex items-center justify-center"><Activity className="w-8 h-8 text-[#CC5833]" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#1A1A1A]">{t('f4_title')}</h3>
                <p className="font-outfit text-lg text-slate-600 leading-relaxed">{t('f4_desc')}</p>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Exemples d'utilisation</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-700">
                    <li className="flex gap-3"><span className="text-[#CC5833]">✦</span> {t('f4_ex1')}</li>
                    <li className="flex gap-3"><span className="text-[#CC5833]">✦</span> {t('f4_ex2')}</li>
                    <li className="flex gap-3"><span className="text-[#CC5833]">✦</span> {t('f4_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

           {/* Feature 5: Invoice Scanning */}
          <div className="feature-row bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="flex flex-col gap-6">
                <div className="bg-[#2E4036]/10 w-16 h-16 rounded-2xl flex items-center justify-center"><Calendar className="w-8 h-8 text-[#2E4036]" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#1A1A1A]">{t('f5_title')}</h3>
                <p className="font-outfit text-lg text-slate-600 leading-relaxed">{t('f5_desc')}</p>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Exemples d'utilisation</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-700">
                    <li className="flex gap-3"><span className="text-[#CC5833]">✦</span> {t('f5_ex1')}</li>
                    <li className="flex gap-3"><span className="text-[#CC5833]">✦</span> {t('f5_ex2')}</li>
                    <li className="flex gap-3"><span className="text-[#CC5833]">✦</span> {t('f5_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 bg-slate-50 rounded-[2rem] h-64 md:h-full min-h-[300px] border border-slate-100 flex items-center justify-center relative overflow-hidden">
               <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-green-400 animate-pulse shadow-[0_0_10px_#4ade80]"></div>
               <div className="bg-white border text-xs p-4 rounded shadow font-mono opacity-50">SAUMON NORVEGE... 12.50/KG</div>
            </div>
          </div>

          {/* Feature 6: Social Media Marketing */}
          <div className="feature-row bg-[#2E4036] text-[#F2F0E9] rounded-[3rem] p-8 md:p-12 shadow-md grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-1 bg-[#1f2d25] border border-[#3e5548] rounded-[2rem] h-64 md:h-full min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden p-6 text-center">
               <div className="text-3xl mb-4">📸</div>
               <div className="font-outfit text-sm text-green-100/70 max-w-xs leading-relaxed">
                 "Découvrez le menu spécial de ce soir ! Un thon rouge mi-cuit parfaitement braisé... ✨ Réservation en bio 👇"
               </div>
            </div>
            <div className="order-2">
              <div className="flex flex-col gap-6">
                <div className="bg-green-400/10 w-16 h-16 rounded-2xl flex items-center justify-center"><Activity className="w-8 h-8 text-green-400" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl">{t('f6_title')}</h3>
                <p className="font-outfit text-lg opacity-80 leading-relaxed">{t('f6_desc')}</p>
                <div className="bg-[#1f2d25] p-6 rounded-2xl mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-green-700/50 mb-4">Exemples d'utilisation</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-green-50">
                    <li className="flex gap-3"><span className="text-green-400">✦</span> {t('f6_ex1')}</li>
                    <li className="flex gap-3"><span className="text-green-400">✦</span> {t('f6_ex2')}</li>
                    <li className="flex gap-3"><span className="text-green-400">✦</span> {t('f6_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* D. PHILOSOPHY — "The Manifesto" */}
      <section id="philosophy" className="relative py-48 bg-[#1A1A1A] text-[#F2F0E9] overflow-hidden">
        {/* Parallax Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542841791-d3fa1b439f03?q=80&w=2000&auto=format&fit=crop')" }} /* Organic laboratory glassware */
        ></div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-8 md:px-24 text-center">
          <p className="philosophy-text font-outfit text-xl md:text-2xl text-[#6B7280] mb-8">
            {t('philosophy_intro')}
          </p>
          <p className="philosophy-text font-cormorant italic text-4xl md:text-7xl font-semibold leading-tight">
            {t('philosophy_vision')}
          </p>

          {/* Three Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
            <div className="text-left border-t border-[#CC5833]/30 pt-8">
              <h3 className="font-jakarta font-bold text-2xl mb-3">{t('philosophy_pillar1_title')}</h3>
              <p className="font-outfit text-[#6B7280] text-lg">{t('philosophy_pillar1_desc')}</p>
            </div>
            <div className="text-left border-t border-[#CC5833]/30 pt-8">
              <h3 className="font-jakarta font-bold text-2xl mb-3">{t('philosophy_pillar2_title')}</h3>
              <p className="font-outfit text-[#6B7280] text-lg">{t('philosophy_pillar2_desc')}</p>
            </div>
            <div className="text-left border-t border-[#CC5833]/30 pt-8">
              <h3 className="font-jakarta font-bold text-2xl mb-3">{t('philosophy_pillar3_title')}</h3>
              <p className="font-outfit text-[#6B7280] text-lg">{t('philosophy_pillar3_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* E. PROTOCOL — "Sticky Stacking Archive" */}
      <section id="protocol" className="py-24 px-8 md:px-24 max-w-screen-xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="font-jakarta font-bold text-4xl text-[#1A1A1A] mb-4">{t('protocol_title')}</h2>
          <p className="font-outfit text-slate-500">{t('protocol_desc')}</p>
        </div>

        <div className="protocol-container relative">
          {/* Card 1 */}
          <div className="stack-card sticky top-32 bg-[#2E4036] text-[#F2F0E9] p-12 md:p-16 rounded-[3rem] shadow-xl mb-8 flex flex-col md:flex-row items-center gap-12 min-h-[50vh]">
            <div className="flex-1">
              <div className="font-plex-mono text-[#CC5833] font-bold text-sm mb-4">PHASE 01</div>
              <h3 className="font-jakarta font-bold text-4xl mb-6">{t('protocol_phase1_title')}</h3>
              <p className="font-outfit text-lg opacity-80 mb-8 max-w-md">{t('protocol_phase1_desc')}</p>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-48 h-48 border border-[#CC5833]/30 rounded-full flex items-center justify-center relative spin-slow">
                <div className="w-32 h-32 border border-[#CC5833]/60 rounded-full border-dashed absolute animate-[spin_10s_linear_infinite]"></div>
                <div className="w-16 h-16 bg-[#CC5833]/20 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="stack-card sticky top-40 bg-[#CC5833] text-[#F2F0E9] p-12 md:p-16 rounded-[3rem] shadow-xl mb-8 flex flex-col md:flex-row items-center gap-12 min-h-[50vh]">
            <div className="flex-1">
              <div className="font-plex-mono text-[#1A1A1A] font-bold text-sm mb-4">PHASE 02</div>
              <h3 className="font-jakarta font-bold text-4xl mb-6">{t('protocol_phase2_title')}</h3>
              <p className="font-outfit text-lg opacity-90 mb-8 max-w-md">{t('protocol_phase2_desc')}</p>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-64 h-32 border border-[#F2F0E9]/30 rounded-xl relative overflow-hidden flex flex-col justify-between p-2">
                <div className="w-full h-[1px] bg-[#F2F0E9]/50 absolute top-1/2 left-0 animate-[ping_3s_ease-in-out_infinite]"></div>
                <div className="flex gap-2"><div className="w-8 h-8 bg-[#F2F0E9]/20 rounded-md"></div><div className="w-8 h-8 bg-[#F2F0E9]/50 rounded-md"></div></div>
                <div className="flex gap-2 self-end"><div className="w-8 h-8 bg-[#1A1A1A]/40 rounded-md"></div></div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="stack-card sticky top-48 bg-[#1A1A1A] text-[#F2F0E9] p-12 md:p-16 rounded-[3rem] shadow-xl mb-8 flex flex-col md:flex-row items-center gap-12 min-h-[50vh]">
            <div className="flex-1">
              <div className="font-plex-mono text-[#CC5833] font-bold text-sm mb-4">PHASE 03</div>
              <h3 className="font-jakarta font-bold text-4xl mb-6">{t('protocol_phase3_title')}</h3>
              <p className="font-outfit text-lg opacity-80 mb-8 max-w-md">{t('protocol_phase3_desc')}</p>
              <Link href="/signup" className="inline-block bg-[#F2F0E9] text-[#1A1A1A] px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform">
                {t('protocol_cta')}
              </Link>
            </div>
            <div className="flex-1 flex justify-center">
               <svg className="w-full max-w-[300px] h-32" viewBox="0 0 300 100">
                <path 
                  d="M0,50 L50,50 L60,20 L80,80 L90,50 L150,50 L160,30 L180,70 L190,50 L300,50" 
                  fill="none" 
                  stroke="#CC5833" 
                  strokeWidth="3"
                  className="animate-[dash_3s_linear_infinite]"
                  strokeDasharray="300"
                  strokeDashoffset="300"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* G. FOOTER */}
      <footer className="bg-[#1A1A1A] text-[#F2F0E9] rounded-t-[4rem] px-8 md:px-24 pt-24 pb-12 mt-24">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <div className="font-outfit font-bold text-3xl mb-4">Rive</div>
            <p className="font-outfit text-slate-400 max-w-xs">{t('footer_desc')}</p>
          </div>
          <div className="flex items-center gap-3 bg-[#2E4036]/30 border border-[#2E4036] px-4 py-2 rounded-full animate-pulse transition-opacity">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="font-plex-mono text-sm uppercase tracking-wider text-green-400">{t('footer_status')}</span>
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto mt-24 pt-8 border-t border-slate-800 text-slate-500 text-sm font-outfit flex justify-between">
          <p>{t('footer_rights')}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#F2F0E9] transition-colors">{t('footer_privacy')}</a>
            <a href="#" className="hover:text-[#F2F0E9] transition-colors">{t('footer_terms')}</a>
          </div>
        </div>
      </footer>
      
      {/* Global Animation Styles placed here to guarantee they are parsed */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
      `}} />
    </div>
  );
}
