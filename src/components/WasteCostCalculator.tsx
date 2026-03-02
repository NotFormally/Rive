"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

type WasteCostCalculatorProps = {
  variant?: "landing" | "pricing";
};

function formatCurrency(value: number): string {
  return Math.round(value).toLocaleString("fr-CA");
}

// Animated number hook — smooth counter transition
function useAnimatedValue(target: number, duration = 400): number {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>(0);
  const startRef = useRef({ value: target, time: 0 });

  useEffect(() => {
    const start = display;
    const startTime = performance.now();
    startRef.current = { value: start, time: startTime };

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

// Industry reference ranges (NRA, WRAP, FAO studies)
const INDUSTRY_BENCHMARKS = {
  foodCostRange: { min: 0.25, max: 0.40, default: 0.32 }, // 25-40%, fine dining avg ~32%
  wasteRange: { min: 0.04, max: 0.20, default: 0.10 },    // 4-20%, avg ~10%
  reductionRange: { min: 0.30, max: 0.50 },                // 30-50% reduction with data-driven prep
};

export function WasteCostCalculator({
  variant = "landing",
}: WasteCostCalculatorProps) {
  const t = useTranslations("WasteCalculator");

  const [covers, setCovers] = useState(200);
  const [ticket, setTicket] = useState(65);
  const [foodCostPercent, setFoodCostPercent] = useState(32);
  const [wastePercent, setWastePercent] = useState(10);

  const calculations = useMemo(() => {
    const foodCostRatio = foodCostPercent / 100;
    const currentWasteRate = wastePercent / 100;
    const conservativeReduction = 0.40;

    const weeklyFoodSpend = covers * ticket * foodCostRatio;
    const weeklyWaste = weeklyFoodSpend * currentWasteRate;
    const yearlyWaste = weeklyWaste * 52;
    const potentialSavings = yearlyWaste * conservativeReduction;

    return {
      weeklyFoodSpend,
      weeklyWaste,
      yearlyWaste,
      potentialSavings,
      conservativeReduction,
    };
  }, [covers, ticket, foodCostPercent, wastePercent]);

  // Animated values for smooth transitions
  const animWeeklySpend = useAnimatedValue(Math.round(calculations.weeklyFoodSpend));
  const animWeeklyWaste = useAnimatedValue(Math.round(calculations.weeklyWaste));
  const animYearlyWaste = useAnimatedValue(Math.round(calculations.yearlyWaste));
  const animSavings = useAnimatedValue(Math.round(calculations.potentialSavings));

  // Savings as percentage of yearly waste for the progress bar
  const savingsBarPercent = calculations.yearlyWaste > 0
    ? (calculations.potentialSavings / calculations.yearlyWaste) * 100
    : 0;

  const sliderTrackStyle = (value: number, min: number, max: number) => {
    const percent = ((value - min) / (max - min)) * 100;
    return {
      background: `linear-gradient(to right, #CC5833 0%, #CC5833 ${percent}%, rgba(204, 88, 51, 0.12) ${percent}%, rgba(204, 88, 51, 0.12) 100%)`,
    };
  };

  const content = (
    <div className="space-y-8">
      {/* Slider: Covers per week */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <label className="font-outfit text-sm text-inherit opacity-70">
            {t("covers_week")}
          </label>
          <span className="font-plex-mono text-xl font-bold tabular-nums tracking-tight">
            {covers}
          </span>
        </div>
        <input
          type="range"
          min={50}
          max={500}
          step={10}
          value={covers}
          onChange={(e) => setCovers(Number(e.target.value))}
          className="waste-slider w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={sliderTrackStyle(covers, 50, 500)}
        />
        <div className="flex justify-between mt-1.5">
          <span className="font-plex-mono text-[11px] opacity-30">50</span>
          <span className="font-plex-mono text-[11px] opacity-30">500</span>
        </div>
      </div>

      {/* Slider: Average ticket */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <label className="font-outfit text-sm text-inherit opacity-70">
            {t("avg_ticket")}
          </label>
          <span className="font-plex-mono text-xl font-bold tabular-nums tracking-tight">
            {ticket}$
          </span>
        </div>
        <input
          type="range"
          min={30}
          max={150}
          step={5}
          value={ticket}
          onChange={(e) => setTicket(Number(e.target.value))}
          className="waste-slider w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={sliderTrackStyle(ticket, 30, 150)}
        />
        <div className="flex justify-between mt-1.5">
          <span className="font-plex-mono text-[11px] opacity-30">30$</span>
          <span className="font-plex-mono text-[11px] opacity-30">150$</span>
        </div>
      </div>

      {/* Slider: Food cost ratio */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <label className="font-outfit text-sm text-inherit opacity-70">
            {t("food_cost_ratio")}
          </label>
          <span className="font-plex-mono text-xl font-bold tabular-nums tracking-tight">
            {foodCostPercent}%
          </span>
        </div>
        <input
          type="range"
          min={25}
          max={40}
          step={1}
          value={foodCostPercent}
          onChange={(e) => setFoodCostPercent(Number(e.target.value))}
          className="waste-slider w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={sliderTrackStyle(foodCostPercent, 25, 40)}
        />
        <div className="flex justify-between mt-1.5">
          <span className="font-plex-mono text-[11px] opacity-30">25%</span>
          <span className="font-plex-mono text-[11px] opacity-30">40%</span>
        </div>
      </div>

      {/* Slider: Overproduction rate */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <label className="font-outfit text-sm text-inherit opacity-70">
            {t("overproduction_rate")}
          </label>
          <span className="font-plex-mono text-xl font-bold tabular-nums tracking-tight">
            {wastePercent}%
          </span>
        </div>
        <input
          type="range"
          min={4}
          max={20}
          step={1}
          value={wastePercent}
          onChange={(e) => setWastePercent(Number(e.target.value))}
          className="waste-slider w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={sliderTrackStyle(wastePercent, 4, 20)}
        />
        <div className="flex justify-between mt-1.5">
          <span className="font-plex-mono text-[11px] opacity-30">4%</span>
          <span className="font-plex-mono text-[11px] opacity-30">20%</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      {/* Results */}
      <div className="space-y-5">
        {/* Weekly food purchases */}
        <div className="flex items-baseline justify-between">
          <span className="font-outfit text-sm opacity-50">
            {t("weekly_purchases")}
          </span>
          <span className="font-plex-mono text-lg font-semibold tabular-nums tracking-tight">
            {formatCurrency(animWeeklySpend)}$
          </span>
        </div>

        {/* Weekly waste — hero number */}
        <div className="py-2">
          <span className="font-plex-mono text-4xl sm:text-5xl font-black text-[#CC5833] tabular-nums tracking-tighter">
            ~{formatCurrency(animWeeklyWaste)}$
          </span>
          <span className="font-outfit text-base opacity-50 ml-2">
            {t("weekly_loss")}
          </span>
        </div>

        {/* Yearly waste — prominent */}
        <div className="rounded-lg bg-white/[0.04] px-5 py-4">
          <p className="font-outfit text-sm opacity-50">
            {t.rich("yearly_loss", {
              val: `${formatCurrency(animYearlyWaste)}$`,
              value: (chunks) => (
                <span className="font-plex-mono text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-red-400 block mt-1">
                  {chunks}
                </span>
              )
            })}
          </p>
        </div>

        {/* Potential savings — with progress bar */}
        <div className="rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 px-5 py-4 space-y-3">
          <p className="font-outfit text-sm text-emerald-400/80">
            {t.rich("potential_reduction", {
              val: `~${formatCurrency(animSavings)}$`,
              value: (chunks) => (
                <span className="font-plex-mono text-lg font-black tabular-nums text-emerald-400">
                  {chunks}
                </span>
              )
            })}
          </p>
          {/* Savings bar */}
          <div className="h-1.5 rounded-full bg-emerald-500/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500/60 transition-all duration-500 ease-out"
              style={{ width: `${savingsBarPercent}%` }}
            />
          </div>
        </div>

        {/* Disclaimer */}
        <p className="font-plex-mono text-[11px] opacity-30 leading-relaxed">
          {t("disclaimer", { percent: 40 })}
        </p>
      </div>

      {/* CTA (landing only) */}
      {variant === "landing" && (
        <Link
          href="/signup"
          className="group inline-flex items-center gap-2.5 rounded-xl bg-[#CC5833] px-7 py-3.5 font-jakarta text-sm font-semibold text-white transition-all duration-200 hover:bg-[#CC5833]/90 hover:gap-3.5"
        >
          {t("cta")}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}

      {/* Slider custom styles */}
      <style>{`
        .waste-slider {
          outline: none;
        }
        .waste-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #CC5833;
          border: 3px solid #F2F0E9;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25), 0 0 0 0 rgba(204, 88, 51, 0);
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        .waste-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 2px 12px rgba(0,0,0,0.3), 0 0 0 6px rgba(204, 88, 51, 0.12);
        }
        .waste-slider::-webkit-slider-thumb:active {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 10px rgba(204, 88, 51, 0.08);
        }
        .waste-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #CC5833;
          border: 3px solid #F2F0E9;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        .waste-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 2px 12px rgba(0,0,0,0.3), 0 0 0 6px rgba(204, 88, 51, 0.12);
        }
        .waste-slider::-moz-range-track {
          height: 6px;
          border-radius: 9999px;
          border: none;
          background: transparent;
        }
        .waste-slider:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 4px rgba(204, 88, 51, 0.25);
        }
      `}</style>
    </div>
  );

  if (variant === "pricing") {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        {content}
      </div>
    );
  }

  // Landing variant: rendered inside the LandingPage section wrapper (which provides title)
  return (
    <div className="mx-auto max-w-2xl text-[#F2F0E9]">
      {content}
    </div>
  );
}
