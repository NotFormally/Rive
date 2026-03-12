"use client";

import { useAuth } from "@/components/AuthProvider";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { RefreshCw, HeartPulse, TrendingUp, Lightbulb, BarChart3, MessageSquareText, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/routing";
import HealthScoreGauge from "@/components/HealthScoreGauge";
import HealthScoreTrend from "@/components/HealthScoreTrend";
import HealthScoreBreakdown from "@/components/HealthScoreBreakdown";
import HealthScoreRecommendations from "@/components/HealthScoreRecommendations";
import CompetitorSnapshot from "@/components/CompetitorSnapshot";
import SentimentBreakdown from "@/components/SentimentBreakdown";
import type { HealthGrade, SubScoreKey, SubScoreDetail, Recommendation } from "@/lib/health-score";
import type { NearbyCompetitor } from "@/lib/google-places";
import type { AggregatedSentiment } from "@/lib/review-sentiment";

// =============================================================================
// Health Score Dashboard
// =============================================================================

type HealthScoreData = {
  total_score: number;
  grade: HealthGrade;
  confidence: number;
  sub_score_details: Record<SubScoreKey, SubScoreDetail>;
  recommendations: Recommendation[];
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_photos_count: number | null;
  competitor_data: NearbyCompetitor[];
  review_sentiment: AggregatedSentiment | null;
  trend_forecast: number[];
  calculated_at: string | null;
};

type HistoryPoint = {
  recorded_at: string;
  total_score: number;
};

export default function HealthScorePage() {
  const { profile } = useAuth();
  const t = useTranslations("HealthScore");
  const [data, setData] = useState<HealthScoreData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      const [scoreRes, histRes] = await Promise.all([
        supabase
          .from("restaurant_health_scores")
          .select("*")
          .eq("restaurant_id", profile.id)
          .maybeSingle(),
        supabase
          .from("health_score_history")
          .select("total_score, recorded_at")
          .eq("restaurant_id", profile.id)
          .order("recorded_at", { ascending: true })
          .limit(52),
      ]);

      if (scoreRes.data) setData(scoreRes.data as unknown as HealthScoreData);
      if (histRes.data) setHistory(histRes.data as HistoryPoint[]);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch("/api/health-score", {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error("[HealthScore] Recalculate failed:", e);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  // No score yet — first-time view
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <HeartPulse className="w-16 h-16 mx-auto mb-6 text-primary opacity-50" />
        <h1 className="text-2xl font-bold mb-3">{t("no_score_title")}</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          {t("no_score_desc")}
        </p>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${recalculating ? "animate-spin" : ""}`} />
          {recalculating ? t("calculating") : t("calculate")}
        </button>
      </div>
    );
  }

  const hasVisibility = !!data.google_place_id;
  const hasSentiment = data.review_sentiment && data.review_sentiment.reviewCount > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HeartPulse className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">{t("title")}</h1>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 text-sm hover:border-primary/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
          {recalculating ? t("calculating") : t("recalculate")}
        </button>
      </div>

      {/* Hero: Gauge + Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gauge Card */}
        <div className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 md:p-8 flex flex-col items-center justify-center">
          <HealthScoreGauge
            score={data.total_score}
            grade={data.grade}
            confidence={data.confidence}
          />
          {data.calculated_at && (
            <p className="text-[10px] text-muted-foreground mt-4">
              {t("last_calculated")} {new Date(data.calculated_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        {/* Trend Card */}
        <div className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {t("trend_forecast")}
            </h2>
          </div>
          <HealthScoreTrend history={history} forecast={data.trend_forecast || []} />
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 md:p-8">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6">
          {t("score_breakdown")}
        </h2>
        <HealthScoreBreakdown subScores={data.sub_score_details} />
      </div>

      {/* Recommendations */}
      <div className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {t("recommendations")}
          </h2>
        </div>
        <HealthScoreRecommendations recommendations={data.recommendations || []} />
      </div>

      {/* Visibility CTA (when Google Place ID not linked) */}
      {!hasVisibility && (
        <Link
          href="/dashboard/settings#visibility"
          className="block bg-card backdrop-blur-2xl rounded-[2rem] border border-dashed border-primary/30 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 md:p-8 hover:border-primary/60 hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)] transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{t("unlock_visibility_title")}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("unlock_visibility_desc")}
                </p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-4" />
          </div>
        </Link>
      )}

      {/* Visibility Section (conditional) */}
      {hasVisibility && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Competitor Snapshot */}
          <div className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {t("competitors")}
              </h2>
            </div>
            <CompetitorSnapshot
              myName={profile?.restaurant_name || t("my_restaurant")}
              myRating={data.google_rating || 0}
              myReviewCount={data.google_review_count || 0}
              competitors={data.competitor_data || []}
            />
          </div>

          {/* Sentiment */}
          {hasSentiment && (
            <div className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquareText className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("review_sentiment")}
                </h2>
              </div>
              <SentimentBreakdown sentiment={data.review_sentiment!} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
