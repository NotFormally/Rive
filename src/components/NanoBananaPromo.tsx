"use client";

import { useTranslations } from 'next-intl';
import { Bot, FileText, ScanLine, Mic, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function NanoBananaPromo() {
  const t = useTranslations('LandingPage');
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Simple stagger animation for the cards
      gsap.from(".nb-card", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "back.out(1.2)",
        scrollTrigger: {
          trigger: container.current,
          start: "top 75%",
        }
      });
    }, container);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={container} className="py-24 px-8 md:px-24 bg-[#0B131E] relative overflow-hidden">
      {/* Nano Banana distinctive background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[600px] bg-[#FACC15]/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-screen-xl mx-auto relative z-10">
        <div className="text-center mb-16 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/20 px-4 py-1.5 rounded-full text-xs font-plex-mono font-bold tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
            <Sparkles className="w-4 h-4" />
             {t('nano_banana_badge')}
          </div>
          <h2 className="font-cormorant italic text-4xl md:text-6xl font-bold text-[#F2F0E9] mb-4">
            {t('nano_banana_title')}
          </h2>
          <p className="font-outfit text-lg md:text-xl text-slate-300/80 max-w-2xl">
            {t('nano_banana_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: HACCP Builder */}
          <div className="nb-card bg-[#1A2332] border border-[#FACC15]/20 hover:border-[#FACC15]/50 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden">
             <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#FACC15]/10 rounded-full blur-2xl group-hover:bg-[#FACC15]/20 transition-all"></div>
             <div className="bg-[#121A26] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner">
               <FileText className="w-7 h-7 text-[#FACC15]" />
             </div>
             <h3 className="font-jakarta font-bold text-xl text-[#F2F0E9] mb-3">{t('nb_haccp_title')}</h3>
             <p className="font-outfit text-slate-400 text-sm leading-relaxed">
               {t('nb_haccp_desc')}
             </p>
          </div>

          {/* Card 2: Sonar */}
          <div className="nb-card bg-[#1A2332] border border-[#FACC15]/20 hover:border-[#FACC15]/50 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden delay-100">
             <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#FACC15]/10 rounded-full blur-2xl group-hover:bg-[#FACC15]/20 transition-all"></div>
             <div className="bg-[#121A26] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner">
               <Bot className="w-7 h-7 text-[#FACC15]" />
             </div>
             <h3 className="font-jakarta font-bold text-xl text-[#F2F0E9] mb-3">{t('nb_sonar_title')}</h3>
             <p className="font-outfit text-slate-400 text-sm leading-relaxed">
               {t('nb_sonar_desc')}
             </p>
          </div>

          {/* Card 3: One-Click Compliance OCR */}
          <div className="nb-card bg-[#1A2332] border border-[#FACC15]/20 hover:border-[#FACC15]/50 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden delay-200">
             <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#FACC15]/10 rounded-full blur-2xl group-hover:bg-[#FACC15]/20 transition-all"></div>
             <div className="bg-[#121A26] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner">
               <ScanLine className="w-7 h-7 text-[#FACC15]" />
             </div>
             <h3 className="font-jakarta font-bold text-xl text-[#F2F0E9] mb-3">{t('nb_ocr_title')}</h3>
             <p className="font-outfit text-slate-400 text-sm leading-relaxed">
               {t('nb_ocr_desc')}
             </p>
          </div>

          {/* Card 4: Voice AI */}
          <div className="nb-card bg-[#1A2332] border border-[#FACC15]/20 hover:border-[#FACC15]/50 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden delay-300">
             <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#FACC15]/10 rounded-full blur-2xl group-hover:bg-[#FACC15]/20 transition-all"></div>
             <div className="bg-[#121A26] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner">
               <Mic className="w-7 h-7 text-[#FACC15]" />
             </div>
             <h3 className="font-jakarta font-bold text-xl text-[#F2F0E9] mb-3">{t('nb_voice_title')}</h3>
             <p className="font-outfit text-slate-400 text-sm leading-relaxed">
               {t('nb_voice_desc')}
             </p>
          </div>

        </div>
      </div>
    </section>
  );
}
