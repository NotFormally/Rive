"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, RotateCw, Activity, Calendar } from "lucide-react";

// Register GSAP Plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function LandingPage() {
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
          <Link href="#features" className="hover:-translate-y-[1px] transition-transform">Fonctionnalités</Link>
          <Link href="#philosophy" className="hover:-translate-y-[1px] transition-transform">Philosophie</Link>
          <Link href="/pricing" className="hover:-translate-y-[1px] transition-transform">Tarifs</Link>
        </div>
        <Link 
          href="/signup" 
          className="nav-btn bg-[#F2F0E9] text-[#1A1A1A] px-5 py-2.5 rounded-full text-sm font-semibold hover:scale-[1.03] transition-transform duration-300"
        >
          Créer mon espace Rive
        </Link>
      </nav>

      {/* B. HERO SECTION — "The Opening Shot" */}
      <section className="hero-section relative h-[100dvh] w-full flex items-end pb-24 px-8 md:px-24">
        {/* Background Image with Global CSS Noise */}
        <div 
          className="absolute inset-0 bg-cover bg-center -z-10"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2000&auto=format&fit=crop')" }} /* Match: dark forest / laboratory */
        >
          {/* Heavy primary-to-black gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#2E4036]/60 to-transparent"></div>
        </div>

        <div className="max-w-4xl text-[#F2F0E9]">
          <h1 className="flex flex-col gap-2">
            <span className="hero-text font-jakarta font-bold text-3xl md:text-5xl tracking-tight uppercase text-[#CC5833]">
              L'algorithme est
            </span>
            <span className="hero-text font-cormorant italic text-7xl md:text-9xl tracking-tighter leading-[0.85]">
              le nouveau Chef.
            </span>
          </h1>
          <p className="hero-text font-outfit text-lg md:text-2xl mt-8 max-w-2xl opacity-90 leading-relaxed tracking-wide">
            Intelligence algorithmique pour la restauration gastronomique.
          </p>
          <div className="hero-text mt-12">
            <Link 
              href="/signup" 
              className="group relative overflow-hidden inline-flex items-center justify-center gap-2 bg-[#CC5833] text-[#F2F0E9] px-8 py-4 rounded-[2rem] font-bold text-lg hover:scale-[1.03] transition-transform duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">Déployer Rive <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
              <span className="absolute inset-0 bg-[#1A1A1A] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></span>
            </Link>
          </div>
        </div>
      </section>

      {/* C. FEATURES — "Interactive Functional Artifacts" */}
      <section id="features" className="py-32 px-8 md:px-24 max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Diagnostic Shuffler (Ingénierie de Menu IA) */}
          <div className="bg-[#FFFFFF] p-8 rounded-[2rem] shadow-sm border border-slate-200/60 relative overflow-hidden h-[400px] flex flex-col hover:-translate-y-1 transition-transform duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#2E4036]/10 p-3 rounded-full"><RotateCw className="w-6 h-6 text-[#2E4036]" /></div>
              <h3 className="font-jakarta font-bold text-xl text-[#1A1A1A]">Ingénierie IA</h3>
            </div>
            <p className="font-outfit text-slate-500 mb-8">Classification BCG algorithmique en temps réel.</p>
            
            <div className="relative flex-1 mt-auto flex justify-center items-end pb-8">
              <div className="shuffler-item absolute bg-[#F2F0E9] border border-slate-200 p-4 rounded-2xl w-full max-w-[240px] shadow-sm bottom-8 z-30 flex justify-between items-center">
                <span className="font-outfit font-medium text-sm">Tartare de Bœuf</span>
                <span className="font-plex-mono text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-sm">🏮 Phare</span>
              </div>
              <div className="shuffler-item absolute bg-[#F2F0E9] border border-slate-200 p-4 rounded-2xl w-full max-w-[220px] shadow-sm bottom-12 z-20 opacity-60 scale-95 flex justify-between items-center">
                <span className="font-outfit font-medium text-sm">Salade César</span>
                <span className="font-plex-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-sm">⚓ Ancre</span>
              </div>
              <div className="shuffler-item absolute bg-[#F2F0E9] border border-slate-200 p-4 rounded-2xl w-full max-w-[200px] shadow-sm bottom-16 z-10 opacity-30 scale-90 flex justify-between items-center">
                <span className="font-outfit font-medium text-sm">Risotto Truffe</span>
                <span className="font-plex-mono text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-sm">🧭 Dérive</span>
              </div>
            </div>
          </div>

          {/* Card 2: Telemetry Typewriter (Cahier de Bord Intelligent) */}
          <div className="bg-[#FFFFFF] p-8 rounded-[2rem] shadow-sm border border-slate-200/60 relative overflow-hidden h-[400px] flex flex-col hover:-translate-y-1 transition-transform duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-[#2E4036]/10 p-3 rounded-full"><Activity className="w-6 h-6 text-[#2E4036]" /></div>
                <h3 className="font-jakarta font-bold text-xl text-[#1A1A1A]">Logbook Synapse</h3>
              </div>
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Live Feed
              </div>
            </div>
            <p className="font-outfit text-slate-500 mb-8">Analyse NLP des notes de l'équipe de salle.</p>
            
            <div className="bg-[#1A1A1A] flex-1 rounded-2xl p-6 font-plex-mono text-sm text-[#CC5833] overflow-hidden relative">
              <div className="opacity-50 mb-2">{">"} Analyse de la note serveur...</div>
              <div className="opacity-50 mb-2">{">"} Extraction des mots clés...</div>
              <div className="text-[#F2F0E9] mt-4">
                Urgence détectée : Frigo viandes à 8°C.
                <br />
                <span className="text-green-400">Action prescriptive : Vérifier compresseur.</span>
                <span className="inline-block w-2 h-4 bg-[#CC5833] animate-pulse ml-1 align-middle"></span>
              </div>
            </div>
          </div>

          {/* Card 3: Cursor Protocol Scheduler (Assistants IA Temporels) */}
          <div className="bg-[#FFFFFF] p-8 rounded-[2rem] shadow-sm border border-slate-200/60 relative overflow-hidden h-[400px] flex flex-col hover:-translate-y-1 transition-transform duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#2E4036]/10 p-3 rounded-full"><Calendar className="w-6 h-6 text-[#2E4036]" /></div>
              <h3 className="font-jakarta font-bold text-xl text-[#1A1A1A]">Assistants Autonomes</h3>
            </div>
            <p className="font-outfit text-slate-500 mb-8">Génération sociale et rappels automatisés.</p>
            
            <div className="flex-1 border-t border-slate-100 pt-6">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-plex-mono text-slate-400 mb-2">
                <div>L</div><div>M</div><div>M</div><div>J</div><div className="text-[#CC5833] font-bold">V</div><div>S</div><div>D</div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({length: 21}).map((_, i) => (
                  <div key={i} className={`aspect-square rounded-md ${i === 11 ? 'bg-[#CC5833] animate-pulse' : 'bg-slate-100'}`}></div>
                ))}
              </div>
              <div className="mt-6 flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-outfit text-sm font-medium">Post Instagram (Phare)</span>
                <span className="font-plex-mono text-xs text-[#2E4036]">17:30</span>
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
            La plupart des logiciels de gestion offrent : des tableaux de bord statiques et des données mortes.
          </p>
          <p className="philosophy-text font-cormorant italic text-4xl md:text-7xl font-semibold leading-tight">
            Nous offrons : un flux de travail <span className="text-[#CC5833]">vivant</span>, qui prescrit l'action avant le problème.
          </p>

          {/* Three Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
            <div className="text-left border-t border-[#CC5833]/30 pt-8">
              <h3 className="font-jakarta font-bold text-2xl mb-3">Proactif</h3>
              <p className="font-outfit text-[#6B7280] text-lg">Agit avant le problème. Chaque donnée déclenche une action, pas un rapport.</p>
            </div>
            <div className="text-left border-t border-[#CC5833]/30 pt-8">
              <h3 className="font-jakarta font-bold text-2xl mb-3">Anticipatif</h3>
              <p className="font-outfit text-[#6B7280] text-lg">Voit venir. L'algorithme détecte les signaux faibles avant qu'ils ne deviennent des urgences.</p>
            </div>
            <div className="text-left border-t border-[#CC5833]/30 pt-8">
              <h3 className="font-jakarta font-bold text-2xl mb-3">Préventif</h3>
              <p className="font-outfit text-[#6B7280] text-lg">Empêche plutôt que corriger. La conformité devient un réflexe, pas une corvée.</p>
            </div>
          </div>
        </div>
      </section>

      {/* E. PROTOCOL — "Sticky Stacking Archive" */}
      <section id="protocol" className="py-24 px-8 md:px-24 max-w-screen-xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="font-jakarta font-bold text-4xl text-[#1A1A1A] mb-4">Protocole d'Intégration</h2>
          <p className="font-outfit text-slate-500">De l'inscription au pilotage automatisé.</p>
        </div>

        <div className="protocol-container relative">
          {/* Card 1 */}
          <div className="stack-card sticky top-32 bg-[#2E4036] text-[#F2F0E9] p-12 md:p-16 rounded-[3rem] shadow-xl mb-8 flex flex-col md:flex-row items-center gap-12 min-h-[50vh]">
            <div className="flex-1">
              <div className="font-plex-mono text-[#CC5833] font-bold text-sm mb-4">PHASE 01</div>
              <h3 className="font-jakarta font-bold text-4xl mb-6">Connexion des Télémétries</h3>
              <p className="font-outfit text-lg opacity-80 mb-8 max-w-md">Importation de votre carte existante et configuration de vos alertes Food Cost.</p>
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
              <h3 className="font-jakarta font-bold text-4xl mb-6">Matrice Analytique</h3>
              <p className="font-outfit text-lg opacity-90 mb-8 max-w-md">L'Intelligence Artificielle classifie chaque plat (Phare, Ancre, Dérive, Écueil) et suggère des actions correctives.</p>
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
              <h3 className="font-jakarta font-bold text-4xl mb-6">Pilotage Autonome</h3>
              <p className="font-outfit text-lg opacity-80 mb-8 max-w-md">Génération des posts réseaux sociaux et résumés des carnets de bord en multilingue.</p>
              <Link href="/signup" className="inline-block bg-[#F2F0E9] text-[#1A1A1A] px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform">
                Lancer Rive
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
            <p className="font-outfit text-slate-400 max-w-xs">Intelligence algorithmique pour la restauration gastronomique.</p>
          </div>
          <div className="flex items-center gap-3 bg-[#2E4036]/30 border border-[#2E4036] px-4 py-2 rounded-full">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span className="font-plex-mono text-sm uppercase tracking-wider text-green-400">System Operational</span>
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto mt-24 pt-8 border-t border-slate-800 text-slate-500 text-sm font-outfit flex justify-between">
          <p>© 2026 Rive. Tous droits réservés.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#F2F0E9] transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-[#F2F0E9] transition-colors">CGU</a>
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
