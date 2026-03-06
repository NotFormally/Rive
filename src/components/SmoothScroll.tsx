"use client";

import { ReactNode, useEffect, useRef } from "react";
import { ReactLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    // Synchronize GSAP ScrollTrigger with Lenis
    if (lenisRef.current?.lenis) {
      lenisRef.current.lenis.on('scroll', ScrollTrigger.update);
    }
    
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    
    gsap.ticker.add(update);
    
    // Disable GSAP lag smoothing to prevent jitter
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      if (lenisRef.current?.lenis) {
        lenisRef.current.lenis.off('scroll', ScrollTrigger.update);
      }
    };
  }, []);

  return (
    <ReactLenis 
      root 
      ref={lenisRef} 
      autoRaf={false} 
      options={{ 
        lerp: 0.1, 
        duration: 1.5, 
        smoothWheel: true 
      }}
    >
      {children}
    </ReactLenis>
  );
}
