"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import gsap from "gsap";

/**
 * RadarLogo — Realistic sonar display with phosphor green sweep,
 * afterglow trail, target blips, range rings, and bearing markers.
 */

const SONAR_GREEN = "#00FF41";
const SONAR_GREEN_DIM = "#00CC33";
const SONAR_BG = "#0A0F0A";

// Fixed target positions (angle in degrees, distance from center)
const TARGETS = [
  { angle: 35, dist: 55, size: 3 },
  { angle: 110, dist: 72, size: 2.5 },
  { angle: 200, dist: 40, size: 2 },
  { angle: 285, dist: 65, size: 3.5 },
  { angle: 160, dist: 25, size: 2 },
];

export function RadarLogo({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const sweepRef = useRef<SVGGElement>(null);
  const afterglowRef = useRef<SVGGElement>(null);
  const blipRefs = useRef<(SVGCircleElement | null)[]>([]);
  const blipGlowRefs = useRef<(SVGCircleElement | null)[]>([]);
  const pingRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      // Entrance fade
      gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 2, ease: "power2.out" });

      // Sweep rotation — 4s per revolution (realistic military sonar)
      const sweepDuration = 4;
      gsap.to(sweepRef.current, {
        rotation: 360,
        duration: sweepDuration,
        repeat: -1,
        ease: "none",
        transformOrigin: "0 0",
      });

      // Afterglow trail — follows sweep with slight delay, fades
      gsap.to(afterglowRef.current, {
        rotation: 360,
        duration: sweepDuration,
        repeat: -1,
        ease: "none",
        transformOrigin: "0 0",
        delay: 0.05,
      });

      // Blip animations — each blip lights up when sweep angle matches, then decays
      TARGETS.forEach((target, i) => {
        const blip = blipRefs.current[i];
        const glow = blipGlowRefs.current[i];
        if (!blip || !glow) return;

        // Time when sweep reaches this blip (fraction of sweep duration)
        const triggerTime = (target.angle / 360) * sweepDuration;

        // Blip flash + phosphor decay
        gsap.timeline({ repeat: -1, delay: triggerTime })
          .set(blip, { opacity: 1, attr: { r: target.size } })
          .set(glow, { opacity: 0.8, attr: { r: target.size * 3 } })
          .to(blip, { opacity: 0.15, duration: sweepDuration * 0.8, ease: "power2.in" })
          .to(glow, { opacity: 0, attr: { r: target.size * 5 }, duration: sweepDuration * 0.6, ease: "power3.out" }, "<");
      });

      // Center ping — periodic sonar pulse
      gsap.timeline({ repeat: -1, repeatDelay: sweepDuration - 1.2 })
        .fromTo(pingRef.current,
          { attr: { r: 2 }, opacity: 0.8 },
          { attr: { r: 18 }, opacity: 0, duration: 1.2, ease: "power1.out" }
        );

      // Subtle ring flicker (CRT phosphor effect)
      ref.current?.querySelectorAll(".sonar-ring").forEach((ring, i) => {
        gsap.to(ring, {
          opacity: `+=${0.08 + i * 0.02}`,
          duration: 2 + i * 0.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  // Convert polar to cartesian
  const polar = (angle: number, dist: number) => ({
    x: dist * Math.cos((angle - 90) * Math.PI / 180),
    y: dist * Math.sin((angle - 90) * Math.PI / 180),
  });

  return (
    <svg ref={ref} viewBox="-105 -105 210 250" className={className} aria-label="Rive sonar">
      <defs>
        {/* Phosphor glow filter */}
        <filter id="phosphorGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Stronger glow for sweep beam */}
        <filter id="sweepGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Blip glow */}
        <filter id="blipGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>

        {/* Sweep beam gradient — bright leading edge, fading trail */}
        <linearGradient id="sweepBeam" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-90">
          <stop offset="0%" stopColor={SONAR_GREEN} stopOpacity="0.05" />
          <stop offset="60%" stopColor={SONAR_GREEN} stopOpacity="0.25" />
          <stop offset="100%" stopColor={SONAR_GREEN} stopOpacity="0.5" />
        </linearGradient>

        {/* Afterglow gradient — wider, dimmer trail behind sweep */}
        <linearGradient id="afterglowGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-90">
          <stop offset="0%" stopColor={SONAR_GREEN} stopOpacity="0" />
          <stop offset="50%" stopColor={SONAR_GREEN} stopOpacity="0.06" />
          <stop offset="100%" stopColor={SONAR_GREEN} stopOpacity="0.12" />
        </linearGradient>

        {/* Radial vignette for CRT screen effect */}
        <radialGradient id="screenVignette" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={SONAR_BG} stopOpacity="0" />
          <stop offset="85%" stopColor={SONAR_BG} stopOpacity="0" />
          <stop offset="100%" stopColor={SONAR_BG} stopOpacity="0.6" />
        </radialGradient>
      </defs>

      {/* CRT screen background */}
      <circle cx="0" cy="0" r="92" fill={SONAR_BG} />

      {/* Range rings */}
      <circle className="sonar-ring" cx="0" cy="0" r="20" fill="none" stroke={SONAR_GREEN} strokeWidth="0.4" opacity="0.25" />
      <circle className="sonar-ring" cx="0" cy="0" r="40" fill="none" stroke={SONAR_GREEN} strokeWidth="0.4" opacity="0.2" />
      <circle className="sonar-ring" cx="0" cy="0" r="60" fill="none" stroke={SONAR_GREEN} strokeWidth="0.4" opacity="0.18" />
      <circle className="sonar-ring" cx="0" cy="0" r="80" fill="none" stroke={SONAR_GREEN} strokeWidth="0.4" opacity="0.15" />
      {/* Outer boundary ring */}
      <circle cx="0" cy="0" r="88" fill="none" stroke={SONAR_GREEN} strokeWidth="0.8" opacity="0.3" />

      {/* Crosshair lines — full diameter */}
      <line x1="0" y1="-88" x2="0" y2="88" stroke={SONAR_GREEN} strokeWidth="0.3" opacity="0.12" />
      <line x1="-88" y1="0" x2="88" y2="0" stroke={SONAR_GREEN} strokeWidth="0.3" opacity="0.12" />
      {/* Diagonal crosshairs */}
      <line x1="-62" y1="-62" x2="62" y2="62" stroke={SONAR_GREEN} strokeWidth="0.2" opacity="0.06" />
      <line x1="62" y1="-62" x2="-62" y2="62" stroke={SONAR_GREEN} strokeWidth="0.2" opacity="0.06" />

      {/* Bearing markers */}
      <text x="0" y="-90" fill={SONAR_GREEN} fontSize="5" fontFamily="'Space Mono', monospace" textAnchor="middle" opacity="0.5">N</text>
      <text x="92" y="1.5" fill={SONAR_GREEN} fontSize="5" fontFamily="'Space Mono', monospace" textAnchor="start" opacity="0.4">E</text>
      <text x="0" y="94" fill={SONAR_GREEN} fontSize="5" fontFamily="'Space Mono', monospace" textAnchor="middle" opacity="0.4">S</text>
      <text x="-92" y="1.5" fill={SONAR_GREEN} fontSize="5" fontFamily="'Space Mono', monospace" textAnchor="end" opacity="0.4">W</text>

      {/* Range labels */}
      <text x="2" y={-19} fill={SONAR_GREEN} fontSize="3.5" fontFamily="'Space Mono', monospace" opacity="0.3">10</text>
      <text x="2" y={-39} fill={SONAR_GREEN} fontSize="3.5" fontFamily="'Space Mono', monospace" opacity="0.3">20</text>
      <text x="2" y={-59} fill={SONAR_GREEN} fontSize="3.5" fontFamily="'Space Mono', monospace" opacity="0.3">30</text>
      <text x="2" y={-79} fill={SONAR_GREEN} fontSize="3.5" fontFamily="'Space Mono', monospace" opacity="0.3">40</text>

      {/* Afterglow trail — wider arc behind sweep */}
      <g ref={afterglowRef}>
        <path d="M0,0 L-40,-78 A88,88 0 0,1 0,-88 Z" fill="url(#afterglowGrad)" />
      </g>

      {/* Sweep beam — narrow, bright leading edge */}
      <g ref={sweepRef} filter="url(#sweepGlow)">
        <path d="M0,0 L-8,-87 A88,88 0 0,1 8,-87 Z" fill="url(#sweepBeam)" />
        {/* Bright leading edge line */}
        <line x1="0" y1="0" x2="0" y2="-88" stroke={SONAR_GREEN} strokeWidth="0.8" opacity="0.6" />
      </g>

      {/* Target blips */}
      {TARGETS.map((target, i) => {
        const pos = polar(target.angle, target.dist);
        return (
          <g key={i}>
            {/* Glow halo */}
            <circle
              ref={el => { blipGlowRefs.current[i] = el; }}
              cx={pos.x} cy={pos.y} r={target.size * 3}
              fill={SONAR_GREEN} opacity="0"
              filter="url(#blipGlow)"
            />
            {/* Blip dot */}
            <circle
              ref={el => { blipRefs.current[i] = el; }}
              cx={pos.x} cy={pos.y} r={target.size}
              fill={SONAR_GREEN} opacity="0.15"
            />
          </g>
        );
      })}

      {/* Center point */}
      <circle cx="0" cy="0" r="1.5" fill={SONAR_GREEN} opacity="0.9" />
      {/* Sonar ping pulse */}
      <circle ref={pingRef} cx="0" cy="0" r="2" fill="none" stroke={SONAR_GREEN} strokeWidth="0.6" opacity="0" filter="url(#phosphorGlow)" />

      {/* CRT vignette overlay */}
      <circle cx="0" cy="0" r="92" fill="url(#screenVignette)" />

      {/* RIVE text below */}
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
