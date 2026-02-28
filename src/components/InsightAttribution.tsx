"use client";

import { ChefHat, Sparkles } from "lucide-react";

type InsightAttributionProps = {
  chefValue: number;
  riveValue: number;
  chefLabel: string;
  riveLabel: string;
  unit?: string;
  explanation?: string;
};

export function InsightAttribution({
  chefValue,
  riveValue,
  chefLabel,
  riveLabel,
  unit,
  explanation,
}: InsightAttributionProps) {
  const formatValue = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString();

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Chef's data card */}
        <div className="flex-1 rounded-xl bg-[#2E4036]/5 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ChefHat className="h-3.5 w-3.5 text-[#2E4036]" />
            <span className="font-outfit text-[11px] text-muted-foreground leading-tight">
              {chefLabel}
            </span>
          </div>
          <span className="font-plex-mono text-xl font-bold text-[#2E4036] tabular-nums">
            {formatValue(chefValue)}
          </span>
          {unit && (
            <span className="font-outfit text-xs text-muted-foreground ml-1">
              {unit}
            </span>
          )}
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <span className="font-plex-mono text-xs text-muted-foreground">+</span>
          <div className="h-px w-4 bg-border" />
        </div>

        {/* Rive's total card */}
        <div className="flex-1 rounded-xl bg-[#CC5833]/5 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-[#CC5833]" />
            <span className="font-outfit text-[11px] text-muted-foreground leading-tight">
              {riveLabel}
            </span>
          </div>
          <span className="font-plex-mono text-xl font-bold text-[#CC5833] tabular-nums">
            {formatValue(riveValue)}
          </span>
          {unit && (
            <span className="font-outfit text-xs text-muted-foreground ml-1">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Explanation */}
      {explanation && (
        <p className="mt-2 font-outfit text-xs text-muted-foreground italic leading-relaxed">
          {explanation}
        </p>
      )}
    </div>
  );
}
