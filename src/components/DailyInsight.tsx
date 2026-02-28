"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Lightbulb } from "lucide-react";

type DailyInsightRow = {
  id: string;
  insight_text: string;
  created_at: string;
};

export function DailyInsight() {
  const { profile } = useAuth();
  const [insight, setInsight] = useState<DailyInsightRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }

    const fetchInsight = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];

        const { data, error } = await supabase
          .from("daily_insights")
          .select("id, insight_text, created_at")
          .eq("restaurant_id", profile.id)
          .gte("created_at", `${today}T00:00:00`)
          .lte("created_at", `${today}T23:59:59`)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("[DailyInsight] Fetch error:", error.message);
        }

        setInsight(data ?? null);
      } catch (err) {
        console.error("[DailyInsight] Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [profile]);

  // Render nothing while loading or if no insight
  if (loading || !insight) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-amber-50/50 to-orange-50/50 border border-amber-200/50 p-4 sm:p-5">
      <div className="flex gap-3">
        <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <span className="font-plex-mono text-[10px] uppercase tracking-widest text-amber-500/70">
            insight du jour
          </span>
          <p className="font-outfit text-sm text-foreground leading-relaxed">
            {insight.insight_text}
          </p>
        </div>
      </div>
    </div>
  );
}
