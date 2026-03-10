"use client";

import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

// Dynamically import the p5 sketch, completely disabling SSR
const VesselSketch = dynamic(() => import("./VesselIntelligenceSketch"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a1428] text-indigo-400 font-plex-mono text-sm tracking-widest uppercase">
      Initializing Sonar...
    </div>
  ),
});

const LEVELS = [
  'Passive Navigator',
  'Data Cartographer',
  'Predictive Engine',
  'Expert Navigator'
];

export function VesselIntelligence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  
  // Ref for the p5 sketch to read synchronously without causing React re-renders
  const intelligenceRef = useRef(40);
  
  // State for the UI overlay to display
  const [displayValue, setDisplayValue] = useState(40);
  const [displayLabel, setDisplayLabel] = useState(LEVELS[0]);

  useEffect(() => {
    if (!triggerRef.current || !containerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: triggerRef.current,
        start: "top top",
        end: "+=200%", // Pin for 2 viewport heights
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          // Map progress (0 to 1) to Intelligence (40 to 100)
          const newIntel = 40 + (self.progress * 60);
          
          // Update the ref for p5 (60fps synchronous read, no React render lag)
          intelligenceRef.current = newIntel;
          
          // Update simple state for the UI overlay
          const floored = Math.floor(newIntel);
          setDisplayValue(floored);
          
          const levelIndex = Math.min(3, Math.floor((newIntel - 40) / 15));
          setDisplayLabel(LEVELS[levelIndex]);
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative w-full bg-[#0a1428]">
      <div ref={triggerRef} className="relative w-full h-screen overflow-hidden">
        
        {/* The p5 Canvas Canvas Area */}
        <div className="absolute inset-0 z-0">
          <VesselSketch intelligenceRef={intelligenceRef} />
        </div>

        {/* The UI Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8 md:p-16 lg:p-24">
          
          {/* Top Header */}
          <div className="w-full max-w-7xl mx-auto flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <span className="font-plex-mono text-cyan-500 font-bold uppercase tracking-widest text-xs">
                Data Depth Simulation
              </span>
              <h2 className="font-cormorant italic text-4xl md:text-5xl lg:text-7xl text-white tracking-tighter drop-shadow-xl">
                Vessel Intelligence
              </h2>
              <p className="font-outfit text-indigo-100/70 max-w-sm mt-4 text-sm md:text-base leading-relaxed hidden sm:block">
                Scroll to see how RiveHub organizes the chaos of restaurant data into clear, actionable intelligence.
              </p>
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-end gap-6 pb-12 sm:pb-0">
            <div className="bg-[#0B131E]/80 backdrop-blur-md p-6 rounded-2xl border-l-4 border-cyan-500 shadow-2xl min-w-[280px]">
              <div className="text-cyan-500/80 font-plex-mono text-[10px] font-bold tracking-widest uppercase mb-1">
                Current State
              </div>
              <div className="font-outfit font-bold text-white text-2xl drop-shadow-md">
                {displayValue}% {displayLabel}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              <span className="font-plex-mono text-[10px] text-white/40 tracking-widest uppercase">
                Scroll to Integrate
              </span>
              <div className="w-[1px] h-12 bg-gradient-to-b from-white/40 to-transparent"></div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
