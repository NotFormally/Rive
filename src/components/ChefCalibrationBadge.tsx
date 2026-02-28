"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type ChefCalibrationBadgeProps = {
  feedbackCount: number;
  modifier: number;
  trend?: "up" | "down" | "stable";
};

export function ChefCalibrationBadge({
  feedbackCount,
  modifier,
  trend = "stable",
}: ChefCalibrationBadgeProps) {
  if (feedbackCount <= 0) return null;

  // Opacity/intensity scales with distance from 1.0
  // Closer to 1.0 = more subtle, further = stronger
  const distance = Math.abs(modifier - 1.0);
  const intensity = Math.min(1, distance * 2); // 0 at 1.0, 1 at 0.5 or 1.5+
  const bgOpacity = 10 + Math.round(intensity * 15); // 10-25%

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-plex-mono text-xs text-[#2E4036]"
      style={{
        backgroundColor: `rgba(46, 64, 54, ${bgOpacity / 100})`,
      }}
    >
      <span>
        Calibr&eacute; &times;{feedbackCount}
      </span>
      <TrendIcon className="h-3 w-3 shrink-0" />
    </span>
  );
}
