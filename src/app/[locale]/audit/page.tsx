"use client";

import { useState } from "react";
import { Search, MapPin, Star, Image, Globe, MessageSquareText, ArrowRight } from "lucide-react";
import SentimentBreakdown from "@/components/SentimentBreakdown";
import { useTranslations } from "next-intl";
import type { AggregatedSentiment } from "@/lib/review-sentiment";

// =============================================================================
// Public Audit Page — Lead-Gen Visibility Score
// No auth required. Enter an address → get a free visibility score.
// =============================================================================

type AuditResult = {
  restaurant: {
    name: string;
    address: string;
    rating: number;
    reviewCount: number;
    photosCount: number;
    attributes: Record<string, boolean>;
  };
  scores: {
    total: number;
    gbpScore: number;
    reviewScore: number;
    competitiveScore: number;
  };
  sentiment: AggregatedSentiment | null;
  competitors: Array<{
    name: string;
    rating: number;
    reviewCount: number;
  }>;
};

export default function AuditPage() {
  const t = useTranslations("Audit");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), email: email.trim() || undefined }),
      });

      if (res.status === 429) {
        setError(t("error_rate_limit"));
        return;
      }
      if (res.status === 404) {
        setError(t("error_not_found"));
        return;
      }
      if (!res.ok) {
        setError(t("error_generic"));
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch {
      setError(t("error_network"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
          <Globe className="w-3.5 h-3.5" />
          {t("badge_title")}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          {t("hero_title")}
        </h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
          {t("hero_description")}
        </p>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-3">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("placeholder_address")}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border border-border/50 text-base focus:outline-none focus:border-primary/50 transition-colors"
              required
            />
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("placeholder_email")}
              className="flex-1 px-4 py-3 rounded-xl bg-card border border-border/50 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Search className="w-4 h-4 animate-pulse" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {loading ? t("btn_analyzing") : t("btn_analyze")}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="max-w-3xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/50 p-6 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-2/3 mb-4" />
                <div className="h-8 bg-white/5 rounded w-1/2 mb-2" />
                <div className="h-2 bg-white/5 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="max-w-4xl mx-auto px-4 pb-20 space-y-8">
          {/* Restaurant info + total score */}
          <div className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-8 text-center">
            <h2 className="text-xl font-bold mb-1">{result.restaurant.name}</h2>
            <p className="text-sm text-muted-foreground mb-6">{result.restaurant.address}</p>
            <div className="text-5xl font-bold mb-2">
              <span className={
                result.scores.total >= 70 ? "text-emerald-500" :
                result.scores.total >= 40 ? "text-amber-500" : "text-red-500"
              }>
                {result.scores.total}
              </span>
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("score_label")}</p>
          </div>

          {/* Score breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScoreCard
              icon={<Globe className="w-5 h-5" />}
              label={t("score_gbp")}
              score={result.scores.gbpScore}
              details={[
                t("photos_count", { count: result.restaurant.photosCount }),
                t("attributes_count", { count: Object.values(result.restaurant.attributes).filter(Boolean).length }),
              ]}
            />
            <ScoreCard
              icon={<Star className="w-5 h-5" />}
              label={t("score_reviews")}
              score={result.scores.reviewScore}
              details={[
                t("rating_value", { rating: result.restaurant.rating }),
                t("reviews_count", { count: result.restaurant.reviewCount }),
              ]}
            />
            <ScoreCard
              icon={<Image className="w-5 h-5" />}
              label={t("score_competitive")}
              score={result.scores.competitiveScore}
              details={[
                t("competitors_count", { count: result.competitors.length }),
              ]}
            />
          </div>

          {/* Sentiment */}
          {result.sentiment && result.sentiment.reviewCount > 0 && (
            <div className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquareText className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("sentiment_title")}
                </h2>
              </div>
              <SentimentBreakdown sentiment={result.sentiment} />
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-r from-primary/10 to-cyan-500/10 rounded-[2rem] border border-primary/20 p-8 text-center">
            <h3 className="text-lg font-bold mb-2">
              {t("cta_title")}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {t("cta_description")}
            </p>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              {t("cta_button")}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({
  icon,
  label,
  score,
  details,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
  details: string[];
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="flex items-end gap-1 mb-3">
        <span className={`text-3xl font-bold ${
          score >= 70 ? "text-emerald-500" : score >= 40 ? "text-amber-500" : "text-red-500"
        }`}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground mb-1">/100</span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="space-y-0.5">
        {details.map((d, i) => (
          <p key={i} className="text-[11px] text-muted-foreground">{d}</p>
        ))}
      </div>
    </div>
  );
}
