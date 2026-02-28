"use client";

import { useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, RotateCw, Activity, Calendar, Thermometer, Globe, CalendarCheck, ChefHat, TrendingDown, ScanLine, Beer, Droplets, Recycle } from "lucide-react";
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
      // 4. Protocol Stacking Cards Animation
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
            className="nav-btn flex items-center justify-center text-center whitespace-nowrap bg-[#F2F0E9] text-[#1A1A1A] px-5 py-2.5 rounded-full text-sm font-semibold hover:scale-[1.03] transition-transform duration-300"
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
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542401886-65d6c61db217?q=80&w=2048&auto=format&fit=crop')" }}
        >
          {/* Dune 2049 heavy amber/obsidian gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#4A1C00]/80 to-[#1A1A1A]/60 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent"></div>
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
          <div className="hero-text mt-12 w-full flex">
            <Link 
              href="/signup" 
              className="group relative overflow-hidden inline-flex items-center justify-center text-center whitespace-nowrap gap-2 bg-[#CC5833] text-[#F2F0E9] px-8 py-4 rounded-full font-bold text-lg hover:scale-[1.03] transition-transform duration-300"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">{t('hero_cta')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
              <span className="absolute inset-0 bg-[#1A1A1A] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></span>
            </Link>
          </div>
        </div>
      </section>

      {/* POS Integrations Banner */}
      <div className="w-full bg-[#1A1A1A] text-[#CC5833] py-5 overflow-hidden border-y border-[#1A1A1A]/10">
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
                 <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-jakarta font-bold text-slate-400">{t('f1_mock_date')}</span>
                    <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold">{t('f1_mock_urgent')}</span>
                 </div>
                 <div className="flex flex-col gap-4">
                    <div className="flex gap-3 items-start">
                       <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0 shadow-[0_0_8px_#f87171]"></div>
                       <div>
                          <p className="text-sm font-outfit text-slate-700 leading-tight">{t('f1_mock_entry1')}</p>
                          <p className="text-[11px] font-outfit text-indigo-500 mt-1.5 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">{t('f1_mock_ai_task')}</p>
                       </div>
                    </div>
                    <div className="flex gap-3 items-start">
                       <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0"></div>
                       <div>
                          <p className="text-sm font-outfit text-slate-700 leading-tight">{t('f1_mock_entry2')}</p>
                       </div>
                    </div>
                 </div>
                 <div className="mt-auto self-end px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">{t('f1_mock_ai_badge')}</div>
               </div>
            </div>
          </div>

          {/* Feature 2: Compliance */}
          <div className="feature-row bg-[#1A1A1A] text-[#F2F0E9] rounded-[3rem] p-8 md:p-12 shadow-md grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-1 bg-[#232323] rounded-[2rem] h-64 md:h-full min-h-[300px] flex items-center justify-center relative overflow-hidden">
               {/* Background List Mockup to better use space */}
               <div className="absolute inset-0 p-8 flex flex-col gap-4 opacity-20">
                  <div className="h-10 w-full bg-[#1A1A1A] rounded-lg border border-white/5 flex items-center px-4"><div className="h-2 w-1/3 bg-white/20 rounded"></div></div>
                  <div className="h-10 w-full bg-[#1A1A1A] rounded-lg border border-white/5 flex items-center px-4"><div className="h-2 w-1/2 bg-white/20 rounded"></div></div>
                  <div className="h-10 w-full bg-[#1A1A1A] rounded-lg border border-white/5 flex items-center px-4"><div className="h-2 w-1/4 bg-white/20 rounded"></div></div>
                  <div className="h-10 w-full bg-[#1A1A1A] rounded-lg border border-white/5 flex items-center px-4"><div className="h-2 w-2/5 bg-white/20 rounded"></div></div>
               </div>

               <div className="relative z-10 flex flex-col gap-4 w-full max-w-[340px]">
                  <div className="bg-red-500/10 text-red-400 border border-red-500/20 px-5 py-4 rounded-xl flex flex-col gap-3 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-5 h-5 shrink-0" />
                      <span className="font-plex-mono text-xs font-bold tracking-wide uppercase">Alerte IA - Marge en Baisse</span>
                    </div>
                    <span className="font-jakarta text-sm leading-tight">{t('f2_mock_alert')}</span>
                  </div>
                  <div className="bg-[#CC5833] text-white px-5 py-4 rounded-xl flex items-center gap-3 shadow-2xl ml-8">
                    <RotateCw className="w-5 h-5 shrink-0 animate-spin-slow" />
                    <span className="font-outfit text-sm font-bold leading-tight">{t('f2_mock_action')}</span>
                  </div>
               </div>
            </div>
            <div className="order-2">
              <div className="flex flex-col gap-6">
                <div className="bg-amber-500/10 w-16 h-16 rounded-2xl flex items-center justify-center"><TrendingDown className="w-8 h-8 text-amber-500" /></div>
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
               <div className="text-center flex flex-col gap-3 px-6">
                 <div className="text-indigo-300 font-cormorant italic text-2xl md:text-3xl opacity-40 transition-opacity">"Nettoyer le sol ce soir"</div>
                 <div className="text-indigo-200 font-cormorant italic text-3xl md:text-4xl opacity-75">"Limpiar el piso esta noche"</div>
                 <div className="text-white font-jakarta text-2xl md:text-3xl font-medium mt-2">"আজ রাতে মেঝে পরিষ্কার করুন"</div>
               </div>
            </div>
          </div>

          {/* Feature 4: Food Cost & Menu Engineering */}
          <div className="feature-row bg-slate-50 border border-slate-200/60 rounded-[3rem] p-8 md:p-12 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-1 bg-white border border-slate-200 rounded-[2rem] h-64 md:h-full min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden p-6 md:p-8">
               {/* Matrix Background */}
                <div className="absolute inset-5 grid grid-cols-2 grid-rows-2 gap-1 opacity-70">
                  <div className="bg-green-50 rounded-tl-2xl border border-green-100 flex items-center justify-center text-green-700/50 text-xs font-bold font-jakarta">{t('bcg_stars')}</div>
                  <div className="bg-amber-50 rounded-tr-2xl border border-amber-100 flex items-center justify-center text-amber-700/50 text-xs font-bold font-jakarta">{t('bcg_cashcows')}</div>
                  <div className="bg-red-50 rounded-bl-2xl border border-red-100 flex items-center justify-center text-red-700/50 text-xs font-bold font-jakarta">{t('bcg_deadweights')}</div>
                  <div className="bg-blue-50 rounded-br-2xl border border-blue-100 flex items-center justify-center text-blue-700/50 text-xs font-bold font-jakarta">{t('bcg_puzzles')}</div>
                </div>
               
               {/* POS Data lines flowing in */}
               <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-4 w-full justify-center z-10">
                 <div className="font-plex-mono text-[10px] text-slate-500 bg-white px-3 py-1.5 rounded-full shadow-sm animate-bounce">{t('pos_sync_text')}</div>
               </div>

               {/* Animated dots moving into quadrants */}
               <div className="absolute w-4 h-4 bg-[#CC5833] rounded-full shadow-[0_0_15px_#CC5833] animate-pulse top-[30%] left-[70%] z-10 transition-transform duration-1000"></div>
               <div className="absolute w-4 h-4 bg-[#2e4036] rounded-full shadow-[0_0_15px_#2e4036] animate-pulse bottom-[30%] right-[70%] z-10 transition-transform duration-1000 delay-500"></div>
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
                <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center"><ScanLine className="w-8 h-8 text-blue-600" /></div>
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
            <div className="order-1 md:order-2 bg-slate-50 rounded-[2rem] h-64 md:h-full min-h-[300px] border border-slate-100 flex items-center justify-center relative overflow-hidden p-6 hover:bg-slate-100 transition-colors duration-500">
               <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-green-400 opacity-50 shadow-[0_0_5px_#4ade80]">
                  <div className="w-full h-16 bg-gradient-to-b from-transparent via-green-400 to-transparent animate-scroll-y"></div>
               </div>
               <div className="relative z-10 w-full max-w-[260px] flex flex-col gap-4">
                 {/* Extracted line item */}
                 <div className="bg-white border border-slate-200 text-xs p-4 rounded-xl shadow-sm flex flex-col gap-2 transition-all duration-500 transform hover:-translate-y-1">
                    <span className="font-plex-mono text-slate-400 text-[10px]">SCAN-REQ-4829</span>
                    <div className="flex justify-between font-bold font-jakarta text-[#1A1A1A] text-sm">
                      <span>{t('ocr_product')}</span>
                      <span>{t('ocr_price')}</span>
                    </div>
                    <span className="text-[10px] text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded w-fit font-medium">{t('ocr_alert')}</span>
                 </div>
                 
                 {/* Success Update Indicator */}
                 <div className="bg-green-500 text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-between shadow-lg opacity-90 animate-pulse mt-2">
                    <span>{t('ocr_status')}</span>
                    <span className="font-plex-mono text-[10px]">28% → 29.5%</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Feature 6: Social Media Marketing */}
          <div className="feature-row bg-[#2E4036] text-[#F2F0E9] rounded-[3rem] p-8 md:p-12 shadow-md grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-1 bg-[#1f2d25] border border-[#3e5548] rounded-[2rem] h-64 md:h-full min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden p-6 text-center">
               <div className="text-3xl mb-4">📸</div>
               <div className="font-outfit text-sm text-green-100/70 max-w-xs leading-relaxed">
                 {t('f6_mock_caption')}
               </div>
            </div>
            <div className="order-2">
              <div className="flex flex-col gap-6">
                <div className="bg-green-400/10 w-16 h-16 rounded-2xl flex items-center justify-center"><Activity className="w-8 h-8 text-green-400" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl flex items-center gap-3">
                  {t('f6_title')}
                  <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full font-bold tracking-widest uppercase align-middle">{t('beta_badge')}</span>
                </h3>
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


          {/* Feature 7: Reservations */}
          <div className="feature-row bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="flex flex-col gap-6">
                <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center"><CalendarCheck className="w-8 h-8 text-indigo-600" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#1A1A1A]">{t('f7_title')}</h3>
                <p className="font-outfit text-lg text-slate-600 leading-relaxed">{t('f7_desc')}</p>
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/60 mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-indigo-300 mb-4">Exemples d&apos;utilisation</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-700">
                    <li className="flex gap-3"><span className="text-indigo-500">✦</span> {t('f7_ex1')}</li>
                    <li className="flex gap-3"><span className="text-indigo-500">✦</span> {t('f7_ex2')}</li>
                    <li className="flex gap-3"><span className="text-indigo-500">✦</span> {t('f7_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 bg-slate-900 rounded-[2rem] h-64 md:h-full min-h-[300px] flex items-center justify-center relative overflow-hidden p-6">
              <div className="w-full max-w-[300px] flex flex-col gap-3">
                <div className="flex gap-2 mb-1">
                  <span className="font-plex-mono text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-full">LIBRO ●</span>
                  <span className="font-plex-mono text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-full">RESY ●</span>
                  <span className="font-plex-mono text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-full">ZENCHEF ●</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
                  <div><p className="font-jakarta font-bold text-white text-xs">Martin, L.</p><p className="font-outfit text-slate-400 text-[10px]">19:30 · 4 pers.</p></div>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">{t('res_confirmed')}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center">
                  <div><p className="font-jakarta font-bold text-white text-xs">Dubois, A.</p><p className="font-outfit text-slate-400 text-[10px]">20:00 · 2 pers.</p></div>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">{t('res_confirmed')}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center opacity-50">
                  <div><p className="font-jakarta font-bold text-white text-xs">Bernard, S.</p><p className="font-outfit text-slate-400 text-[10px]">21:00 · 6 pers.</p></div>
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">{t('res_cancelled')}</span>
                </div>
                <div className="mt-1 flex justify-between items-center">
                  <span className="font-plex-mono text-[9px] text-slate-500">LAST SYNC: 2 min ago</span>
                  <span className="font-plex-mono text-[9px] text-indigo-400 animate-pulse">● LIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 8: Smart Prep Lists */}
          <div className="feature-row bg-[#1A1A1A] text-[#F2F0E9] rounded-[3rem] p-8 md:p-12 shadow-md grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-1 bg-[#141414] border border-amber-900/20 rounded-[2rem] h-64 md:h-full min-h-[300px] flex items-center justify-center relative overflow-hidden p-6">
              <div className="w-full max-w-[290px] flex flex-col gap-2">
                <div className="font-plex-mono text-[10px] text-amber-400/70 mb-3 flex justify-between">
                  <span>{t('prep_header')}</span>
                  <span className="text-amber-300 animate-pulse">Auto</span>
                </div>
                <div className="bg-white/5 border border-amber-900/20 rounded-lg p-2.5 flex justify-between items-center">
                  <span className="font-outfit text-white/80 text-xs">{t('prep_item_beef')}</span>
                  <div className="flex items-center gap-2"><span className="font-plex-mono text-amber-300 text-xs font-bold">4.8 KG</span><span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-orange-500/20 text-orange-300">POS</span></div>
                </div>
                <div className="bg-white/5 border border-amber-900/20 rounded-lg p-2.5 flex justify-between items-center">
                  <span className="font-outfit text-white/80 text-xs">{t('prep_item_salmon')}</span>
                  <div className="flex items-center gap-2"><span className="font-plex-mono text-amber-300 text-xs font-bold">3.2 KG</span><span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-300">RÉSA</span></div>
                </div>
                <div className="bg-white/5 border border-amber-900/20 rounded-lg p-2.5 flex justify-between items-center">
                  <span className="font-outfit text-white/80 text-xs">{t('prep_item_potato')}</span>
                  <div className="flex items-center gap-2"><span className="font-plex-mono text-amber-300 text-xs font-bold">12 KG</span><span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-green-500/20 text-green-300">RECETTE</span></div>
                </div>
                <div className="bg-white/5 border border-amber-900/20 rounded-lg p-2.5 flex justify-between items-center">
                  <span className="font-outfit text-white/80 text-xs">{t('prep_item_cream')}</span>
                  <div className="flex items-center gap-2"><span className="font-plex-mono text-amber-300 text-xs font-bold">1.5 L</span><span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-orange-500/20 text-orange-300">POS</span></div>
                </div>
                <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex justify-between">
                  <span className="font-outfit text-amber-200 text-xs font-bold">{t('prep_cost_label')}</span>
                  <span className="font-plex-mono text-amber-300 text-xs font-bold">342.50 $</span>
                </div>
              </div>
            </div>
            <div className="order-2">
              <div className="flex flex-col gap-6">
                <div className="bg-amber-500/10 w-16 h-16 rounded-2xl flex items-center justify-center"><ChefHat className="w-8 h-8 text-amber-400" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl">{t('f8_title')}</h3>
                <p className="font-outfit text-lg opacity-80 leading-relaxed">{t('f8_desc')}</p>
                <div className="bg-[#232323] p-6 rounded-2xl mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-amber-500/40 mb-4">Exemples d&apos;utilisation</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-300">
                    <li className="flex gap-3"><span className="text-amber-400">✦</span> {t('f8_ex1')}</li>
                    <li className="flex gap-3"><span className="text-amber-400">✦</span> {t('f8_ex2')}</li>
                    <li className="flex gap-3"><span className="text-amber-400">✦</span> {t('f8_ex3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 9: Liquid Intelligence (Bar & Brewery) */}
          <div className="feature-row bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="flex flex-col gap-6">
                <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center"><Beer className="w-8 h-8 text-emerald-600" /></div>
                <h3 className="font-jakarta font-bold text-3xl md:text-4xl text-[#1A1A1A]">{t('f9_title')}</h3>
                <p className="font-outfit text-lg text-slate-600 leading-relaxed">{t('f9_desc')}</p>
                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-50 mt-4">
                  <h4 className="font-jakarta font-bold text-xs uppercase tracking-wider text-emerald-400 mb-4">Exemples d&apos;utilisation</h4>
                  <ul className="flex flex-col gap-4 font-outfit text-sm text-slate-700">
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
                  <div className="bg-[#2E4036] border border-[#3e5548] p-4 rounded-2xl flex items-center gap-4 hover:translate-x-2 transition-transform shadow-lg cursor-default">
                    <div className="bg-white/10 p-2 rounded-xl shrink-0"><Recycle className="w-5 h-5 text-[#F2F0E9]" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-plex-mono text-[10px] text-white/50 tracking-widest uppercase mb-1">Keg Deposits</p>
                      <div className="flex justify-between items-end">
                        <p className="font-jakarta font-bold text-white text-base truncate">24x 30L Kegs</p>
                        <p className="font-outfit font-bold text-[#CC5833] text-sm tabular-nums">+$720.00</p>
                      </div>
                    </div>
                  </div>

                  {/* Variance Card */}
                  <div className="bg-[#1A1A1A] border border-white/10 p-4 rounded-2xl flex items-center gap-4 hover:translate-x-2 transition-transform shadow-lg cursor-default delay-100">
                    <div className="bg-red-500/10 p-2 rounded-xl shrink-0"><Droplets className="w-5 h-5 text-red-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-plex-mono text-[10px] text-red-400/70 tracking-widest uppercase mb-1">Pour Variance</p>
                      <div className="flex justify-between items-end">
                        <p className="font-jakarta font-bold text-white text-base truncate">Draft IPA</p>
                        <p className="font-outfit font-bold text-red-400 text-sm tabular-nums">-1.2L</p>
                      </div>
                    </div>
                  </div>

                  {/* Brewery Production Card */}
                  <div className="bg-[#1f2d25] border border-[#3e5548] p-4 rounded-2xl flex items-center gap-4 hover:translate-x-2 transition-transform shadow-lg cursor-default delay-200">
                    <div className="bg-amber-500/10 p-2 rounded-xl shrink-0"><Beer className="w-5 h-5 text-amber-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-plex-mono text-[10px] text-amber-500/70 tracking-widest uppercase mb-1">Batch #042</p>
                      <div className="flex justify-between items-end">
                        <p className="font-jakarta font-bold text-white text-base truncate">Pale Ale</p>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase border border-indigo-500/20">Kegging</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* D. PHILOSOPHY — "The Manifesto" */}
      <section id="philosophy" className="relative py-0 bg-[#1A1A1A] text-[#F2F0E9] overflow-hidden">
        {/* Parallax Organic Texture */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.07]"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542841791-d3fa1b439f03?q=80&w=2000&auto=format&fit=crop')" }}
        ></div>

        {/* Top Manifesto — Contrast Statements */}
        <div className="relative z-10 max-w-6xl mx-auto px-8 md:px-24 py-32 md:py-48">
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
          <div className="max-w-6xl mx-auto px-8 md:px-24 py-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0">
              
              {/* Pillar 1 */}
              <div className="group relative py-10 md:py-12 md:px-10 md:border-r border-white/[0.06] border-b md:border-b-0 transition-colors duration-500 hover:bg-white/[0.02]">
                <span className="font-plex-mono text-[#CC5833] text-xs font-bold tracking-widest block mb-6">01</span>
                <h3 className="font-jakarta font-bold text-xl md:text-2xl mb-4 group-hover:translate-x-1 transition-transform duration-500">{t('philosophy_pillar1_title')}</h3>
                <p className="font-outfit text-[#6B7280] text-base leading-relaxed">{t('philosophy_pillar1_desc')}</p>
              </div>
              
              {/* Pillar 2 */}
              <div className="group relative py-10 md:py-12 md:px-10 md:border-r border-white/[0.06] border-b md:border-b-0 transition-colors duration-500 hover:bg-white/[0.02]">
                <span className="font-plex-mono text-[#CC5833] text-xs font-bold tracking-widest block mb-6">02</span>
                <h3 className="font-jakarta font-bold text-xl md:text-2xl mb-4 group-hover:translate-x-1 transition-transform duration-500">{t('philosophy_pillar2_title')}</h3>
                <p className="font-outfit text-[#6B7280] text-base leading-relaxed">{t('philosophy_pillar2_desc')}</p>
              </div>
              
              {/* Pillar 3 */}
              <div className="group relative py-10 md:py-12 md:px-10 transition-colors duration-500 hover:bg-white/[0.02]">
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
        <div className="text-center mb-24">
          <h2 className="font-jakarta font-bold text-4xl text-[#1A1A1A] mb-4">{t('protocol_title')}</h2>
          <p className="font-outfit text-slate-500">{t('protocol_desc')}</p>
        </div>

        <div className="protocol-container relative">
          {/* Card 1 */}
          <div className="stack-card bg-[#2E4036] text-[#F2F0E9] p-12 md:p-16 rounded-[3rem] shadow-xl mb-8 flex flex-col md:flex-row items-center gap-12 min-h-[50vh]">
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
          <div className="stack-card bg-[#CC5833] text-[#F2F0E9] p-12 md:p-16 rounded-[3rem] shadow-xl mb-8 flex flex-col md:flex-row items-center gap-12 min-h-[50vh]">
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
          <div className="stack-card bg-[#1A1A1A] text-[#F2F0E9] p-12 md:p-16 rounded-[3rem] shadow-xl mb-8 flex flex-col md:flex-row items-center gap-12 min-h-[50vh]">
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
            <a href="mailto:dock@rivehub.com" className="font-outfit text-sm text-[#CC5833] mt-3 inline-block hover:text-[#F2F0E9] transition-colors tracking-wide">
              dock@rivehub.com
            </a>
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
