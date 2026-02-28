"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import gsap from "gsap";

export default function TelemetryScanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dataGridRef = useRef<SVGGElement>(null);
  const linesRef = useRef<SVGGElement>(null);
  const leftLogoRef = useRef<SVGGElement>(null);

  // Rapidly scrambling text effect simulation
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 80);
    return () => clearInterval(interval);
  }, []);

  // Mathematically sample the geometry of your SVG to create the Data Point Cloud
  const gridPoints = useMemo(() => {
    const points = [];
    const STEP = 6; // Density of the data grid

    for (let y = -90; y <= 90; y += STEP) {
      for (let x = -90; x <= 90; x += STEP) {
        const r = Math.sqrt(x * x + y * y);
        
        // Define the geometry hits (thickness of 3.5 for good grid sampling)
        const hitC1 = Math.abs(r - 15) < 3.5;
        const hitC2 = Math.abs(r - 35) < 3.5;
        const hitC3 = Math.abs(r - 60) < 3.5;
        const hitC4 = Math.abs(r - 85) < 3.5;
        const hitVLine = Math.abs(x) < 3.5 && y > -90 && y < -25;
        const hitHLine = Math.abs(y) < 3.5 && x > -90 && x < 90;

        const isHit = hitC1 || hitC2 || hitC3 || hitC4 || hitVLine || hitHLine;
        
        // Add some random noise points orbiting the outside
        const isNoise = !isHit && Math.random() > 0.96 && r < 100;

        if (isHit || isNoise) {
          points.push({
            id: `${x}-${y}`,
            x,
            y,
            isHit,
            // Initialize with pseudo-random numbers, heavily weighting "4" like the inspiration image
            charBase: Math.random() > 0.3 ? "4" : Math.floor(Math.random() * 10).toString(),
            randOffset: Math.floor(Math.random() * 100)
          });
        }
      }
    }
    return points;
  }, []);

  // GSAP Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 1. Fade in the pure logo
      tl.fromTo(leftLogoRef.current, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 1.5 });

      // 2. Shoot the telemetry lines across
      const lines = linesRef.current?.querySelectorAll("line");
      if (lines) {
        tl.fromTo(
          lines,
          { strokeDashoffset: -200, opacity: 0 },
          { strokeDashoffset: 0, opacity: 0.4, duration: 1.5, stagger: 0.1 },
          "-=1.0"
        );
      }

      // 3. Reveal the Data Matrix sequentially
      const dataNodes = dataGridRef.current?.querySelectorAll("text.data-node");
      if (dataNodes) {
        tl.fromTo(
          dataNodes,
          { opacity: 0, scale: 0 },
          { opacity: (i, el) => parseFloat(el.getAttribute("data-target-opacity") || "1"), scale: 1, duration: 0.8, stagger: { amount: 1.5, from: "center" } },
          "-=1.2"
        );
      }

      // 4. Reveal the HUD overlays
      tl.fromTo(
        ".hud-element",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.2 },
        "-=0.5"
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[500px] flex items-center justify-center overflow-hidden rounded-[2rem] border border-white/5 relative"
    >
      <svg viewBox="0 0 900 400" className="w-full max-w-5xl">
        
        {/* ============================================================
            LEFT: The Source Geometry (Your Pure Logo)
        ============================================================ */}
        <g ref={leftLogoRef} transform="translate(250, 180)">
          <circle cx="0" cy="0" r="15" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="0" cy="0" r="35" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" />
          <circle cx="0" cy="0" r="60" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.3" />
          <circle cx="0" cy="0" r="85" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.15" />
          <line x1="0" y1="-90" x2="0" y2="-25" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
          <circle cx="0" cy="-25" r="3" fill="#FFFFFF" />
          <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
          <line x1="-90" y1="0" x2="90" y2="0" stroke="#FFFFFF" strokeWidth="1" opacity="0.2" />
          <text x="0" y="120" fontFamily="'Space Grotesk', sans-serif" fontSize="24" fontWeight="400" letterSpacing="0.35em" fill="#FFFFFF" textAnchor="middle" opacity="0.8">RIVE</text>
        </g>

        {/* ============================================================
            MIDDLE: The Telemetry Mapping Lines
        ============================================================ */}
        <g ref={linesRef} stroke="#00FFAA" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4">
          {/* Mapping North Axis */}
          <line x1="250" y1="90" x2="650" y2="90" strokeDasharray="2 4" />
          {/* Mapping Center Point */}
          <line x1="250" y1="180" x2="650" y2="180" strokeDasharray="2 4" />
          {/* Mapping Outer Ring Right */}
          <line x1="335" y1="180" x2="735" y2="180" strokeDasharray="2 4" />
          {/* Mapping Bottom Ring */}
          <line x1="250" y1="265" x2="650" y2="265" strokeDasharray="2 4" />
        </g>

        {/* ============================================================
            RIGHT: The Data Point Matrix Decoding
        ============================================================ */}
        <g transform="translate(650, 180)">
          {/* Subtle bounding box for the data matrix */}
          <rect x="-110" y="-110" width="220" height="220" fill="none" stroke="#00FFAA" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.15" />

          {/* Render the dynamically sampled string of nodes */}
          <g ref={dataGridRef}>
            {gridPoints.map((pt) => {
              const opacity = pt.isHit ? 0.9 : 0.2;
              // Mutate the character based on time to create a "live computing" feel
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

          {/* ============================================================
              HUD OVERLAYS (The floating "After Effects" elements)
          ============================================================ */}
          <g className="hud-element">
            {/* Targeting Square on an outer point */}
            <rect x="52" y="-57" width="16" height="16" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            <line x1="68" y1="-49" x2="110" y2="-70" stroke="#FFFFFF" strokeWidth="0.5" />
            <text x="115" y="-70" fill="#FFFFFF" fontSize="8" fontFamily="'Space Mono', monospace" dominantBaseline="middle">YIELD_OPT</text>
            <text x="115" y="-60" fill="#00FFAA" fontSize="7" fontFamily="'Space Mono', monospace" opacity="0.8">Δ 1.514</text>
          </g>

          <g className="hud-element" opacity="0.8">
            {/* Targeting Square on Center Vertex */}
            <circle cx="0" cy="0" r="10" fill="none" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="-7" y1="7" x2="-40" y2="40" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
            <text x="-45" y="45" fill="#FFFFFF" fontSize="8" fontFamily="'Space Mono', monospace" textAnchor="end">CORE</text>
          </g>
          
          <text x="0" y="120" className="hud-element" fontFamily="'Space Mono', monospace" fontSize="12" fill="#00FFAA" textAnchor="middle" opacity="0.6">
            [ RUNNING PROTOCOL ]
          </text>
        </g>
      </svg>
    </div>
  );
}
