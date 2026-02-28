"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

type WasteCostCalculatorProps = {
  variant?: "landing" | "pricing";
};

function formatCurrency(value: number): string {
  return Math.round(value).toLocaleString("fr-CA");
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
    // Conservative estimate: 30-50% reduction, we show 40% (middle)
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

  const sliderTrackStyle = (value: number, min: number, max: number) => {
    const percent = ((value - min) / (max - min)) * 100;
    return {
      background: `linear-gradient(to right, #CC5833 0%, #CC5833 ${percent}%, rgba(204, 88, 51, 0.15) ${percent}%, rgba(204, 88, 51, 0.15) 100%)`,
    };
  };

  const content = (
    <div className="space-y-6">
      {/* Slider: Covers per week */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-outfit text-sm text-inherit opacity-80">
            {t("covers_week")}
          </label>
          <span className="font-plex-mono text-sm font-semibold tabular-nums">
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
          className="waste-slider w-full h-2 rounded-full appearance-none cursor-pointer"
          style={sliderTrackStyle(covers, 50, 500)}
        />
        <div className="flex justify-between mt-1">
          <span className="font-plex-mono text-[10px] opacity-40">50</span>
          <span className="font-plex-mono text-[10px] opacity-40">500</span>
        </div>
      </div>

      {/* Slider: Average ticket */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-outfit text-sm text-inherit opacity-80">
            {t("avg_ticket")}
          </label>
          <span className="font-plex-mono text-sm font-semibold tabular-nums">
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
          className="waste-slider w-full h-2 rounded-full appearance-none cursor-pointer"
          style={sliderTrackStyle(ticket, 30, 150)}
        />
        <div className="flex justify-between mt-1">
          <span className="font-plex-mono text-[10px] opacity-40">30$</span>
          <span className="font-plex-mono text-[10px] opacity-40">150$</span>
        </div>
      </div>

      {/* Slider: Food cost ratio */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-outfit text-sm text-inherit opacity-80">
            {t("food_cost_ratio")}
          </label>
          <span className="font-plex-mono text-sm font-semibold tabular-nums">
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
          className="waste-slider w-full h-2 rounded-full appearance-none cursor-pointer"
          style={sliderTrackStyle(foodCostPercent, 25, 40)}
        />
        <div className="flex justify-between mt-1">
          <span className="font-plex-mono text-[10px] opacity-40">25%</span>
          <span className="font-plex-mono text-[10px] opacity-40">40%</span>
        </div>
      </div>

      {/* Slider: Current waste estimate */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-outfit text-sm text-inherit opacity-80">
            {t("overproduction_rate")}
          </label>
          <span className="font-plex-mono text-sm font-semibold tabular-nums">
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
          className="waste-slider w-full h-2 rounded-full appearance-none cursor-pointer"
          style={sliderTrackStyle(wastePercent, 4, 20)}
        />
        <div className="flex justify-between mt-1">
          <span className="font-plex-mono text-[10px] opacity-40">4%</span>
          <span className="font-plex-mono text-[10px] opacity-40">20%</span>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3 pt-2">
        <div className="flex items-baseline gap-2">
          <span className="font-outfit text-sm opacity-70">
            {t("weekly_purchases")}
          </span>
          <span className="font-plex-mono text-sm font-semibold tabular-nums">
            {formatCurrency(calculations.weeklyFoodSpend)}$
          </span>
        </div>
        <div>
          <span className="font-plex-mono text-3xl font-bold text-red-500 tabular-nums">
            ~{formatCurrency(calculations.weeklyWaste)}$
          </span>
          <span className="font-outfit text-sm opacity-70 ml-1">
            {t("weekly_loss")}
          </span>
        </div>
        <p className="font-outfit text-sm opacity-60">
          {t.rich("yearly_loss", {
            val: `${formatCurrency(calculations.yearlyWaste)}$`,
            value: (chunks) => (
              <span className="font-plex-mono font-semibold tabular-nums">
                {chunks}
              </span>
            )
          })}
        </p>
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <p className="font-outfit text-sm font-medium text-emerald-400">
            {t.rich("potential_reduction", {
              val: `~${formatCurrency(calculations.potentialSavings)}$`,
              value: (chunks) => (
                <span className="font-plex-mono font-bold tabular-nums">
                  {chunks}
                </span>
              )
            })}
          </p>
        </div>
        <p className="font-plex-mono text-[10px] opacity-40 leading-relaxed">
          {t("disclaimer", { percent: 40 })}
        </p>
      </div>

      {/* CTA (landing only) */}
      {variant === "landing" && (
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-xl bg-[#CC5833] px-6 py-3 font-jakarta text-sm font-semibold text-white transition-colors hover:bg-[#CC5833]/90"
        >
          {t("cta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      {/* Slider custom styles */}
      <style>{`
        .waste-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #CC5833;
          border: 3px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .waste-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .waste-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #CC5833;
          border: 3px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .waste-slider::-moz-range-track {
          height: 8px;
          border-radius: 9999px;
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

  // Landing variant: full-width dark section
  return (
    <section className="w-full bg-[#1A1A1A] text-[#F2F0E9]">
      <div className="mx-auto max-w-2xl px-4 sm:px-8 py-16 sm:py-24">
        <h2 className="font-jakarta text-2xl sm:text-3xl font-bold mb-2">
          {t("title")}
        </h2>
        <p className="font-outfit text-sm opacity-60 mb-10">
          {t("subtitle")}
        </p>
        {content}
      </div>
    </section>
  );
}
