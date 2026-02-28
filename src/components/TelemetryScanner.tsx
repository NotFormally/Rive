"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import gsap from "gsap";

/**
 * RadarLogo — The concentric-circle scanner with crosshairs and "RIVE" text.
 * Standalone SVG, no dependencies on DataMatrix.
 */
export function RadarLogo({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 1.5, ease: "power3.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <svg ref={ref} viewBox="-100 -100 200 250" className={className} aria-label="Rive radar">
      <circle cx="0" cy="0" r="15" fill="none" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="0" cy="0" r="35" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" />
      <circle cx="0" cy="0" r="60" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.3" />
      <circle cx="0" cy="0" r="85" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.15" />
      <line x1="0" y1="-90" x2="0" y2="-25" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
      <circle cx="0" cy="-25" r="3" fill="#FFFFFF" />
      <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
      <line x1="-90" y1="0" x2="90" y2="0" stroke="#FFFFFF" strokeWidth="1" opacity="0.2" />
      <text x="0" y="120" fontFamily="'Space Grotesk', sans-serif" fontSize="24" fontWeight="400" letterSpacing="0.35em" fill="#FFFFFF" textAnchor="middle" opacity="0.8">RIVE</text>
    </svg>
  );
}

/**
 * DataMatrix — The scrambling number grid with HUD overlays and "[ RUNNING PROTOCOL ]".
 * Standalone SVG, no dependencies on RadarLogo.
 */
export function DataMatrix({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dataGridRef = useRef<SVGGElement>(null);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 80);
    return () => clearInterval(interval);
  }, []);

  const gridPoints = useMemo(() => {
    const points = [];
    const STEP = 6;
    for (let y = -90; y <= 90; y += STEP) {
      for (let x = -90; x <= 90; x += STEP) {
        const r = Math.sqrt(x * x + y * y);
        const hitC1 = Math.abs(r - 15) < 3.5;
        const hitC2 = Math.abs(r - 35) < 3.5;
        const hitC3 = Math.abs(r - 60) < 3.5;
        const hitC4 = Math.abs(r - 85) < 3.5;
        const hitVLine = Math.abs(x) < 3.5 && y > -90 && y < -25;
        const hitHLine = Math.abs(y) < 3.5 && x > -90 && x < 90;
        const isHit = hitC1 || hitC2 || hitC3 || hitC4 || hitVLine || hitHLine;
        const isNoise = !isHit && Math.random() > 0.96 && r < 100;
        if (isHit || isNoise) {
          points.push({
            id: `${x}-${y}`,
            x, y, isHit,
            charBase: Math.random() > 0.3 ? "4" : Math.floor(Math.random() * 10).toString(),
            randOffset: Math.floor(Math.random() * 100),
          });
        }
      }
    }
    return points;
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      const dataNodes = dataGridRef.current?.querySelectorAll("text.data-node");
      if (dataNodes) {
        tl.fromTo(
          dataNodes,
          { opacity: 0, scale: 0 },
          { opacity: (_i, el) => parseFloat(el.getAttribute("data-target-opacity") || "1"), scale: 1, duration: 0.8, stagger: { amount: 1.5, from: "center" } }
        );
      }
      tl.fromTo(".dm-hud", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1, stagger: 0.2 }, "-=0.5");
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <svg viewBox="-120 -120 240 260" className="w-full h-full">
        <rect x="-110" y="-110" width="220" height="220" fill="none" stroke="#00FFAA" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.15" />
        <g ref={dataGridRef}>
          {gridPoints.map((pt) => {
            const opacity = pt.isHit ? 0.9 : 0.2;
            const shouldScramble = (pt.randOffset + tick) % 15 === 0;
            const displayChar = shouldScramble ? Math.floor(Math.random() * 10).toString() : pt.charBase;
            return (
              <text
                key={pt.id}
                x={pt.x}
                y={pt.y}
                className="data-node select-none"
                fill="#00FFAA"
                fontSize={pt.isHit ? "7" : "5"}
                fontFamily="'Space Mono', 'JetBrains Mono', monospace"
                textAnchor="middle"
                dominantBaseline="middle"
                data-target-opacity={opacity}
              >
                {displayChar}
              </text>
            );
          })}
        </g>

        {/* HUD Overlays */}
        <g className="dm-hud">
          <rect x="52" y="-57" width="16" height="16" fill="none" stroke="#FFFFFF" strokeWidth="1" />
          <line x1="68" y1="-49" x2="110" y2="-70" stroke="#FFFFFF" strokeWidth="0.5" />
          <text x="115" y="-70" fill="#FFFFFF" fontSize="8" fontFamily="'Space Mono', monospace" dominantBaseline="middle">YIELD_OPT</text>
          <text x="115" y="-60" fill="#00FFAA" fontSize="7" fontFamily="'Space Mono', monospace" opacity="0.8">Δ 1.514</text>
        </g>
        <g className="dm-hud" opacity="0.8">
          <circle cx="0" cy="0" r="10" fill="none" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="-7" y1="7" x2="-40" y2="40" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
          <text x="-45" y="45" fill="#FFFFFF" fontSize="8" fontFamily="'Space Mono', monospace" textAnchor="end">CORE</text>
        </g>
        <text x="0" y="120" className="dm-hud" fontFamily="'Space Mono', monospace" fontSize="12" fill="#00FFAA" textAnchor="middle" opacity="0.6">
          [ RUNNING PROTOCOL ]
        </text>
      </svg>
    </div>
  );
}

/**
 * TelemetryScanner — Original combined component (kept for backward compat).
 */
export default function TelemetryScanner() {
  return (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center overflow-hidden rounded-[2rem] border border-white/5 relative">
      <div className="flex items-center gap-8 w-full max-w-5xl px-8">
        <RadarLogo className="w-[280px] h-auto shrink-0" />
        <DataMatrix className="flex-1 h-[300px]" />
      </div>
    </div>
  );
}
