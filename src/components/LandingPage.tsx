"use client";

import { useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, RotateCw, Activity, Calendar, Thermometer, Globe, CalendarCheck, ChefHat, TrendingDown, ScanLine, Beer, Droplets, Recycle, Zap, TrendingUp, PiggyBank } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { WasteCostCalculator } from "@/components/WasteCostCalculator";
import { RadarLogo, DataMatrix } from "@/components/TelemetryScanner";
import RiveLogo from "@/components/RiveLogo";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { StickyCTA } from "@/components/StickyCTA";
import { HowItWorks } from "@/components/HowItWorks";
// import { DemoVideoSection } from "@/components/DemoVideoSection"; // Suspended until real video is ready
import { FAQSection } from "@/components/FAQSection";
import { NanoBananaPromo } from "@/components/NanoBananaPromo";
import { NauticalCommandCenter } from "@/components/NauticalCommandCenter";
import { ThreePillarsDemo } from "@/components/ThreePillarsDemo";
import { BeforeAfterComparison } from "@/components/BeforeAfterComparison";

// Register GSAP Plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function LandingPage() {
  const t = useTranslations('LandingPage');
  const tMockups = useTranslations('LandingMockups');
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
            backgroundColor: "rgba(11, 19, 30, 0.8)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(0,0,0,0.05)",
            color: "#F2F0E9",
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
          gsap.to(".nav-btn", { backgroundColor: "#1A2332", color: "#F2F0E9" });
        }
      });

      // 3. Shuffler Card Logic (Mock animation setup for now)
      const shufflerInterval = setInterval(() => {
        gsap.fromTo(".shuffler-item", 
          { y: 20, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.5)" }
        );
      }, 3000);
      // 4. Scroll-reveal micro-animations
      gsap.utils.toArray<HTMLElement>('.scroll-reveal').forEach((el) => {
        gsap.from(el, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          }
        });
      });

      // 5. Protocol Stacking Cards Animation
      const stackCards = gsap.utils.toArray<HTMLElement>('.stack-card');
      stackCards.forEach((card, i) => {
        if (i === stackCards.length - 1) {
          // Last card just pins, no scale/blur needed
          ScrollTrigger.create({
            trigger: card,
            start: "top top+=100",
            endTrigger: ".protocol-container",
            end: "bottom bottom",
            pin: true,
            pinSpacing: false
          });
          return;
        }

        gsap.to(card, {
          scale: 0.9,
          opacity: 0.5,
          filter: "blur(20px)",
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top top+=100",
            endTrigger: ".protocol-container",
            end: "bottom bottom",
            pin: true,
            pinSpacing: false,
            scrub: true,
          }
        });
      });

      return () => {
        clearInterval(shufflerInterval);
      };
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={container} className="noise-bg min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      <ScrollProgressBar />
      <StickyCTA />

      {/* A. NAVBAR — "The Floating Island" */}
      <nav className="navbar fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full flex items-center gap-8 text-[#F2F0E9] transition-colors">
        <Link href="/" className="group">
          <RiveLogo className="text-xl md:text-2xl text-current" />
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="#features" className="hover:-translate-y-[1px] transition-transform">{t('nav_features')}</Link>
          <Link href="#philosophy" className="hover:-translate-y-[1px] transition-transform">{t('nav_philosophy')}</Link>
          <Link href="/pricing" className="hover:-translate-y-[1px] transition-transform">{t('nav_pricing')}</Link>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <Link 
            href="/signup" 
            className="nav-btn flex items-center justify-center text-center whitespace-nowrap bg-[#0B131E] text-[#F2F0E9] px-5 py-2.5 rounded-full text-sm font-semibold hover:scale-[1.03] transition-transform duration-300"
          >
            {t('nav_cta')}
          </Link>
        </div>
      </nav>

      {/* B. HERO SECTION — "The Opening Shot" */}
      <section className="hero-section relative min-h-[100dvh] w-full flex flex-col justify-center pb-24 px-8 md:px-24">
        {/* Background - Abstract Culinary Texture (Dark Stone/Slate) */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0 opacity-80"
          role="img"
          aria-label={t('hero_bg_alt')}
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550505187-578f73111ea3?q=80&w=2048&auto=format&fit=crop')" }}
        >
          {/* Heavy dark overlay to keep it subtle and elegant */}
          <div className="absolute inset-0 bg-[#0B131E]/70 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B131E]/60 via-[#0B131E]/80 to-[#0B131E]"></div>
        </div>

        <div className="relative z-10 w-full pt-32 md:pt-40 max-w-screen-xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div className="text-[#F2F0E9] flex-1 max-w-2xl">
            <h1 className="flex flex-col gap-3">
              <span className="sr-only">{t('hero_h1_seo')}</span>
              <span className="hero-text font-jakarta font-bold text-xl md:text-2xl tracking-widest uppercase text-cyan-400 opacity-90 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                {t('hero_subtitle')}
              </span>
              <span className="hero-text hero-hot-word relative inline-block font-cormorant italic text-6xl md:text-7xl lg:text-8xl tracking-tighter leading-[0.95] max-w-2xl">
                {/* Animated gradient text */}
                <span className="hero-hot-text relative z-10">{t('hero_title')}</span>
                {/* Warm glow duplicate behind */}
                <span className="hero-hot-glow absolute inset-0 z-0 pointer-events-none select-none" aria-hidden="true">{t('hero_title')}</span>
                {/* Steam wisps */}
                <span className="hero-steam absolute -top-6 left-0 right-0 h-10 pointer-events-none z-20" aria-hidden="true">
                  <span className="steam-wisp" style={{ left: '15%', animationDelay: '0s' }} />
                  <span className="steam-wisp" style={{ left: '45%', animationDelay: '0.8s' }} />
                  <span className="steam-wisp" style={{ left: '70%', animationDelay: '1.5s' }} />
                </span>
              </span>
            </h1>
            <p className="hero-text font-outfit text-lg md:text-xl mt-8 max-w-xl opacity-90 leading-relaxed tracking-wide">
              {t('hero_description')}
            </p>
            <p className="hero-text font-plex-mono text-xs tracking-widest uppercase opacity-60 mt-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              {t('hero_loss_hook')} &bull; {t('hero_borderless_hook') || ''}
            </p>
            <div className="hero-text mt-12 w-full flex">
              <Link
                href="/signup"
                className="group relative overflow-hidden inline-flex items-center justify-center text-center whitespace-nowrap gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-[#F2F0E9] px-8 py-4 rounded-full font-bold text-lg hover:scale-[1.03] transition-transform duration-300 shadow-[0_0_40px_rgba(34,211,238,0.4)] backdrop-blur-md border border-white/10"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-md">{t('hero_cta')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                <span className="absolute inset-0 bg-[#0B131E] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></span>
              </Link>
            </div>
          </div>

          {/* Data Matrix — Running Protocol */}
          <div className="hidden md:block w-[320px] lg:w-[380px] h-[320px] lg:h-[380px] shrink-0 relative">
            <div className="absolute inset-0 bg-[#00FFAA]/5 blur-[60px] rounded-full pointer-events-none"></div>
            <DataMatrix className="w-full h-full relative z-10" />
          </div>
        </div>
      </section>

      {/* POS Integrations Banner */}
      <div className="w-full bg-[#0B131E] text-cyan-500/80 py-5 overflow-hidden border-y border-cyan-900/30 shadow-[0_0_30px_rgba(34,211,238,0.05)]">
        <div className="flex whitespace-nowrap animate-scroll-x items-center gap-12 font-plex-mono text-sm font-bold tracking-widest uppercase">
          <span>{t('integrations_banner')}</span>
          <span>{t('integrations_banner')}</span>
          <span>{t('integrations_banner')}</span>
          <span>{t('integrations_banner')}</span>
          <span>{t('integrations_banner')}</span>
          <span>{t('integrations_banner')}</span>
          <span>{t('integrations_banner')}</span>
          <span>{t('integrations_banner')}</span>
        </div>
      </div>

      {/* WASTE COST CALCULATOR — Behavioral Lever (high position for conversion) */}
      <section className="py-20 md:py-32 px-8 md:px-24 bg-[#0B131E] relative overflow-hidden">
        {/* Soft geometric background accent */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[800px] h-[800px] bg-[#CC5833]/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-screen-xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-jakarta text-3xl md:text-4xl font-bold text-[#F2F0E9]">
              {t('calculator_title')}
            </h2>
            <p className="font-outfit text-lg text-[#F2F0E9]/70 mt-4 max-w-2xl mx-auto">
              {t('calculator_subtitle')}
            </p>
          </div>
          
          <div className="mx-auto max-w-3xl bg-[#0B131E] rounded-[2.5rem] p-8 md:p-14 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-white/5 relative overflow-hidden">
            {/* Refined Inner warm glow */}
            <div className="absolute -top-[20%] -right-[10%] w-[400px] h-[400px] bg-[#CC5833]/15 blur-[100px] rounded-full pointer-events-none" />
            <WasteCostCalculator variant="landing" />
          </div>
        </div>
      </section>

      {/* NAUTICAL COMMAND CENTER NARRATIVE */}
      <section className="relative px-4 md:px-12 lg:px-24">
        <NauticalCommandCenter />
      </section>

      {/* THREE PILLARS (OWNER, CHEF, COMPLIANCE) */}
      <section className="relative px-4 md:px-12 lg:px-24">
        <ThreePillarsDemo />
      </section>

      {/* HOW IT WORKS — 3 Steps */}
      <HowItWorks />

      <NanoBananaPromo />

      {/* DEMO VIDEO — Suspended until real video is ready */}
      {/* <DemoVideoSection /> */}

      {/* C. THE 6 PILLARS — "Explicit Features & Use Cases" */}
      <section id="features" className="py-32 px-8 md:px-24 max-w-screen-2xl mx-auto bg-[#0B131E]">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <h2 className="font-cormorant italic text-5xl md:text-7xl text-[#F2F0E9] tracking-tighter leading-none mb-6">
            {t('features_title')}
          </h2>
        </div>

        <div className="flex flex-col gap-12 lg:gap-24">
          
          {/* Feature 0 (Promoted to Top, Full-Width): Translations */}
          <div className="feature-row bg-[#1A1A1A] text-[#F2F0E9] rounded-[3rem] p-8 lg:p-12 shadow-2xl border border-white/5 flex flex-col items-center text-center relative overflow-hidden">
             {/* Background glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
             
             <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-4xl">
                {/* Big 25 Counter — Hero stat */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <span className="font-cormorant font-bold text-[8rem] md:text-[10rem] lg:text-[12rem] leading-none text-transparent bg-clip-text bg-gradient-to-b from-indigo-300 via-white to-indigo-400 select-none tracking-tighter">
                      25
                    </span>
                    <div className="absolute inset-0 font-cormorant font-bold text-[8rem] md:text-[10rem] lg:text-[12rem] leading-none text-indigo-400/20 blur-2xl select-none pointer-events-none tracking-tighter" aria-hidden="true">
                      25
                    </div>
                  </div>
                  <span className="font-plex-mono text-xs md:text-sm tracking-[0.25em] uppercase text-indigo-300/80">
                    {t('f3_count_label') || 'languages & dialects supported'}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-indigo-500/50"></div>
                  <div className="bg-indigo-500/20 w-12 h-12 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                    <Globe className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-indigo-500/50"></div>
                </div>

                <h3 className="font-cormorant italic font-bold text-4xl md:text-5xl text-white leading-tight">
                  {t('f3_title')}
                </h3>
                <p className="font-outfit text-xl text-slate-300 leading-relaxed max-w-2xl px-4">
                  {t('f3_desc')}
                </p>

                {/* Animated Interactive Translation Bar */}
                <div className="mt-12 w-full bg-[#121212] rounded-[2rem] border border-white/10 p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
                   <div className="flex-1 flex flex-col items-start gap-4 w-full">
                     <span className="font-plex-mono text-xs text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full">{t('language_english')}</span>
                     <p className="font-jakarta text-2xl md:text-3xl text-white font-medium">"Clean the floor thoroughly tonight."</p>
                   </div>
                   
                   <div className="shrink-0 flex items-center justify-center bg-indigo-600/20 w-12 h-12 rounded-full border border-indigo-500/30">
                     <ArrowRight className="w-6 h-6 text-indigo-400" />
                   </div>

                   <div className="flex-1 flex flex-col items-end gap-4 w-full text-right bg-[#1A2332]/5 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent translate-x-[-100%] animate-[shimmer_3s_infinite]"></div>
                     <span className="font-plex-mono text-xs text-[#CC5833] font-bold uppercase tracking-widest bg-[#CC5833]/10 px-3 py-1 rounded-full relative z-10">{t('language_spanish')}</span>
                     <p className="font-jakarta text-2xl md:text-3xl text-indigo-100 font-medium relative z-10">"Limpia el suelo a fondo esta noche."</p>
                   </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <span className="bg-[#1A2332]/5 px-4 py-2 rounded-xl border border-white/5 font-outfit text-sm text-slate-300 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-400"></div> {t('f3_ex1')}</span>
                  <span className="bg-[#1A2332]/5 px-4 py-2 rounded-xl border border-white/5 font-outfit text-sm text-slate-300 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-400"></div> {t('f3_ex2')}</span>
                  <span className="bg-[#1A2332]/5 px-4 py-2 rounded-xl border border-white/5 font-outfit text-sm text-slate-300 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-400"></div> {t('f3_ex3')}</span>
                </div>
             </div>
          </div>
          <div className="feature-row bg-[#1A2332] rounded-[3rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="flex flex-col gap-6">
                <div className="bg-[#2E4036]/10 w-16 h-16 rounded-2xl flex items-center justify-center"><Activity className="w-8 h-8 text-[#2E4036]" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#F2F0E9]">{t('f1_title')}</h3>
                <p className="font-outfit text-lg text-slate-300 leading-relaxed max-w-lg">{t('f1_desc')}</p>
              </div>
            </div>
            <div className="order-1 md:order-2 bg-[#121A26] rounded-[2rem] h-full min-h-[300px] border border-white/5 flex items-center justify-center relative overflow-hidden p-4 md:p-8">
               <div className="w-full bg-[#1A2332] shadow-[0_15px_40px_rgb(0,0,0,0.6)] rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                 {/* Header */}
                 <div className="flex justify-between items-center border-b border-white/5 p-4 bg-[#121A26]/50">
                    <span className="text-xs font-jakarta font-bold text-slate-400">{t('f1_mock_date')}</span>
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold">{t('f1_mock_ai_badge')}</span>
                 </div>
                 
                 {/* Input area */}
                 <div className="p-5 flex flex-col gap-4">
                    <div className="w-full rounded-xl bg-[#121A26] border border-white/10 p-4 relative">
                       <p className="font-outfit text-slate-400 text-sm mb-6">{t('f1_desc').split('.')[0]}...</p>
                       
                       <div className="flex items-center justify-between border-t border-white/10 pt-3">
                         <span className="text-xs font-jakarta font-bold text-slate-400 uppercase tracking-wider">{t('examples_title')}</span>
                       </div>
                       
                       <div className="flex flex-col gap-2 mt-3">
                         <div className="bg-[#1A2332] border border-white/10 rounded-lg p-3 flex gap-3 items-center hover:border-[#CC5833] cursor-pointer transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                           <span className="text-[#CC5833] shrink-0">✦</span>
                           <span className="font-outfit text-xs md:text-sm text-slate-300">{t('f1_ex1')}</span>
                         </div>
                         <div className="bg-[#1A2332] border border-white/10 rounded-lg p-3 flex gap-3 items-center hover:border-[#CC5833] cursor-pointer transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                           <span className="text-[#CC5833] shrink-0">✦</span>
                           <span className="font-outfit text-xs md:text-sm text-slate-300">{t('f1_ex2')}</span>
                         </div>
                         <div className="bg-[#1A2332] border border-white/10 rounded-lg p-3 flex gap-3 items-center hover:border-[#CC5833] cursor-pointer transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                           <span className="text-[#CC5833] shrink-0">✦</span>
                           <span className="font-outfit text-xs md:text-sm text-slate-300">{t('f1_ex3')}</span>
                         </div>
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Feature 2: Compliance */}
          <div className="feature-row bg-[#1A2332] rounded-[3rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-1 bg-[#121A26] border border-white/5 rounded-[2rem] h-64 md:h-full min-h-[300px] flex items-center justify-center relative overflow-hidden">
               {/* Background List Mockup to better use space */}
               <div className="absolute inset-0 p-8 flex flex-col gap-4 opacity-40">
                  <div className="h-10 w-full bg-[#1A2332] rounded-lg border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center px-4"><div className="h-2 w-1/3 bg-slate-200 rounded"></div></div>
                  <div className="h-10 w-full bg-[#1A2332] rounded-lg border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center px-4"><div className="h-2 w-1/2 bg-slate-200 rounded"></div></div>
                  <div className="h-10 w-full bg-[#1A2332] rounded-lg border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center px-4"><div className="h-2 w-1/4 bg-slate-200 rounded"></div></div>
                  <div className="h-10 w-full bg-[#1A2332] rounded-lg border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center px-4"><div className="h-2 w-2/5 bg-slate-200 rounded"></div></div>
               </div>

               <div className="relative z-10 flex flex-col gap-4 w-full max-w-[340px]">
                  <div className="bg-[#1A2332]/80 border border-red-500/30 px-5 py-4 rounded-xl flex flex-col gap-3 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-5 h-5 shrink-0 text-red-500" />
                      <span className="font-plex-mono text-xs font-bold tracking-wide uppercase text-red-600">{tMockups('alert_title')}</span>
                    </div>
                    <span className="font-jakarta text-sm leading-tight text-slate-200">{t('f2_mock_alert')}</span>
                  </div>
                  <div className="bg-[#CC5833] text-white px-5 py-4 rounded-xl flex items-center gap-3 shadow-[0_8px_30px_rgba(204,88,51,0.25)] ml-8">
                    <RotateCw className="w-5 h-5 shrink-0 animate-spin-slow" />
                    <span className="font-outfit text-sm font-bold leading-tight">{t('f2_mock_action')}</span>
                  </div>
               </div>
            </div>
            <div className="order-2">
              <div className="flex flex-col gap-6">
                <div className="bg-amber-500/10 w-16 h-16 rounded-2xl flex items-center justify-center"><TrendingDown className="w-8 h-8 text-amber-600" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#F2F0E9]">{t('f2_title')}</h3>
                <p className="font-outfit text-lg text-slate-300 leading-relaxed">{t('f2_desc')}</p>
                <div className="bg-[#121A26] border border-white/5 p-6 rounded-2xl mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">{t('examples_title')}</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-200">
                    <li className="flex gap-3"><span className="text-amber-500">✦</span> {t('f2_ex1')}</li>
                    <li className="flex gap-3"><span className="text-amber-500">✦</span> {t('f2_ex2')}</li>
                    <li className="flex gap-3"><span className="text-amber-500">✦</span> {t('f2_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>



          {/* Feature 4: Food Cost & Menu Engineering */}
          <div className="feature-row bg-[#121A26] border border-white/10 rounded-[3rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.4)] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-1 bg-[#1A2332] border border-white/10 shadow-[0_20px_50px_rgb(0,0,0,0.5)] rounded-[2rem] h-full min-h-[400px] flex flex-col relative overflow-hidden p-4 md:p-6">
                
                {/* The Matrix */}
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#121A26] border border-white/5 shrink-0">
                  <div className="absolute inset-2 grid grid-cols-2 grid-rows-2 gap-2 opacity-90">
                    <div className="bg-green-50/80 rounded-tl-xl border border-green-100 flex flex-col items-center justify-center p-3 relative overflow-hidden group">
                      <span className="text-green-700/60 text-[10px] font-bold font-jakarta uppercase tracking-widest mb-1 md:mb-2">{t('bcg_stars')}</span>
                      <div className="bg-[#1A2332] px-2 py-1.5 md:px-3 md:py-2 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.4)] w-[95%] lg:w-[85%] flex justify-between items-center border border-green-200 transition-transform group-hover:scale-105">
                        <span className="font-outfit font-semibold text-[10px] md:text-xs text-slate-200 truncate pr-1">Filet Mignon</span>
                        <span className="font-plex-mono text-[9px] md:text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded font-bold">+$12</span>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50/80 rounded-tr-xl border border-amber-100 flex flex-col items-center justify-center p-3 relative overflow-hidden group">
                      <span className="text-amber-700/60 text-[10px] font-bold font-jakarta uppercase tracking-widest mb-1 md:mb-2">{t('bcg_cashcows')}</span>
                      <div className="bg-[#1A2332] px-2 py-1.5 md:px-3 md:py-2 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.4)] w-[95%] lg:w-[85%] flex justify-between items-center border border-amber-200 transition-transform group-hover:scale-105">
                        <span className="font-outfit font-semibold text-[10px] md:text-xs text-slate-200 truncate pr-1">Burger Wagyu</span>
                        <span className="font-plex-mono text-[9px] md:text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">+$4</span>
                      </div>
                    </div>
                    
                    <div className="bg-red-50/80 rounded-bl-xl border border-red-100 flex flex-col items-center justify-center p-3 relative overflow-hidden group">
                      <div className="bg-[#1A2332] px-2 py-1.5 md:px-3 md:py-2 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.4)] w-[95%] lg:w-[85%] flex justify-between items-center border border-red-200 mb-1 md:mb-2 transition-transform group-hover:scale-105">
                        <span className="font-outfit font-semibold text-[10px] md:text-xs text-slate-200 truncate pr-1">Salade Kale</span>
                        <span className="font-plex-mono text-[9px] md:text-[10px] text-red-700 bg-red-100 px-1.5 py-0.5 rounded font-bold">-$2</span>
                      </div>
                      <span className="text-red-700/60 text-[10px] font-bold font-jakarta uppercase tracking-widest">{t('bcg_deadweights')}</span>
                    </div>
                    
                    <div className="bg-blue-50/80 rounded-br-xl border border-blue-100 flex flex-col items-center justify-center p-3 relative overflow-hidden group">
                       <div className="bg-[#1A2332] px-2 py-1.5 md:px-3 md:py-2 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.4)] w-[95%] lg:w-[85%] flex justify-between items-center border border-blue-200 mb-1 md:mb-2 transition-transform group-hover:scale-105">
                        <span className="font-outfit font-semibold text-[10px] md:text-xs text-slate-200 truncate pr-1">Huîtres (Écaille)</span>
                        <span className="font-plex-mono text-[9px] md:text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-bold">+$1</span>
                      </div>
                      <span className="text-blue-700/60 text-[10px] font-bold font-jakarta uppercase tracking-widest">{t('bcg_puzzles')}</span>
                    </div>
                  </div>
                  
                  {/* Sync Label */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="font-plex-mono text-[9px] md:text-[10px] text-slate-400 bg-[#1A2332]/90 backdrop-blur px-3 py-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/10 flex items-center gap-1.5">
                       <RotateCw className="w-3 h-3 text-[#CC5833]" />
                       {t('pos_sync_text')}
                    </div>
                  </div>
                </div>

                {/* Examples Section */}
                <div className="w-full mt-4 bg-[#121A26] border border-white/5 rounded-xl p-4 md:p-5 flex-1 flex flex-col">
                   <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
                     <span className="text-xs font-jakarta font-bold text-slate-400 uppercase tracking-wider">{t('examples_title')}</span>
                   </div>
                   <div className="flex flex-col gap-2 overflow-y-auto">
                     <div className="bg-[#1A2332] border border-white/10 rounded-lg p-3 flex gap-3 items-center hover:border-[#CC5833] cursor-pointer transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                       <span className="text-[#CC5833] shrink-0">✦</span>
                       <span className="font-outfit text-xs md:text-sm text-slate-300 line-clamp-2">{t('f4_ex1')}</span>
                     </div>
                     <div className="bg-[#1A2332] border border-white/10 rounded-lg p-3 flex gap-3 items-center hover:border-[#CC5833] cursor-pointer transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                       <span className="text-[#CC5833] shrink-0">✦</span>
                       <span className="font-outfit text-xs md:text-sm text-slate-300 line-clamp-2">{t('f4_ex2')}</span>
                     </div>
                     <div className="bg-[#1A2332] border border-white/10 rounded-lg p-3 flex gap-3 items-center hover:border-[#CC5833] cursor-pointer transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                       <span className="text-[#CC5833] shrink-0">✦</span>
                       <span className="font-outfit text-xs md:text-sm text-slate-300 line-clamp-2">{t('f4_ex3')}</span>
                     </div>
                   </div>
                </div>
            </div>
            <div className="order-2">
              <div className="flex flex-col gap-6">
                <div className="bg-[#CC5833]/10 w-16 h-16 rounded-2xl flex items-center justify-center"><Activity className="w-8 h-8 text-[#CC5833]" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#F2F0E9]">{t('f4_title')}</h3>
                <p className="font-outfit text-lg text-slate-300 leading-relaxed max-w-lg">{t('f4_desc')}</p>
              </div>
            </div>
          </div>

           {/* Feature 5: Invoice Scanning */}
          <div className="feature-row bg-[#1A2332] rounded-[3rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="flex flex-col gap-6">
                <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center"><ScanLine className="w-8 h-8 text-blue-600" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#F2F0E9]">{t('f5_title')}</h3>
                <p className="font-outfit text-lg text-slate-300 leading-relaxed">{t('f5_desc')}</p>
                <div className="bg-[#121A26] p-6 rounded-2xl border border-white/5 mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">{t('examples_title')}</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-200">
                    <li className="flex gap-3"><span className="text-[#CC5833]">✦</span> {t('f5_ex1')}</li>
                    <li className="flex gap-3"><span className="text-[#CC5833]">✦</span> {t('f5_ex2')}</li>
                    <li className="flex gap-3"><span className="text-[#CC5833]">✦</span> {t('f5_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 bg-[#121A26] rounded-[2rem] h-64 md:h-full min-h-[300px] border border-white/5 flex items-center justify-center relative overflow-hidden p-6 hover:bg-white/10 transition-colors duration-500">
               <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-green-400 opacity-50 shadow-[0_0_5px_#4ade80]">
                  <div className="w-full h-16 bg-gradient-to-b from-transparent via-green-400 to-transparent animate-scroll-y"></div>
               </div>
               <div className="relative z-10 w-full max-w-[260px] flex flex-col gap-4">
                 {/* Extracted line item */}
                 <div className="bg-[#1A2332] border border-white/10 text-xs p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col gap-2 transition-all duration-500 transform hover:-translate-y-1">
                    <span className="font-plex-mono text-slate-400 text-[10px]">{tMockups('invoice_id')}</span>
                    <div className="flex justify-between font-bold font-jakarta text-[#F2F0E9] text-sm">
                      <span>{t('ocr_product')}</span>
                      <span>{t('ocr_price')}</span>
                    </div>
                    <span className="text-[10px] text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded w-fit font-medium">{t('ocr_alert')}</span>
                 </div>
                 
                 {/* Success Update Indicator */}
                 <div className="bg-green-500 text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-between shadow-[0_15px_40px_rgb(0,0,0,0.6)] opacity-90 animate-pulse mt-2">
                    <span>{t('ocr_status')}</span>
                    <span className="font-plex-mono text-[10px]">{tMockups('invoice_update')}</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Feature 6: Social Media Marketing */}
          <div className="feature-row bg-[#1A2332] rounded-[3rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-1 bg-[#121A26] border border-white/5 rounded-[2rem] h-64 md:h-full min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden p-6 text-center">
               <div className="text-3xl mb-4">📸</div>
               <div className="font-outfit text-sm text-slate-300 max-w-xs leading-relaxed">
                 {t('f6_mock_caption')}
               </div>
            </div>
            <div className="order-2">
              <div className="flex flex-col gap-6">
                <div className="bg-emerald-500/10 w-16 h-16 rounded-2xl flex items-center justify-center"><Activity className="w-8 h-8 text-emerald-600" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#F2F0E9] flex items-center flex-wrap gap-3">
                  {t('f6_title')}
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full font-bold tracking-widest uppercase align-middle shrink-0 whitespace-nowrap">{t('beta_badge')}</span>
                </h3>
                <p className="font-outfit text-lg text-slate-300 leading-relaxed">{t('f6_desc')}</p>
                <div className="bg-[#121A26] border border-white/5 p-6 rounded-2xl mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">{t('examples_title')}</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-200">
                    <li className="flex gap-3"><span className="text-emerald-500">✦</span> {t('f6_ex1')}</li>
                    <li className="flex gap-3"><span className="text-emerald-500">✦</span> {t('f6_ex2')}</li>
                    <li className="flex gap-3"><span className="text-emerald-500">✦</span> {t('f6_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>


          {/* Feature 7: Reservations */}
          <div className="feature-row bg-[#1A2332] rounded-[3rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="flex flex-col gap-6">
                <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center"><CalendarCheck className="w-8 h-8 text-indigo-600" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#F2F0E9]">{t('f7_title')}</h3>
                <p className="font-outfit text-lg text-slate-300 leading-relaxed">{t('f7_desc')}</p>
                <div className="bg-indigo-500/10 p-6 rounded-2xl border border-indigo-500/20 mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-indigo-300 mb-4">{t('examples_title')}</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-200">
                    <li className="flex gap-3"><span className="text-indigo-500">✦</span> {t('f7_ex1')}</li>
                    <li className="flex gap-3"><span className="text-indigo-500">✦</span> {t('f7_ex2')}</li>
                    <li className="flex gap-3"><span className="text-indigo-500">✦</span> {t('f7_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 bg-black/40 rounded-[2rem] h-64 md:h-full min-h-[300px] flex items-center justify-center relative overflow-hidden p-6">
              <div className="w-full max-w-[300px] flex flex-col gap-3">
                <div className="flex gap-2 mb-1">
                  <span className="font-plex-mono text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-full">LIBRO ●</span>
                  <span className="font-plex-mono text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-full">RESY ●</span>
                  <span className="font-plex-mono text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-full">ZENCHEF ●</span>
                </div>
                <div className="bg-[#1A2332]/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
                  <div><p className="font-jakarta font-bold text-white text-xs">Martin, L.</p><p className="font-outfit text-slate-400 text-[10px]">19:30 · 4 pers.</p></div>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">{t('res_confirmed')}</span>
                </div>
                <div className="bg-[#1A2332]/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
                  <div><p className="font-jakarta font-bold text-white text-xs">Dubois, A.</p><p className="font-outfit text-slate-400 text-[10px]">20:00 · 2 pers.</p></div>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">{t('res_confirmed')}</span>
                </div>
                <div className="bg-[#1A2332]/5 border border-white/10 rounded-xl p-3 flex justify-between items-center opacity-50">
                  <div><p className="font-jakarta font-bold text-white text-xs">Bernard, S.</p><p className="font-outfit text-slate-400 text-[10px]">21:00 · 6 pers.</p></div>
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">{t('res_cancelled')}</span>
                </div>
                <div className="mt-1 flex justify-between items-center">
                  <span className="font-plex-mono text-[9px] text-slate-400">{t('res_mock_last_sync')}</span>
                  <span className="font-plex-mono text-[9px] text-indigo-400 animate-pulse">{t('res_mock_live')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 8: Smart Prep Lists */}
          <div className="feature-row bg-[#1A2332] rounded-[3rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-1 bg-[#121A26] border border-white/5 rounded-[2rem] h-64 md:h-full min-h-[300px] flex items-center justify-center relative overflow-hidden p-6">
              <div className="w-full max-w-[290px] flex flex-col gap-2">
                <div className="font-plex-mono text-[10px] text-slate-400 mb-3 flex justify-between">
                  <span>{t('prep_header')}</span>
                  <span className="text-amber-500 animate-pulse">{t('prep_mock_auto')}</span>
                </div>
                <div className="bg-[#1A2332] border border-white/10 rounded-lg p-2.5 flex justify-between items-center shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                  <span className="font-outfit text-slate-200 text-xs font-semibold">{t('prep_item_beef')}</span>
                  <div className="flex items-center gap-2"><span className="font-plex-mono text-[#F2F0E9] text-xs font-bold">4.8 KG</span><span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-orange-100 text-orange-700">{t('prep_mock_pos')}</span></div>
                </div>
                <div className="bg-[#1A2332] border border-white/10 rounded-lg p-2.5 flex justify-between items-center shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                  <span className="font-outfit text-slate-200 text-xs font-semibold">{t('prep_item_salmon')}</span>
                  <div className="flex items-center gap-2"><span className="font-plex-mono text-[#F2F0E9] text-xs font-bold">3.2 KG</span><span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-indigo-100 text-indigo-700">{t('prep_mock_resa')}</span></div>
                </div>
                <div className="bg-[#1A2332] border border-white/10 rounded-lg p-2.5 flex justify-between items-center shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                  <span className="font-outfit text-slate-200 text-xs font-semibold">{t('prep_item_potato')}</span>
                  <div className="flex items-center gap-2"><span className="font-plex-mono text-[#F2F0E9] text-xs font-bold">12 KG</span><span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-green-100 text-green-700">{t('prep_mock_recipe')}</span></div>
                </div>
                <div className="bg-[#1A2332] border border-white/10 rounded-lg p-2.5 flex justify-between items-center shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                  <span className="font-outfit text-slate-200 text-xs font-semibold">{t('prep_item_cream')}</span>
                  <div className="flex items-center gap-2"><span className="font-plex-mono text-[#F2F0E9] text-xs font-bold">1.5 L</span><span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-orange-100 text-orange-700">{t('prep_mock_pos')}</span></div>
                </div>
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex justify-between">
                  <span className="font-outfit text-amber-800 text-xs font-bold">{t('prep_cost_label')}</span>
                  <span className="font-plex-mono text-amber-700 text-xs font-bold">342.50 $</span>
                </div>
              </div>
            </div>
            <div className="order-2">
              <div className="flex flex-col gap-6">
                <div className="bg-amber-50 w-16 h-16 rounded-2xl flex items-center justify-center"><ChefHat className="w-8 h-8 text-amber-600" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#F2F0E9]">{t('f8_title')}</h3>
                <p className="font-outfit text-lg text-slate-300 leading-relaxed">{t('f8_desc')}</p>
                <div className="bg-[#121A26] border border-white/5 p-6 rounded-2xl mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">{t('examples_title')}</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-200">
                    <li className="flex gap-3"><span className="text-amber-500">✦</span> {t('f8_ex1')}</li>
                    <li className="flex gap-3"><span className="text-amber-500">✦</span> {t('f8_ex2')}</li>
                    <li className="flex gap-3"><span className="text-amber-500">✦</span> {t('f8_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 9: Liquid Intelligence (Bar & Brewery) */}
          <div className="feature-row bg-[#1A2332] rounded-[3rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="flex flex-col gap-6">
                <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center"><Beer className="w-8 h-8 text-emerald-600" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#F2F0E9]">{t('f9_title')}</h3>
                <p className="font-outfit text-lg text-slate-300 leading-relaxed">{t('f9_desc')}</p>
                <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20 mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-emerald-400 mb-4">{t('examples_title')}</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-200">
                    <li className="flex gap-3"><span className="text-emerald-500">✦</span> {t('f9_ex1')}</li>
                    <li className="flex gap-3"><span className="text-emerald-500">✦</span> {t('f9_ex2')}</li>
                    <li className="flex gap-3"><span className="text-emerald-500">✦</span> {t('f9_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 bg-[#1A1A1A] rounded-[2rem] h-64 md:h-full min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              {/* Animated Mockup of liquid tracking */}
              <div className="w-full h-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#2E4036]/20 z-0"></div>
                
                {/* 3 Floating Cards for the Bar modules */}
                <div className="relative z-10 flex flex-col gap-4 w-full max-w-[280px]">
                  {/* Deposits Card */}
                  <div className="bg-[#2E4036] border border-[#3e5548] p-4 rounded-2xl flex items-center gap-4 hover:translate-x-2 transition-transform shadow-[0_15px_40px_rgb(0,0,0,0.6)] cursor-default">
                    <div className="bg-[#1A2332]/10 p-2 rounded-xl shrink-0"><Recycle className="w-5 h-5 text-[#F2F0E9]" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-plex-mono text-[10px] text-white/50 tracking-widest uppercase mb-1">{t('bar_mock_kegs')}</p>
                      <div className="flex justify-between items-end">
                        <p className="font-jakarta font-bold text-white text-base truncate">{t('bar_mock_kegs_val')}</p>
                        <p className="font-outfit font-bold text-[#CC5833] text-sm tabular-nums">+$720.00</p>
                      </div>
                    </div>
                  </div>

                  {/* Variance Card */}
                  <div className="bg-[#1A1A1A] border border-white/10 p-4 rounded-2xl flex items-center gap-4 hover:translate-x-2 transition-transform shadow-[0_15px_40px_rgb(0,0,0,0.6)] cursor-default delay-100">
                    <div className="bg-red-500/10 p-2 rounded-xl shrink-0"><Droplets className="w-5 h-5 text-red-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-plex-mono text-[10px] text-red-400/70 tracking-widest uppercase mb-1">{t('bar_mock_variance')}</p>
                      <div className="flex justify-between items-end">
                        <p className="font-jakarta font-bold text-white text-base truncate">{tMockups('mock_beer1')}</p>
                        <p className="font-outfit font-bold text-red-400 text-sm tabular-nums">-1.2L</p>
                      </div>
                    </div>
                  </div>

                  {/* Brewery Production Card */}
                  <div className="bg-[#1f2d25] border border-[#3e5548] p-4 rounded-2xl flex items-center gap-4 hover:translate-x-2 transition-transform shadow-[0_15px_40px_rgb(0,0,0,0.6)] cursor-default delay-200">
                    <div className="bg-amber-500/10 p-2 rounded-xl shrink-0"><Beer className="w-5 h-5 text-amber-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-plex-mono text-[10px] text-amber-500/70 tracking-widest uppercase mb-1">{t('bar_mock_batch')}</p>
                      <div className="flex justify-between items-end">
                        <p className="font-jakarta font-bold text-white text-base truncate">{tMockups('mock_beer2')}</p>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase border border-indigo-500/20">{t('bar_mock_kegging')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 10: Live Utility Costs */}
          <div className="feature-row bg-[#121A26] border border-white/10 rounded-[3rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.4)] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-1 bg-[#1A2332] border border-white/10 shadow-[0_20px_50px_rgb(0,0,0,0.5)] rounded-[2rem] h-full min-h-[400px] flex flex-col relative overflow-hidden p-6">
                
                {/* The Visual Mockup */}
                <div className="relative w-full h-full flex flex-col gap-6">
                  {/* Energy Widget Mockup */}
                  <div className="bg-card backdrop-blur-md rounded-2xl border border-border/50 shadow-md p-4 relative overflow-hidden bg-black/40 flex-1">
                     <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xs font-outfit font-medium text-white/90">{t('f10_title')}</h3>
                        <span className="text-white/30 opacity-50 tracking-widest leading-none">...</span>
                     </div>
                     
                     <div className="flex items-end gap-3 mb-2">
                        <span className="font-cormorant font-bold text-3xl text-primary text-cyan-400">1,240</span>
                        <span className="font-plex-mono text-[9px] text-white/50 mb-1 leading-none">kWh</span>
                     </div>

                     <div className="mt-auto flex justify-between h-[80px] px-2">
                        {[
                          { d: "Jul", cyan: 30, pink: 60 },
                          { d: "Aug", cyan: 60, pink: 20 },
                          { d: "Sep", cyan: 50, pink: 50 },
                          { d: "Oct", cyan: 40, pink: 30 },
                          { d: "Nov", cyan: 70, pink: 40 },
                          { d: "Dec", cyan: 90, pink: 30 },
                        ].map((bar, i) => (
                          <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 z-0">
                            <div className="w-full max-w-[16px] flex flex-col justify-end gap-[1px] rounded-t-sm overflow-hidden h-full">
                              <div className="w-full bg-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.4)] transition-all rounded-t-sm" style={{ height: `${bar.cyan}%` }}></div>
                              <div className="w-full bg-pink-500 shadow-[0_0_10px_rgba(255,0,122,0.4)] transition-all rounded-b-sm" style={{ height: `${bar.pink}%` }}></div>
                            </div>
                            <span className="text-[7px] text-white/40 mt-1">{bar.d}</span>
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* Water Widget Mockup */}
                  <div className="bg-card backdrop-blur-md rounded-2xl border border-border/50 shadow-md p-4 relative overflow-hidden bg-black/40 flex-1">
                     <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xs font-outfit font-medium text-white/90">{t('utility_mock_water')}</h3>
                        <span className="text-white/30 opacity-50 tracking-widest leading-none">...</span>
                     </div>
                     
                     <div className="flex items-end gap-3 mb-2">
                        <span className="font-cormorant font-bold text-3xl text-primary text-cyan-400">8.5</span>
                        <span className="font-plex-mono text-[9px] text-white/50 mb-1 leading-none">kL</span>
                     </div>

                     <div className="relative h-[60px] w-full mt-auto">
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <defs>
                            <linearGradient id="gradientLineLanding" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.1" />
                              <stop offset="50%" stopColor="#00E5FF" stopOpacity="1" />
                              <stop offset="100%" stopColor="#FF007A" stopOpacity="1" />
                            </linearGradient>
                            <filter id="glowLanding">
                              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>
                          <path 
                            d="M 0,80 Q 15,50 30,70 T 60,40 T 100,20" 
                            fill="none" 
                            stroke="url(#gradientLineLanding)" 
                            strokeWidth="3"
                            filter="url(#glowLanding)"
                          />
                        </svg>
                     </div>
                  </div>
                </div>

            </div>
            <div className="order-2">
              <div className="flex flex-col gap-6">
                <div className="bg-cyan-50 w-16 h-16 rounded-2xl flex items-center justify-center"><Zap className="w-8 h-8 text-cyan-600" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#F2F0E9]">{t('f10_title')}</h3>
                <p className="font-outfit text-lg text-slate-300 leading-relaxed max-w-lg">{t('f10_desc')}</p>
                <div className="bg-[#121A26] border border-white/5 p-6 rounded-2xl mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">{t('examples_title')}</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-200">
                    <li className="flex gap-3"><span className="text-cyan-500">✦</span> {t('f10_ex1')}</li>
                    <li className="flex gap-3"><span className="text-cyan-500">✦</span> {t('f10_ex2')}</li>
                    <li className="flex gap-3"><span className="text-cyan-500">✦</span> {t('f10_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 11: Le Nid (Financial Intelligence) */}
          <div className="feature-row bg-gradient-to-br from-[#121A26] to-[#0A0F16] border border-white/10 rounded-[3rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.4)] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex flex-col gap-6">
                <div className="bg-emerald-500/10 w-16 h-16 rounded-2xl flex items-center justify-center"><PiggyBank className="w-8 h-8 text-emerald-400" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#F2F0E9]">{t('f11_title')}</h3>
                <p className="font-outfit text-lg text-slate-300 leading-relaxed max-w-lg">{t('f11_desc')}</p>
                <div className="bg-[#1A2332] border border-white/5 p-6 rounded-2xl mt-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16"></div>
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 relative z-10">{t('examples_title')}</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-200 relative z-10">
                    <li className="flex gap-3"><span className="text-emerald-500">✦</span> {t('f11_ex1')}</li>
                    <li className="flex gap-3"><span className="text-emerald-500">✦</span> {t('f11_ex2')}</li>
                    <li className="flex gap-3"><span className="text-emerald-500">✦</span> {t('f11_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Visual Design for Le Nid */}
            <div className="order-1 lg:order-2 bg-[#1A2332] border border-white/10 shadow-[0_20px_50px_rgb(0,0,0,0.5)] rounded-[2rem] h-full min-h-[400px] flex flex-col relative overflow-hidden p-6 md:p-8 items-center justify-center">
              {/* Background grid/glow */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(to right, #4ade80 1px, transparent 1px), linear-gradient(to bottom, #4ade80 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
              
              <div className="w-full max-w-[320px] flex flex-col gap-5 relative z-10">
                {/* Glassmorphic Net Profit Widget */}
                <div className="bg-[#121A26]/80 backdrop-blur-xl rounded-[24px] border border-emerald-500/20 shadow-[0_8px_32px_rgba(16,185,129,0.15)] p-5 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <span className="text-emerald-400 font-bold text-xs">$</span>
                      </div>
                      <span className="text-sm font-outfit text-white/80 font-medium tracking-wide">{t('nest_net_profit')}</span>
                    </div>
                    <span className="text-[10px] font-plex-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">+18.4%</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-cormorant font-bold text-white tracking-tight">12,450</span>
                    <span className="text-sm text-white/40 font-outfit">.00</span>
                  </div>
                </div>

                {/* Mini Cash Flow Chart */}
                <div className="bg-[#121A26]/80 backdrop-blur-xl rounded-[24px] border border-white/5 shadow-xl p-5 relative hover:scale-[1.02] transition-transform duration-300 delay-100">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-outfit text-white/60 tracking-wider uppercase">{t('nest_cash_flow')}</span>
                    <Activity className="w-4 h-4 text-emerald-400/80" />
                  </div>
                  <div className="h-[80px] flex items-end justify-between gap-[3px] px-1 relative">
                    {/* Zero line */}
                    <div className="absolute left-0 right-0 bottom-4 h-[1px] bg-white/10 border-0 border-dashed border-white/20"></div>
                    
                    {[
                      { val: 40, color: 'from-emerald-400 to-emerald-600', shadow: 'shadow-[0_0_10px_rgba(52,211,153,0.3)]' },
                      { val: 60, color: 'from-emerald-400 to-emerald-600', shadow: 'shadow-[0_0_10px_rgba(52,211,153,0.3)]' },
                      { val: -15, color: 'from-red-400 to-red-600', shadow: '' },
                      { val: 70, color: 'from-emerald-400 to-emerald-600', shadow: 'shadow-[0_0_10px_rgba(52,211,153,0.3)]' },
                      { val: 50, color: 'from-emerald-400 to-emerald-600', shadow: 'shadow-[0_0_10px_rgba(52,211,153,0.3)]' },
                      { val: -20, color: 'from-red-400 to-red-600', shadow: '' },
                      { val: 85, color: 'from-emerald-400 to-emerald-600', shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.4)]' },
                    ].map((item, i) => (
                      <div key={i} className="w-full flex flex-col justify-end items-center relative h-full">
                          {item.val > 0 ? (
                              <div 
                                className={`w-full max-w-[12px] rounded-t-sm bg-gradient-to-t ${item.color} ${item.shadow} transition-all duration-300 hover:brightness-125 mb-4`}
                                style={{ height: `${item.val}%` }}
                              ></div>
                          ) : (
                              <div 
                                className={`w-full max-w-[12px] rounded-b-sm bg-gradient-to-b ${item.color} absolute top-[calc(100%-1rem)] transition-all duration-300 hover:brightness-125`}
                                style={{ height: `${Math.abs(item.val)}%` }}
                              ></div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* BEFORE/AFTER COMPARISON */}
      <BeforeAfterComparison />

      {/* D. PHILOSOPHY — "The Manifesto" */}
      <section id="philosophy" className="relative py-0 bg-[#1A1A1A] text-[#F2F0E9] overflow-hidden">
        {/* Parallax Organic Texture */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.07]"
          role="img"
          aria-label={t('philosophy_bg_alt')}
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542841791-d3fa1b439f03?q=80&w=2000&auto=format&fit=crop')" }}
        ></div>

        {/* Top Manifesto — Contrast Statements */}
        <div className="relative z-10 max-w-6xl mx-auto px-8 md:px-24 pt-24 md:pt-32 pb-16 md:pb-24">
          <div className="flex flex-col gap-6 md:gap-10 items-center text-center">
            {/* The "old way" — muted, understated */}
            <p className="philosophy-text font-outfit text-lg md:text-2xl text-[#6B7280] leading-relaxed max-w-4xl mx-auto">
              {t('philosophy_intro')}
            </p>

            {/* The decorative accent line */}
            <div className="flex items-center justify-center gap-6">
              <div className="w-24 h-[2px] bg-gradient-to-r from-[#CC5833] to-transparent"></div>
              <span className="font-plex-mono text-xs uppercase tracking-[0.3em] text-[#CC5833]/60">{t('philosophy_approach')}</span>
              <div className="w-24 h-[2px] bg-gradient-to-l from-[#CC5833] to-transparent"></div>
            </div>

            {/* The "Rive way" — massive, cinematic */}
            <p className="philosophy-text font-cormorant italic text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.1] max-w-5xl mx-auto">
              {t('philosophy_vision')}
            </p>
          </div>
        </div>

        {/* Bottom Pillars — Horizontal numbered cards */}
        <div className="relative z-10 border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-8 md:px-24 pt-16 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 md:gap-0">
              
              {/* Pillar 1 */}
              <div className="group relative py-10 md:py-12 md:px-10 lg:border-r border-white/[0.06] border-b lg:border-b-0 transition-colors duration-500 hover:bg-[#1A2332]/[0.02]">
                <span className="font-plex-mono text-[#CC5833] text-xs font-bold tracking-widest block mb-6">01</span>
                <h3 className="font-jakarta font-bold text-xl md:text-2xl mb-4 group-hover:translate-x-1 transition-transform duration-500">{t('philosophy_pillar1_title')}</h3>
                <p className="font-outfit text-[#6B7280] text-base leading-relaxed">{t('philosophy_pillar1_desc')}</p>
              </div>

              {/* Pillar 2 */}
              <div className="group relative py-10 md:py-12 md:px-10 lg:border-r border-white/[0.06] border-b lg:border-b-0 transition-colors duration-500 hover:bg-[#1A2332]/[0.02]">
                <span className="font-plex-mono text-[#CC5833] text-xs font-bold tracking-widest block mb-6">02</span>
                <h3 className="font-jakarta font-bold text-xl md:text-2xl mb-4 group-hover:translate-x-1 transition-transform duration-500">{t('philosophy_pillar2_title')}</h3>
                <p className="font-outfit text-[#6B7280] text-base leading-relaxed">{t('philosophy_pillar2_desc')}</p>
              </div>

              {/* Pillar 3 */}
              <div className="group relative py-10 md:py-12 md:px-10 transition-colors duration-500 hover:bg-[#1A2332]/[0.02]">
                <span className="font-plex-mono text-[#CC5833] text-xs font-bold tracking-widest block mb-6">03</span>
                <h3 className="font-jakarta font-bold text-xl md:text-2xl mb-4 group-hover:translate-x-1 transition-transform duration-500">{t('philosophy_pillar3_title')}</h3>
                <p className="font-outfit text-[#6B7280] text-base leading-relaxed">{t('philosophy_pillar3_desc')}</p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* E. PROTOCOL — "Sticky Stacking Archive" */}
      <section id="protocol" className="py-24 px-8 md:px-24 max-w-screen-xl mx-auto">
        <div className="text-center mb-24 flex flex-col items-center">
          <h2 className="font-cormorant italic font-semibold text-5xl md:text-6xl lg:text-7xl text-[#F2F0E9] mb-6">{t('protocol_title')}</h2>
          <div className="flex items-center justify-center gap-4 mb-6">
             <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-slate-300"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-[#CC5833]"></div>
             <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-slate-300"></div>
          </div>
          <p className="font-outfit text-lg md:text-xl text-slate-400 max-w-2xl">{t('protocol_desc')}</p>
        </div>

        <div className="protocol-container relative pb-16">
          {/* Card 1 */}
          <div className="sticky top-24 z-10 bg-gradient-to-br from-[#2E4036] to-[#18231d] border border-white/10 text-[#F2F0E9] p-10 md:p-16 rounded-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] mb-8 flex flex-col lg:flex-row items-center gap-12 min-h-[50vh] backdrop-blur-xl">
            <div className="flex-1 w-full relative z-10">
              <div className="font-plex-mono text-[#CC5833] font-bold text-xs uppercase tracking-widest mb-4 inline-block bg-[#CC5833]/10 px-3 py-1.5 rounded-full border border-[#CC5833]/20 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">{t('protocol_phase1_label')}</div>
              <h3 className="font-jakarta font-bold text-4xl md:text-5xl lg:text-5xl mb-6 leading-tight text-white">{t('protocol_phase1_title')}</h3>
              <p className="font-outfit text-lg opacity-80 mb-8 max-w-md leading-relaxed">{t('protocol_phase1_desc')}</p>
              
              <div className="w-full max-w-md bg-[#1A2332]/5 border border-white/10 rounded-full overflow-hidden mb-2">
                <div className="h-1.5 bg-gradient-to-r from-[#CC5833] to-amber-500 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
            {/* Visual element */}
            <div className="flex-1 w-full flex justify-center lg:justify-end">
              <div className="w-full max-w-sm h-64 bg-[#1A2332]/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md shadow-2xl">
                 <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                    <span className="font-jakarta font-bold text-white text-sm">Synchronisation active</span>
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]"></span>
                 </div>
                 <div className="flex flex-col gap-3">
                   <div className="bg-[#1A2332]/5 border border-white/10 p-3 rounded-xl flex items-center justify-between transition-transform duration-500 hover:scale-105">
                     <span className="font-plex-mono text-xs text-white">Libro</span>
                     <span className="font-plex-mono text-[10px] text-green-400">Connecté</span>
                   </div>
                   <div className="bg-[#1A2332]/5 border border-white/10 p-3 rounded-xl flex items-center justify-between transition-transform duration-500 hover:scale-105" style={{ transitionDelay: '100ms' }}>
                     <span className="font-plex-mono text-xs text-white">Resy</span>
                     <span className="font-plex-mono text-[10px] text-green-400">Connecté</span>
                   </div>
                   <div className="bg-[#1A2332]/5 border border-white/10 p-3 rounded-xl flex items-center justify-between opacity-50">
                     <span className="font-plex-mono text-xs text-white">Zenchef</span>
                     <span className="font-plex-mono text-[10px] text-slate-400">En attente</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="sticky top-32 z-20 bg-gradient-to-br from-[#CC5833] to-[#993e20] border border-white/10 text-[#F2F0E9] p-10 md:p-16 rounded-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.4)] mb-8 flex flex-col lg:flex-row items-center gap-12 min-h-[50vh] backdrop-blur-xl">
            <div className="flex-1 w-full relative z-10">
              <div className="font-plex-mono text-[#F2F0E9] font-bold text-xs uppercase tracking-widest mb-4 inline-block bg-[#1A2332]/20 px-3 py-1.5 rounded-full border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">{t('protocol_phase2_label')}</div>
              <h3 className="font-jakarta font-bold text-4xl md:text-5xl lg:text-5xl mb-6 leading-tight text-white">{t('protocol_phase2_title')}</h3>
              <p className="font-outfit text-lg opacity-90 mb-8 max-w-md leading-relaxed">{t('protocol_phase2_desc')}</p>
              
              <div className="w-full max-w-md bg-[#1A2332]/10 border border-white/20 rounded-full overflow-hidden mb-2">
                <div className="h-1.5 bg-[#0B131E] rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            {/* Visual element */}
            <div className="flex-1 w-full flex justify-center lg:justify-end">
              <div className="w-full max-w-sm h-64 bg-black/20 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md shadow-2xl flex flex-col gap-4">
                 {/* Scanner line animation */}
                 <div className="absolute top-0 left-0 w-full h-[1px] bg-[#1A2332]/60 animate-[ping_3s_ease-in-out_infinite] z-20 shadow-[0_0_15px_#ffffff]"></div>
                 
                 <div className="font-plex-mono text-[10px] text-white/50 uppercase tracking-widest text-center border-b border-white/10 pb-2 mb-2">Extraction Ticket</div>
                 
                 {/* Receipt mockup */}
                 <div className="bg-[#1A2332] shadow-xl rounded w-3/4 mx-auto p-4 rotate-2 relative">
                    {/* jagged bottom edge effect via border */}
                    <div className="absolute -bottom-2 left-0 w-full h-2 bg-gradient-to-r from-transparent to-white bg-[length:10px_10px] rotate-180"></div>
                    
                    <div className="w-full flex justify-between items-center mb-3">
                       <span className="w-1/2 h-2 bg-slate-200 rounded"></span>
                       <span className="w-1/4 h-2 bg-slate-200 rounded"></span>
                    </div>
                    <div className="w-full flex justify-between items-center mb-1.5 opacity-80">
                       <span className="w-2/3 h-1.5 bg-white/10 rounded"></span>
                       <span className="w-1/4 h-1.5 bg-slate-200 rounded"></span>
                    </div>
                    <div className="w-full flex justify-between items-center mb-3 opacity-80">
                       <span className="w-1/3 h-1.5 bg-white/10 rounded"></span>
                       <span className="w-1/4 h-1.5 bg-slate-200 rounded"></span>
                    </div>
                    <div className="w-full border-t border-dashed border-white/20 pt-2 flex justify-between items-center mt-2">
                       <span className="font-jakarta font-bold text-xs text-white">TOTAL</span>
                       <span className="font-plex-mono font-bold text-xs text-white">$142.50</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="sticky top-40 z-30 bg-gradient-to-br from-[#101010] to-[#1A1A1A] border border-white/10 text-[#F2F0E9] p-10 md:p-16 rounded-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col lg:flex-row items-center gap-12 min-h-[50vh] backdrop-blur-2xl">
            <div className="flex-1 w-full relative z-10">
              <div className="font-plex-mono text-[#CC5833] font-bold text-xs uppercase tracking-widest mb-4 inline-block bg-[#CC5833]/10 px-3 py-1.5 rounded-full border border-[#CC5833]/20 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">{t('protocol_phase3_label')}</div>
              <h3 className="font-jakarta font-bold text-4xl md:text-5xl lg:text-5xl mb-6 leading-tight text-white">{t('protocol_phase3_title')}</h3>
              <p className="font-outfit text-lg opacity-80 mb-10 max-w-md leading-relaxed">{t('protocol_phase3_desc')}</p>
              
              <div className="flex items-center gap-6">
                 <Link href="/signup" className="inline-block bg-[#0B131E] text-[#F2F0E9] px-10 py-5 rounded-full font-bold text-lg hover:bg-[#1A2332] hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    {t('protocol_cta')}
                 </Link>
                 <span className="text-white/40 text-sm font-outfit uppercase tracking-wider font-semibold">100% calibré</span>
              </div>
            </div>
            {/* Visual element */}
            <div className="flex-1 w-full flex justify-center lg:justify-end">
               <div className="w-full max-w-sm aspect-square relative flex items-center justify-center border border-white/5 rounded-full bg-gradient-to-b from-white/5 to-transparent">
                  <div className="absolute inset-4 rounded-full border border-white/10 animate-[spin_20s_linear_infinite]"></div>
                  <div className="absolute inset-12 rounded-full border border-dashed border-[#CC5833]/30 animate-[spin_15s_linear_infinite_reverse]"></div>
                  <div className="absolute inset-24 rounded-full bg-gradient-to-tr from-[#CC5833]/20 to-transparent animate-pulse backdrop-blur-sm shadow-[0_0_50px_rgba(204,88,51,0.2)]"></div>
                  
                  {/* Glowing center */}
                  <div className="relative w-20 h-20 rounded-full bg-[#1A2332] flex items-center justify-center shadow-[0_0_30px_#ffffff]">
                     <Activity className="w-8 h-8 text-[#F2F0E9]" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* G. FOOTER */}
      <footer className="bg-[#1A1A1A] text-[#F2F0E9] rounded-t-[4rem] px-8 md:px-24 pt-16 pb-12 mt-24">
        {/* Footer content */}
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
      
      {/* Global Animation Styles placed here to guarantee they are parsed */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        @keyframes scrollY {
          from { transform: translateY(-100%); }
          to { transform: translateY(300px); }
        }
        .animate-scroll-y {
           animation: scrollY 3s linear infinite;
        }
        @keyframes scrollX {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-scroll-x {
          animation: scrollX 30s linear infinite;
        }
      `}} />
    </div>
  );
}
