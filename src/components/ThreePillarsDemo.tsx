"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { SUPPORTED_LANGUAGE_COUNT } from '@/lib/languages';

/**
 * The `ThreePillarsDemo` component showcases the core value propositions of RiveHub
 * tailored dynamically to different user personas (Owner, Chef, Compliance).
 * 
 * It manages state for the selected persona and conditionally renders 
 * different benefits, descriptions, and call-to-actions based on the selection.
 * Fully internationalized using `next-intl`.
 * 
 * @returns {JSX.Element} Interactive tabbed hero or section component block.
 */
export function ThreePillarsDemo() {
  const t = useTranslations('ThreePillarsDemo');
  const [selectedPersona, setSelectedPersona] = useState<string>('owner');
  const [showIntelligenceScore, setShowIntelligenceScore] = useState(false);

  const personas: Record<string, any> = {
    owner: {
      icon: '💰',
      name: t('owner_name'),
      title: t('owner_title'),
      subtitle: t('owner_subtitle'),
      problem: t('owner_prob'),
      solution: t('owner_sol'),
      benefits: [
        `💡 ${t('owner_b1')}`,
        `📊 ${t('owner_b2')}`,
        `⚠️ ${t('owner_b3')}`,
        `💵 ${t('owner_b4')}`
      ],
      demo: t('owner_demo'),
      color: '#CC5833',
      bgColor: '#CC5833',
      ctaText: t('owner_cta'),
      video: t('owner_vid'),
      tip: t('owner_tip')
    },
    chef: {
      icon: '👨‍🍳',
      name: t('chef_name'),
      title: t('chef_title'),
      subtitle: t('chef_subtitle'),
      problem: t('chef_prob'),
      solution: t('chef_sol'),
      benefits: [
        `🌍 ${t('chef_b1', { count: SUPPORTED_LANGUAGE_COUNT })}`,
        `📋 ${t('chef_b2')}`,
        `👥 ${t('chef_b3')}`,
        `✅ ${t('chef_b4')}`
      ],
      demo: t('chef_demo'),
      color: '#2E4036',
      bgColor: '#2E4036',
      ctaText: t('chef_cta'),
      video: t('chef_vid'),
      tip: t('chef_tip')
    },
    compliance: {
      icon: '📋',
      name: t('comp_name'),
      title: t('comp_title'),
      subtitle: t('comp_subtitle'),
      problem: t('comp_prob'),
      solution: t('comp_sol'),
      benefits: [
        `✅ ${t('comp_b1')}`,
        `📦 ${t('comp_b2')}`,
        `👥 ${t('comp_b3')}`,
        `🎯 ${t('comp_b4')}`
      ],
      demo: t('comp_demo'),
      color: '#22d3ee', // Cyan for compliance instead of green to fit dark mode better
      bgColor: '#22d3ee',
      ctaText: t('comp_cta'),
      video: t('comp_vid'),
      tip: t('comp_tip')
    }
  };

  const current = personas[selectedPersona];

  const intelligenceScore = [
    { stage: '40%', label: t('is1_label'), desc: t('is1_desc'), progress: 40 },
    { stage: '65%', label: t('is2_label'), desc: t('is2_desc'), progress: 65 },
    { stage: '95%', label: t('is3_label'), desc: t('is3_desc'), progress: 95 },
    { stage: '100%', label: t('is4_label'), desc: t('is4_desc'), progress: 100 }
  ];

  return (
    <div className="bg-[#0B131E] rounded-[3rem] border border-white/5 overflow-hidden my-32">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#121A26] to-[#1A2332] text-white py-12 px-6 border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <span className="text-4xl md:text-5xl bg-white/5 p-3 rounded-full w-fit">🚢</span>
            <h2 className="text-3xl md:text-4xl font-black font-jakarta">{t('title_prefix')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{t('title_highlight')}</span></h2>
          </div>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl font-outfit mt-4 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* PERSONA SELECTOR */}
      <div className="bg-[#0B131E] border-b border-white/5 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <p className="text-xs text-slate-400 font-bold mb-4 uppercase tracking-widest font-plex-mono">{t('persona_select')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.keys(personas).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedPersona(key)}
                className={`p-6 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group ${
                  selectedPersona === key
                    ? "border-transparent shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform -translate-y-1"
                    : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: selectedPersona === key ? '#1A2332' : undefined,
                  borderColor: selectedPersona === key ? personas[key].color : undefined,
                }}
              >
                {/* Active glow */}
                {selectedPersona === key && (
                  <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen" style={{ backgroundColor: personas[key].color }}></div>
                )}
                {selectedPersona === key && (
                  <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: personas[key].color }}></div>
                )}
                
                <div className="text-3xl mb-4 bg-white/5 w-14 h-14 flex items-center justify-center rounded-xl">{personas[key].icon}</div>
                <h3 className="font-bold text-white mb-1 font-jakarta text-lg group-hover:text-cyan-400 transition-colors">{personas[key].name}</h3>
                <p className="text-sm text-slate-400 font-outfit">{personas[key].title}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        
        {/* PERSONA DETAIL */}
        <div className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <div className="text-6xl mb-6 bg-white/5 w-20 h-20 flex items-center justify-center rounded-2xl border border-white/5 shadow-lg shadow-black/50">{current.icon}</div>
            <h3 className="text-4xl font-black text-white mb-4 font-jakarta drop-shadow-sm">
              {current.title}
            </h3>
            <p className="text-xl text-cyan-400 mb-8 font-medium font-outfit">{current.subtitle}</p>

            <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
              <p className="text-xs font-bold text-red-400 mb-3 tracking-widest uppercase font-plex-mono flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> {t('lbl_problem')}</p>
              <p className="text-slate-200 font-outfit leading-relaxed">{current.problem}</p>
            </div>

            <div className="mb-10 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
              <p className="text-xs font-bold text-green-400 mb-3 tracking-widest uppercase font-plex-mono flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span> {t('lbl_solution')}</p>
              <p className="text-slate-200 font-outfit leading-relaxed">{current.solution}</p>
            </div>

            <div className="space-y-4 mb-10">
              {current.benefits.map((benefit: string, idx: number) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-[#1A2332] rounded-xl border border-white/5 shadow-md">
                  <span className="text-xl flex-shrink-0 mt-0.5">{benefit.split(' ')[0]}</span>
                  <span className="text-slate-300 font-outfit">{benefit.substring(benefit.indexOf(' ') + 1)}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={selectedPersona === 'compliance' ? '/demo/haccp' : '/signup'}
                className="px-6 py-4 rounded-xl font-bold text-white transition-transform hover:-translate-y-1 shadow-[0_10px_20px_rgba(0,0,0,0.4)] relative overflow-hidden font-jakarta inline-block text-center"
                style={{backgroundColor: current.color}}
              >
                <span className="relative z-10">{current.ctaText}</span>
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full hover:animate-[shimmer_1s_forwards]"></div>
              </Link>
            </div>
          </div>

          {/* DEMO VISUAL */}
          <div className="relative order-1 lg:order-2 h-[400px] lg:h-[600px]">
            <div 
              className="h-full rounded-[2.5rem] p-8 text-white flex flex-col items-center justify-center relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 transition-colors duration-500"
              style={{backgroundColor: current.color === '#22d3ee' ? '#083344' : current.color === '#CC5833' ? '#431407' : '#064e3b'}}
            >
              {/* Animated background rings */}
              <div className="absolute inset-0 opacity-20 flex items-center justify-center mix-blend-screen pointer-events-none">
                <div className="w-[120%] h-[120%] rounded-full border border-white/30 absolute animate-[spin_60s_linear_infinite]"></div>
                <div className="w-[80%] h-[80%] rounded-full border border-white/20 absolute animate-[spin_40s_linear_infinite_reverse]"></div>
                <div className="w-[40%] h-[40%] rounded-full border-2 border-white/40 absolute"></div>
              </div>

              <div className="absolute top-0 w-full h-full bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>

              <div className="relative z-10 text-center flex flex-col items-center max-w-sm">
                <div className="text-6xl mb-8 bg-black/40 backdrop-blur-md w-24 h-24 flex items-center justify-center rounded-full border border-white/20 shadow-2xl">
                  {selectedPersona === 'owner' && '💵'}
                  {selectedPersona === 'chef' && '🍳'}
                  {selectedPersona === 'compliance' && '✓'}
                </div>
                <p className="text-3xl font-black mb-6 font-jakarta leading-tight">{current.demo}</p>
                <div className="h-1 w-12 bg-white/30 rounded-full mb-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-white animate-[pulse_2s_infinite]"></div>
                </div>
                <p className="text-white/80 text-base font-outfit font-medium">
                  {current.tip}
                </p>
              </div>
            </div>

            {/* Floating accent elements */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none transition-colors duration-500"
                 style={{backgroundColor: current.color}} />
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none transition-colors duration-500"
                 style={{backgroundColor: current.color}} />
          </div>
        </div>

        {/* UNIFIED ADVANTAGE */}
        <div className="bg-gradient-to-br from-[#121A26] to-[#0B131E] border border-cyan-500/20 shadow-[0_20px_60px_rgba(34,211,238,0.1)] rounded-3xl p-8 md:p-12 mb-16 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-cyan-400 to-blue-600"></div>
          <h3 className="text-3xl font-black mb-10 text-white font-jakarta">{t('adv_title')}<span className="text-cyan-400">{t('adv_title_highlight')}</span>{t('adv_title_suffix')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mb-8">
            <div className="bg-red-500/5 p-8 rounded-2xl border border-red-500/10">
              <p className="font-bold mb-6 text-xl text-red-400 flex items-center gap-3 font-jakarta"><span className="bg-red-500/20 p-1.5 rounded-lg text-red-500">❌</span> {t('adv_bad_title')}</p>
              <ul className="space-y-4 text-slate-300 font-outfit">
                <li className="flex gap-3"><span className="text-slate-500 mt-1">•</span> {t('adv_bad_1')} <br/><span className="text-sm text-slate-500">{t('adv_bad_1_sub')}</span></li>
                <li className="flex gap-3"><span className="text-slate-500 mt-1">•</span> {t('adv_bad_2')} <br/><span className="text-sm text-slate-500">{t('adv_bad_2_sub')}</span></li>
                <li className="flex gap-3"><span className="text-slate-500 mt-1">•</span> {t('adv_bad_3')} <br/><span className="text-sm text-slate-500">{t('adv_bad_3_sub')}</span></li>
                <li className="flex gap-3 mt-6 pt-6 border-t border-white/5 font-medium text-red-300"><span className="text-red-500 mt-1">↳</span> {t('adv_bad_end')}</li>
              </ul>
            </div>
            <div className="bg-cyan-500/5 p-8 rounded-2xl border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.05)] relative">
              <div className="absolute -top-4 -right-4 bg-cyan-500 text-[#0B131E] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">{t('adv_good_badge')}</div>
              <p className="font-bold mb-6 text-xl text-cyan-400 flex items-center gap-3 font-jakarta"><span className="bg-cyan-500/20 p-1.5 rounded-lg text-cyan-400">✅</span> {t('adv_good_title')}</p>
              <ul className="space-y-4 text-slate-200 font-outfit">
                <li className="flex gap-3"><span className="text-cyan-500 mt-1">✦</span> {t('adv_good_1')}</li>
                <li className="flex gap-3"><span className="text-cyan-500 mt-1">✦</span> {t('adv_good_2')}</li>
                <li className="flex gap-3"><span className="text-cyan-500 mt-1">✦</span> {t('adv_good_3')}</li>
                <li className="flex gap-3 mt-6 pt-6 border-t border-white/10 font-medium text-cyan-300"><span className="text-cyan-500 mt-1">↳</span> {t('adv_good_end')}</li>
              </ul>
            </div>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl flex items-start sm:items-center gap-4 border border-white/10">
            <span className="text-3xl shrink-0">🎯</span>
            <p className="text-slate-300 font-medium text-lg font-outfit leading-relaxed">
              {t('adv_manifesto_start')}<span className="text-white font-bold">{t('adv_manifesto_bold')}</span>{t('adv_manifesto_end')}
            </p>
          </div>
        </div>

        {/* NEXT STEPS */}
        <div className="text-center md:pb-8">
          <h3 className="text-3xl md:text-4xl font-black text-white mb-6 font-jakarta">{t('cta_title')}</h3>
          <p className="text-slate-400 mb-10 max-w-2xl mx-auto font-outfit text-lg">
            {t('cta_desc')}
          </p>
          <Link href="/signup" className="inline-block px-8 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-xl hover:scale-105 transition-transform shadow-[0_15px_30px_rgba(34,211,238,0.3)] font-jakarta text-lg">
            {t('cta_btn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
