"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SUPPORTED_LANGUAGE_COUNT } from '@/lib/languages';

/**
 * The `NauticalCommandCenter` component is an interactive, gamified presentation UI
 * that walks users through the core value propositions of RiveHub using a nautical metaphor.
 * 
 * It features a 4-phase journey:
 * 1. The Problem (Stormy seas / Chaos)
 * 2. The Three Pillars (Instruments needed for navigation)
 * 3. Navigate with Data (KPIs and intelligence feeds)
 * 4. Intelligence Score (Gamified readiness score)
 * 
 * Includes complex state-driven transitions, SVG animations, and full internationalization support via `next-intl`.
 * 
 * @returns {JSX.Element} A fully interactive multi-step React component.
 */
export function NauticalCommandCenter() {
  const t = useTranslations('NauticalCommandCenter');
  const [activePhase, setActivePhase] = useState(0);
  const [scrollReveal, setScrollReveal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setScrollReveal(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const phases = [
    {
      title: t('title'),
      subtitle: t('subtitle'),
      icon: "🚢",
      description: t('desc'),
      details: [
        t('d1'),
        t('d2'),
        t('d3'),
        t('d4')
      ]
    },
    {
      title: t('p1_title'),
      subtitle: t('p1_subtitle'),
      icon: "🧭",
      description: t('p1_desc'),
      instruments: [
        { name: t('i1_name'), desc: t('i1_desc'), color: "#CC5833" },
        { name: t('i2_name'), desc: t('i2_desc'), color: "#2E4036" },
        { name: t('i3_name'), desc: t('i3_desc', { count: SUPPORTED_LANGUAGE_COUNT }), color: "#F2F0E9" }
      ]
    },
    {
      title: t('nav_title'),
      subtitle: t('nav_subtitle'),
      icon: "📊",
      description: t('nav_desc'),
      kpis: [
        { label: t('kpi1_label'), value: "$416", save: t('kpi1_save') },
        { label: t('kpi2_label'), value: "0 min", save: t('kpi2_save') },
        { label: t('kpi3_label'), value: "Done", save: t('kpi3_save') }
      ]
    },
    {
      title: t('score_title'),
      subtitle: t('score_subtitle'),
      icon: "📈",
      description: t('score_desc'),
      journey: [
        { stage: "40%", label: t('j1_label'), subtext: t('j1_subtext') },
        { stage: "65%", label: t('j2_label'), subtext: t('j2_subtext') },
        { stage: "95%", label: t('j3_label'), subtext: t('j3_subtext') },
        { stage: "100%", label: t('j4_label'), subtext: t('j4_subtext') }
      ]
    }
  ];

  return (
    <div className="relative min-h-[80vh] bg-gradient-to-b from-[#121A26] via-[#0B131E] to-[#121A26] overflow-hidden font-outfit rounded-[3rem] border border-white/5 my-32">
      {/* Animated background wave effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen">
        <svg className="absolute w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
          <defs>
            <filter id="turbulenceNautical">
              <feTurbulence baseFrequency="0.02" numOctaves="4" result="noise" seed="2" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="40" />
            </filter>
          </defs>
          <path
            d="M0,400 Q300,350 600,400 T1200,400 L1200,800 L0,800 Z"
            fill="#22D3EE"
            filter="url(#turbulenceNautical)"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* Phase Navigator */}
      <div className="relative z-10 sticky top-0 bg-[#0B131E]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-cyan-500 font-bold tracking-widest uppercase font-plex-mono">
            {t('nav_label')}
          </div>
          <div className="flex gap-3">
            {phases.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActivePhase(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx === activePhase ? 'bg-cyan-400 w-8 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 min-h-[500px] flex items-center">
        
        {/* Phase 0: The Problem */}
        {activePhase === 0 && (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center transition-all duration-700 w-full ${scrollReveal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div>
              <div className="text-6xl mb-6 animate-bounce" style={{animationDuration: '3s'}}>🌊</div>
              <h2 className="text-4xl md:text-5xl font-black leading-tight mb-4 text-[#F2F0E9] font-jakarta">
                {phases[0]!.title}
              </h2>
              <p className="text-xl text-cyan-400 mb-8 leading-relaxed font-medium">
                {phases[0]!.subtitle}
              </p>
              <p className="text-lg text-slate-300 mb-8">
                {phases[0]!.description}
              </p>
              <div className="space-y-4">
                {phases[0]!.details!.map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/20 backdrop-blur-sm">
                    <div className="text-red-400 font-bold mt-0.5">✗</div>
                    <span className="text-slate-200">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-96 rounded-3xl overflow-hidden bg-gradient-to-br from-red-500/10 to-transparent border border-white/10 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 animate-pulse opacity-50">
                <svg className="w-full h-full" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="150" cy="150" r="140" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.3" />
                  <path d="M50,150 Q150,50 250,150" stroke="#ef4444" strokeWidth="3" fill="none" opacity="0.5" />
                  <path d="M60,180 L240,120" stroke="#94a3b8" strokeWidth="2" fill="none" opacity="0.3" />
                  <g opacity="0.8">
                    <circle cx="100" cy="100" r="15" fill="#ef4444" className="animate-ping" style={{animationDuration: '2s'}}/>
                    <circle cx="200" cy="180" r="12" fill="#ef4444" className="animate-ping" style={{animationDuration: '3s', animationDelay: '1s'}}/>
                    <circle cx="150" cy="80" r="10" fill="#ef4444" className="animate-ping" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}/>
                  </g>
                  <text x="150" y="160" textAnchor="middle" fontSize="24" fill="#ef4444" className="font-bold">⚠</text>
                </svg>
              </div>
              <div className="relative text-center z-10 text-6xl drop-shadow-2xl">🌪️</div>
            </div>
          </div>
        )}

        {/* Phase 1: Three Pillars */}
        {activePhase === 1 && (
          <div className={`transition-all duration-700 w-full ${scrollReveal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-[#F2F0E9] font-jakarta">
              {phases[1]!.title}
            </h2>
            <p className="text-xl text-cyan-400 mb-12 leading-relaxed font-medium">
              {phases[1]!.subtitle}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {phases[1]!.instruments!.map((instrument, idx) => (
                <div 
                  key={idx}
                  className="relative group cursor-pointer"
                  onMouseEnter={() => setActivePhase(1)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                       style={{background: `linear-gradient(135deg, ${instrument.color}40, transparent)`}}/>
                  
                  <div className="relative bg-[#1A2332] border border-white/10 rounded-3xl p-8 transition-all duration-300 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:-translate-y-2 group-hover:border-white/30 h-full flex flex-col">
                    <div className="text-5xl mb-6">
                      {idx === 0 ? '💰' : idx === 1 ? '📋' : '🌍'}
                    </div>
                    <h3 className="text-2xl font-black mb-3 font-jakarta" style={{color: instrument.color}}>
                      {instrument.name}
                    </h3>
                    <p className="text-slate-300 leading-relaxed font-outfit">{instrument.desc}</p>
                    
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" 
                         style={{background: `linear-gradient(90deg, transparent, ${instrument.color}, transparent)`}}/>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-2xl p-6 text-cyan-100 text-center backdrop-blur-sm">
              <p className="text-lg font-bold font-jakarta flex items-center justify-center gap-3">
                <span className="text-2xl">💡</span> {t('p1_desc')}
              </p>
            </div>
          </div>
        )}

        {/* Phase 2: Navigate with Data */}
        {activePhase === 2 && (
          <div className={`transition-all duration-700 w-full ${scrollReveal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-[#F2F0E9] font-jakarta">
              {phases[2]!.title}
            </h2>
            <p className="text-xl text-cyan-400 mb-12 font-medium">
              {phases[2]!.subtitle}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {phases[2]!.kpis!.map((kpi, idx) => (
                <div key={idx} className="bg-[#1A2332] border border-white/10 rounded-3xl p-8 hover:border-cyan-500/50 transition-colors duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.3)] group">
                  <p className="text-xs text-slate-400 font-bold mb-3 uppercase tracking-widest font-plex-mono group-hover:text-cyan-300 transition-colors">{kpi.label}</p>
                  <div className="text-4xl font-black text-white mb-3 font-cormorant tracking-tight">{kpi.value}</div>
                  <div className="text-sm text-green-400 font-bold bg-green-400/10 px-3 py-1.5 rounded-full inline-block mt-2">{kpi.save}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#0B131E] border border-white/5 rounded-3xl p-8 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
              <h3 className="text-2xl font-bold text-white mb-6 font-jakarta flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> {t('feed_title')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start md:items-center gap-4 p-5 bg-[#1A2332] rounded-2xl border border-white/5 shadow-lg transform transition-transform hover:-translate-y-1">
                  <div className="bg-red-500/20 p-3 rounded-xl"><span className="text-2xl">🌡️</span></div>
                  <div className="flex-1">
                    <p className="font-bold text-white font-jakarta">{t('feed1_title')}</p>
                    <p className="text-sm text-slate-400 mt-1 font-outfit">{t('feed1_desc')}</p>
                  </div>
                  <span className="hidden md:inline-block text-[10px] font-plex-mono text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded">{t('feed1_tag')}</span>
                </div>
                <div className="flex items-start md:items-center gap-4 p-5 bg-[#1A2332] rounded-2xl border border-white/5 shadow-lg transform transition-transform hover:-translate-y-1 delay-100">
                  <div className="bg-amber-500/20 p-3 rounded-xl"><span className="text-2xl">📊</span></div>
                  <div className="flex-1">
                    <p className="font-bold text-white font-jakarta">{t('feed2_title')}</p>
                    <p className="text-sm text-slate-400 mt-1 font-outfit">{t('feed2_desc')}</p>
                  </div>
                  <span className="hidden md:inline-block text-[10px] font-plex-mono text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded">{t('feed2_tag')}</span>
                </div>
                <div className="flex items-start md:items-center gap-4 p-5 bg-[#1A2332] rounded-2xl border border-white/5 shadow-lg transform transition-transform hover:-translate-y-1 delay-200">
                  <div className="bg-blue-500/20 p-3 rounded-xl"><span className="text-2xl">👥</span></div>
                  <div className="flex-1">
                    <p className="font-bold text-white font-jakarta">{t('feed3_title')}</p>
                    <p className="text-sm text-slate-400 mt-1 font-outfit">{t('feed3_desc')}</p>
                  </div>
                  <span className="hidden md:inline-block text-[10px] font-plex-mono text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded">{t('feed3_tag')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Intelligence Score */}
        {activePhase === 3 && (
          <div className={`transition-all duration-700 w-full ${scrollReveal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-[#F2F0E9] font-jakarta">
              {phases[3]!.title}
            </h2>
            <p className="text-xl text-cyan-400 mb-12 font-medium">
              {phases[3]!.subtitle}
            </p>

            <div className="relative mb-16 px-4 md:px-0">
              {/* Progress line */}
              <div className="absolute top-10 md:top-12 left-0 w-full h-1 bg-gradient-to-r from-slate-700 via-cyan-500 to-emerald-500 rounded-full" />
              
              {/* Journey stages */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 md:gap-y-6 md:gap-x-6 relative z-10">
                {phases[3]!.journey!.map((journey, idx) => (
                  <div key={idx} className="text-center group cursor-pointer relative">
                    {/* Stage circle */}
                    <div className="relative mb-6 flex justify-center">
                      <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#121A26] border-4 flex items-center justify-center transition-colors duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${idx <= 1 ? 'border-cyan-500 glow-cyan' : 'border-slate-700 group-hover:border-slate-500'}`}>
                        <span className={`text-2xl md:text-3xl font-black ${idx <= 1 ? 'text-cyan-400' : 'text-slate-500'}`}>{journey.stage}</span>
                      </div>
                    </div>
                    
                    {/* Label */}
                    <h3 className={`text-lg md:text-xl font-black mb-2 transition-colors font-jakarta ${idx <= 1 ? 'text-white' : 'text-slate-400'}`}>
                      {journey.label}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 font-outfit px-2">
                      {journey.subtext}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Intelligence Score Card */}
            <div className="bg-gradient-to-br from-[#1A2332] to-[#0B131E] rounded-3xl p-8 md:p-12 text-white border border-cyan-500/20 shadow-[0_20px_60px_rgba(34,211,238,0.1)] relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-between relative z-10">
                <div className="flex-1 w-full text-center md:text-left">
                  <h3 className="text-2xl md:text-3xl font-black mb-8 font-jakarta">{t('iq_title')}</h3>
                  <div className="mb-6 w-full max-w-md mx-auto md:mx-0">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-sm font-bold text-slate-300 uppercase tracking-wider font-plex-mono">{t('iq_maturity')}</span>
                      <span className="text-4xl font-black text-cyan-400 font-cormorant leading-none">65%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full relative" style={{width: '65%'}}>
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-300 font-medium font-outfit leading-relaxed max-w-xl">
                    {t('iq_desc_1')}<span className="text-cyan-400 font-bold">{t('iq_desc_bold')}</span>{t('iq_desc_2')}
                  </p>
                </div>
                
                <div className="w-full md:w-auto shrink-0 mt-4 md:mt-0">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#22d3ee" strokeWidth="8" strokeDasharray="283" strokeDashoffset="99" className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-xs text-cyan-500 font-bold uppercase tracking-widest mb-1">{t('iq_score')}</span>
                      <span className="text-3xl font-black text-white font-jakarta">650</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 flex justify-between items-center bg-[#0B131E]/40 border-t border-white/5 rounded-b-[3rem]">
        <button
          onClick={() => setActivePhase(Math.max(0, activePhase - 1))}
          disabled={activePhase === 0}
          className="px-6 py-3 bg-white/5 text-white font-bold rounded-xl disabled:opacity-30 hover:bg-white/10 hover:shadow-md transition-all font-outfit"
        >
          {t('btn_prev')}
        </button>
        
        <div className="flex gap-2 hidden md:flex">
          {phases.map((_, idx) => (
             <div key={idx} className={`w-8 h-1 rounded-full ${idx <= activePhase ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
          ))}
        </div>
        
        <button
          onClick={() => setActivePhase(Math.min(phases.length - 1, activePhase + 1))}
          disabled={activePhase === phases.length - 1}
          className="px-8 py-3 bg-cyan-500 text-[#0B131E] font-black rounded-xl disabled:opacity-50 hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all flex items-center gap-2 font-jakarta"
        >
          {activePhase === phases.length - 1 ? t('btn_deploy') : t('btn_next')}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .glow-cyan { box-shadow: 0 0 20px rgba(34, 211, 238, 0.4); }
      `}} />
    </div>
  );
}
