"use client";

import p5 from "p5";
import React, { useEffect, useRef } from "react";

interface VesselIntelligenceSketchProps {
  intelligenceRef: React.MutableRefObject<number>;
}

export default function VesselIntelligenceSketch({ intelligenceRef }: VesselIntelligenceSketchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let boids: Boid[] = [];
      let vesselPos: p5.Vector;
      let currentScrollOffset = 0;
      
      const params = {
        fieldScale: 0.015,
        velocityFactor: 1.2,
        seed: 12345
      };

      p.setup = () => {
        p.createCanvas(containerRef.current!.offsetWidth, containerRef.current!.offsetHeight);
        vesselPos = p.createVector(p.width / 2, p.height / 2);
        p.noiseSeed(params.seed);
        p.randomSeed(params.seed);
        
        boids = [];
        for (let i = 0; i < 250; i++) {
          boids.push(new Boid());
        }
      };

      p.draw = () => {
        // Read the current intelligence level from the parent's ref (driven by GSAP)
        const currentIntelligence = intelligenceRef.current;
        
        p.background(10, 20, 40);

        // Vessel bobbing
        const time = p.millis() * 0.001;
        const bobOffset = p.sin(time) * 15;
        
        // Use a subtle constant scroll offset effect for deep water feel
        currentScrollOffset = p.lerp(currentScrollOffset, p.frameCount * 0.5, 0.05);

        p.push();
        p.translate(0, -currentScrollOffset % p.height);
        drawSeabed();
        p.translate(0, p.height);
        drawSeabed();
        p.pop();

        drawVessel(bobOffset, currentIntelligence);

        for (let boid of boids) {
          boid.flock(boids, currentIntelligence);
          boid.update();
          boid.borders();
          boid.display(currentIntelligence);
        }
      };

      p.windowResized = () => {
        if (containerRef.current) {
          p.resizeCanvas(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
          vesselPos = p.createVector(p.width / 2, p.height / 2);
        }
      };

      // --- Drawing Functions ---
      function drawSeabed() {
        p.push();
        p.noStroke();

        // 1. Distant Shore / Drop-off (Top)
        p.fill(30, 45, 60, 150);
        p.beginShape();
        p.vertex(0, 0);
        for (let x = 0; x <= p.width; x += 50) {
          let y = p.noise(x * 0.005, params.seed) * 200;
          p.vertex(x, y);
        }
        p.vertex(p.width, 0);
        p.endShape(p.CLOSE);

        // 2. Deep Abyssal Rocks (Bottom)
        p.fill(5, 12, 25, 200);
        p.beginShape();
        p.vertex(0, p.height);
        for (let x = 0; x <= p.width; x += 30) {
          let y = p.height - 50 - p.pow(p.noise(x * 0.01, params.seed + 100), 2) * 250;
          p.vertex(x, y);
        }
        p.vertex(p.width, p.height);
        p.endShape(p.CLOSE);

        // 3. Glowing Crystalline Clusters (Sparse)
        p.randomSeed(params.seed + 50);
        for (let i = 0; i < 6; i++) {
          let cx = p.random(p.width);
          let cy = p.random(p.height);
          let clusterSize = p.random(30, 80);
          
          let colorType = p.floor(p.random(3));
          let glowColor;
          if (colorType === 0) glowColor = p.color(0, 255, 170, 30); // Cyan
          else if (colorType === 1) glowColor = p.color(204, 88, 51, 30); // Amber
          else glowColor = p.color(100, 255, 100, 20); // Green

          // Ambient glow
          p.fill(glowColor);
          p.ellipse(cx, cy, clusterSize * 2.5);
          
          let crystalGlow = p.color(p.red(glowColor), p.green(glowColor), p.blue(glowColor), 150);
          let coreColor = p.color(255, 255, 255, 200);

          let numCrystals = p.floor(p.random(3, 8));
          for (let j = 0; j < numCrystals; j++) {
            let angle = p.random(p.TWO_PI);
            let dist = p.random(clusterSize * 0.5);
            let x = cx + p.cos(angle) * dist;
            let y = cy + p.sin(angle) * dist;
            let w = p.random(4, 12);
            let h = p.random(15, 40);
            let rot = angle + p.random(-0.5, 0.5);

            p.push();
            p.translate(x, y);
            p.rotate(rot);
            p.fill(crystalGlow);
            p.triangle(-w/2, 0, w/2, 0, 0, -h);
            p.fill(coreColor);
            p.triangle(-w/4, 0, w/4, 0, 0, -h * 0.8);
            p.pop();
          }
        }
        p.pop();
      }

      function drawVessel(bobOffset: number, intel: number) {
        let coreX = vesselPos.x;
        let coreY = vesselPos.y + bobOffset;
        let intelFactor = p.map(intel, 40, 100, 0, 1);

        // Sonar / Field Effect based on Intelligence
        p.noStroke();
        let glowRadius = 150 + (intelFactor * 300);
        let glowIntensity = 20 + (intelFactor * 40);
        
        let ctx = p.drawingContext as CanvasRenderingContext2D;
        let gradient = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, glowRadius);
        gradient.addColorStop(0, `rgba(204, 88, 51, ${glowIntensity / 255})`);
        gradient.addColorStop(0.4, `rgba(204, 88, 51, ${glowIntensity * 0.3 / 255})`);
        gradient.addColorStop(1, 'rgba(10, 20, 40, 0)');
        
        ctx.fillStyle = gradient;
        p.ellipse(coreX, coreY, glowRadius * 2);

        // The Vessel Base (Geometric, modern "tech" monolith)
        p.push();
        p.translate(coreX, coreY);
        
        // Data rings
        p.noFill();
        p.strokeWeight(1);
        p.stroke(204, 88, 51, 100 + intelFactor * 100);
        let time = p.millis() * 0.001;
        p.arc(0, 0, 100, 100, time, time + p.PI);
        p.arc(0, 0, 120, 120, -time * 1.5, -time * 1.5 + p.HALF_PI);

        // Central structure (Sleek diamond/rhombus)
        p.noStroke();
        p.fill(242, 240, 233, 220); // Off-white
        p.beginShape();
        p.vertex(0, -30);
        p.vertex(20, 0);
        p.vertex(0, 30);
        p.vertex(-20, 0);
        p.endShape(p.CLOSE);

        // Glowing core
        p.fill(204, 88, 51, 255); // Orange core
        p.ellipse(0, 0, 12 + intelFactor * 8);
        p.fill(255, 255, 255, 200);
        p.ellipse(0, 0, 4 + intelFactor * 4);
        
        p.pop();
      }

      // --- Boid Class ---
      class Boid {
        pos: p5.Vector;
        vel: p5.Vector;
        acc: p5.Vector;
        species: 'minnow' | 'standard' | 'whale';
        maxForce: number;
        maxSpeed: number;
        sizeBase: number;
        rOffset: number;
        gOffset: number;
        bOffset: number;
        trailPoints: p5.Vector[];

        constructor() {
          let angle = p.random(p.TWO_PI);
          let distance = p.random(50, p.width / 2);
          this.pos = p.createVector(
              vesselPos.x + p.cos(angle) * distance,
              vesselPos.y + p.sin(angle) * distance
          );
          
          this.vel = p5.Vector.random2D();
          this.vel.setMag(p.random(2, 4));
          this.acc = p.createVector(0, 0);
          
          let r = p.random(100);
          if (r < 70) {
              this.species = 'minnow';
              this.maxForce = 0.15; 
              this.maxSpeed = 4.5;  
              this.sizeBase = p.random(1.5, 2.5); 
              this.rOffset = p.random(-20, 10);
              this.gOffset = p.random(20, 50);
              this.bOffset = p.random(50, 80); 
          } else if (r < 95) {
              this.species = 'standard';
              this.maxForce = 0.05; 
              this.maxSpeed = 2.5;  
              this.sizeBase = p.random(3.0, 5.0); 
              this.rOffset = p.random(20, 50);
              this.gOffset = p.random(0, 30);
              this.bOffset = p.random(-30, 10); 
          } else {
              this.species = 'whale';
              this.maxForce = 0.01; 
              this.maxSpeed = 1.0;  
              this.sizeBase = p.random(10.0, 15.0); 
              this.rOffset = p.random(-40, -10);
              this.gOffset = p.random(-20, 10);
              this.bOffset = p.random(40, 90); 
          }
          
          this.trailPoints = [];
        }

        flock(boids: Boid[], intel: number) {
          let intelFactor = p.map(intel, 40, 100, 0.0, 1.0);
          
          let sep = this.separate(boids);
          let ali = this.align(boids);
          let coh = this.cohesion(boids);
          let center = this.attractToVessel();
          let noiseForce = this.calculateNoiseForce();

          if (this.species === 'minnow') {
              sep.mult(1.8);
              ali.mult(1.5 * intelFactor);
              coh.mult(1.2 * intelFactor);
              center.mult(0.4 + (intelFactor * 0.4));
              noiseForce.mult(0.2 + 0.8 * (1.1 - intelFactor)); 
          } else if (this.species === 'standard') {
              sep.mult(1.5);
              ali.mult(1.0 * intelFactor);
              coh.mult(1.0 * intelFactor);
              center.mult(0.3 + (intelFactor * 0.4));
              noiseForce.mult(0.15 + 0.35 * (1.1 - intelFactor));
          } else if (this.species === 'whale') {
              sep.mult(2.5); 
              ali.mult(0.2 * intelFactor); 
              coh.mult(0.1 * intelFactor); 
              center.mult(0.3 + (intelFactor * 0.3)); 
              noiseForce.mult(0.1 + 0.1 * (1.1 - intelFactor)); 
          }

          this.applyForce(sep);
          this.applyForce(ali);
          this.applyForce(coh);
          this.applyForce(center);
          this.applyForce(noiseForce);
        }

        calculateNoiseForce() {
          let noiseVal = p.noise(
              this.pos.x * params.fieldScale,
              this.pos.y * params.fieldScale,
              params.seed * 0.001
          );
          let angle = noiseVal * p.TWO_PI * 4;
          let force = p5.Vector.fromAngle(angle);
          force.mult(params.velocityFactor);
          return force;
        }

        applyForce(force: p5.Vector) {
          this.acc.add(force);
        }

        attractToVessel() {
          let target = p.createVector(vesselPos.x, vesselPos.y);
          let desired = p5.Vector.sub(target, this.pos);
          let d = desired.mag();
          
          if (d < 150) {
              let m = p.map(d, 0, 150, 0, this.maxSpeed);
              desired.setMag(m);
          } else {
              desired.setMag(this.maxSpeed);
          }
          
          let steer = p5.Vector.sub(desired, this.vel);
          steer.limit(this.maxForce);
          return steer;
        }

        separate(boids: Boid[]) {
          let desiredseparation = this.sizeBase * 4.0;
          let steer = p.createVector(0, 0);
          let count = 0;
          for (let other of boids) {
              let d = p5.Vector.dist(this.pos, other.pos);
              if ((d > 0) && (d < desiredseparation)) {
                  let diff = p5.Vector.sub(this.pos, other.pos);
                  diff.normalize();
                  diff.div(d);
                  steer.add(diff);
                  count++;
              }
          }
          if (count > 0) {
              steer.div(count);
          }
          if (steer.mag() > 0) {
              steer.normalize();
              steer.mult(this.maxSpeed);
              steer.sub(this.vel);
              steer.limit(this.maxForce * 1.5);
          }
          return steer;
        }

        align(boids: Boid[]) {
          let neighbordist = 60;
          let sum = p.createVector(0, 0);
          let count = 0;
          for (let other of boids) {
              let d = p5.Vector.dist(this.pos, other.pos);
              if ((d > 0) && (d < neighbordist) && (other.species === this.species)) {
                  sum.add(other.vel);
                  count++;
              }
          }
          if (count > 0) {
              sum.div(count);
              sum.normalize();
              sum.mult(this.maxSpeed);
              let steer = p5.Vector.sub(sum, this.vel);
              steer.limit(this.maxForce);
              return steer;
          } else {
              return p.createVector(0, 0);
          }
        }

        cohesion(boids: Boid[]) {
          let neighbordist = 60;
          let sum = p.createVector(0, 0);
          let count = 0;
          for (let other of boids) {
              let d = p5.Vector.dist(this.pos, other.pos);
              if ((d > 0) && (d < neighbordist) && (other.species === this.species)) {
                  sum.add(other.pos);
                  count++;
              }
          }
          if (count > 0) {
              sum.div(count);
              return this.seek(sum);
          } else {
              return p.createVector(0, 0);
          }
        }

        seek(target: p5.Vector) {
          let desired = p5.Vector.sub(target, this.pos);
          desired.normalize();
          desired.mult(this.maxSpeed);
          let steer = p5.Vector.sub(desired, this.vel);
          steer.limit(this.maxForce);
          return steer;
        }

        update() {
          this.vel.add(this.acc);
          this.vel.limit(this.maxSpeed);
          this.pos.add(this.vel);
          this.acc.mult(0);

          if (p.frameCount % 2 === 0) {
              this.trailPoints.push(p.createVector(this.pos.x, this.pos.y));
              
              let maxTrailLength = 20;
              if (this.species === 'whale') maxTrailLength = 40;
              if (this.species === 'minnow') maxTrailLength = 8;

              if (this.trailPoints.length > maxTrailLength) {
                  this.trailPoints.splice(0, 1);
              }
          }
        }

        borders() {
          let margin = -50;
          if (this.pos.x < margin) this.pos.x = p.width - margin;
          if (this.pos.y < margin) this.pos.y = p.height - margin;
          if (this.pos.x > p.width - margin) this.pos.x = margin;
          if (this.pos.y > p.height - margin) this.pos.y = margin;
          
          if (this.pos.x < margin || this.pos.y < margin || this.pos.x > p.width - margin || this.pos.y > p.height - margin) {
             this.trailPoints = [];
          }
        }

        display(intel: number) {
          let intelFactor = p.map(intel, 40, 100, 0.0, 1.0);
          
          let maxFadeDistance = 300; 
          let d = p5.Vector.dist(this.pos, vesselPos);
          
          let distanceFade = p.map(d, 0, maxFadeDistance, 1.0, 0.0, true);
          let baseOpacity = 20 + (intelFactor * 200); 
          
          let opacityMultiplier = 1.0;
          if (this.species === 'minnow') opacityMultiplier = 0.6;
          else if (this.species === 'whale') opacityMultiplier = 0.9;
          
          let currentOpacity = baseOpacity * distanceFade * opacityMultiplier;

          p.push();
          p.noFill();
          let trailWeight = this.sizeBase * 0.5 + (intelFactor * 1.5);
          if (this.species === 'whale') trailWeight *= 1.5;
          p.strokeWeight(trailWeight);
          
          p.beginShape();
          for (let i = 0; i < this.trailPoints.length; i++) {
              let pt = this.trailPoints[i];
              let progressOpacity = (i / this.trailPoints.length);
              // Steep fade curve for ephemerality
              let trailFade = p.pow(progressOpacity, 3); 
              let alpha = currentOpacity * trailFade * 0.4;
              p.stroke(0 + this.rOffset, 200 + this.gOffset, 255 + this.bOffset, alpha);
              p.vertex(pt.x, pt.y);
          }
          p.endShape();
          p.pop();

          if (currentOpacity > 5) {
              p.push();
              p.translate(this.pos.x, this.pos.y);
              let theta = this.vel.heading();
              p.rotate(theta);
              
              p.noStroke();
              p.fill(0 + this.rOffset, 200 + this.gOffset, 255 + this.bOffset, currentOpacity);
              
              let r = this.sizeBase + (intel - 40) * (this.species === 'whale' ? 0.08 : 0.03);
              
              if (this.species === 'whale') {
                  p.ellipse(0, 0, r * 2.5, r * 1.5);
                  p.fill(217 + this.rOffset, 119 + this.gOffset, 87 + this.bOffset, (baseOpacity - 50) * opacityMultiplier);
                  p.push();
                  p.rotate(p.PI / 4);
                  p.ellipse(r * 0.2, -r * 0.8, r * 1.8, r * 0.6); 
                  p.pop();
                  p.push();
                  p.rotate(-p.PI / 4);
                  p.ellipse(r * 0.2, r * 0.8, r * 1.8, r * 0.6); 
                  p.pop();
                  p.fill(255, 255, 255, 80 * opacityMultiplier);
                  p.ellipse(r * 0.4, 0, r * 1.0, r * 0.5);
              } else if (this.species === 'minnow') {
                  p.ellipse(0, 0, r * 2, r * 0.8);
                  p.fill(255, 255, 255, 120 * opacityMultiplier);
                  p.ellipse(r * 0.5, -r * 0.1, r * 0.5, r * 0.2);
              } else {
                  p.ellipse(0, 0, r * 3, r * 1.5);
                  p.fill(255, 255, 255, 100 * opacityMultiplier);
                  p.ellipse(r * 0.5, -r * 0.2, r * 0.5, r * 0.3);
              }
              p.pop();
          }
        }
      }
    };

    // Instantiate p5
    p5Instance.current = new p5(sketch, containerRef.current);

    return () => {
      p5Instance.current?.remove();
    };
  }, [intelligenceRef]);

  return <div ref={containerRef} className="w-full h-full" />;
}
