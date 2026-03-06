// =============================================================================
// Review Sentiment Pipeline — Tiered Analysis
//
// Fast pass: wink-sentiment (<1ms, Edge-compatible)
// Aspect extraction: regex-based food/service/ambiance/value detection
// Applied to Google reviews and smartlogbook entries.
// =============================================================================

import sentiment from 'wink-sentiment';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SentimentResult = {
  score: number;          // normalized -1 to 1
  comparative: number;    // score per word
  label: 'positive' | 'negative' | 'neutral';
  positiveWords: string[];
  negativeWords: string[];
};

export type AspectScores = {
  food: number | null;       // -1 to 1
  service: number | null;
  ambiance: number | null;
  value: number | null;
};

export type ReviewAnalysis = {
  sentiment: SentimentResult;
  aspects: AspectScores;
};

export type AggregatedSentiment = {
  averageScore: number;
  distribution: { positive: number; neutral: number; negative: number };
  aspects: AspectScores;
  topPositive: string[];
  topNegative: string[];
  reviewCount: number;
};

// ---------------------------------------------------------------------------
// Aspect keyword maps (FR + EN)
// ---------------------------------------------------------------------------

const ASPECT_KEYWORDS: Record<keyof AspectScores, RegExp> = {
  food: /\b(food|plat|cuisine|dish|meal|repas|taste|go[uû]t|flavor|saveur|menu|chef|cook|cuisinier|ingredien|fresh|frais|portion|dessert|entr[eé]e|appetizer|starter|main\s+course|pizza|pasta|burger|steak|sushi|salade|salad|soupe|soup)\b/i,
  service: /\b(service|serveur|waiter|waitress|staff|personnel|accueil|welcome|attent|friendly|poli|rude|slow|lent|rapide|fast|quick|professi|manag|g[eé]rant|host|reservation|r[eé]servation)\b/i,
  ambiance: /\b(ambiance|ambience|atmosph|d[eé]cor|décoration|interior|int[eé]rieur|music|musique|noise|bruit|cozy|cosy|charm|beautiful|beau|belle|view|vue|terrace|terrasse|lighting|[eé]clairage|clean|propre|sale|dirty|romantic|romantique)\b/i,
  value: /\b(price|prix|value|valeur|expensive|cher|cheap|bon\s+march|affordable|abordable|worth|rapport\s+qualit|bang\s+for|overpriced|rip[\s-]?off|bill|addition|tip|pourboire|portion\s+size)\b/i,
};

// ---------------------------------------------------------------------------
// Fast Sentiment (wink-sentiment)
// ---------------------------------------------------------------------------

export function analyzeSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return { score: 0, comparative: 0, label: 'neutral', positiveWords: [], negativeWords: [] };
  }

  const result = sentiment(text);
  const normalizedScore = Math.max(-1, Math.min(1, result.normalizedScore / 5));

  return {
    score: normalizedScore,
    comparative: result.score / (text.split(/\s+/).length || 1),
    label: normalizedScore > 0.1 ? 'positive' : normalizedScore < -0.1 ? 'negative' : 'neutral',
    positiveWords: result.sentiment?.positive || [],
    negativeWords: result.sentiment?.negative || [],
  };
}

// ---------------------------------------------------------------------------
// Aspect Extraction
// ---------------------------------------------------------------------------

function extractAspectSentiment(text: string): AspectScores {
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 3);
  const aspectScores: Record<keyof AspectScores, number[]> = {
    food: [], service: [], ambiance: [], value: [],
  };

  for (const sentence of sentences) {
    for (const [aspect, regex] of Object.entries(ASPECT_KEYWORDS)) {
      if (regex.test(sentence)) {
        const { score } = analyzeSentiment(sentence);
        aspectScores[aspect as keyof AspectScores].push(score);
      }
    }
  }

  return {
    food: avg(aspectScores.food),
    service: avg(aspectScores.service),
    ambiance: avg(aspectScores.ambiance),
    value: avg(aspectScores.value),
  };
}

// ---------------------------------------------------------------------------
// Full Review Analysis
// ---------------------------------------------------------------------------

export function analyzeReview(text: string): ReviewAnalysis {
  return {
    sentiment: analyzeSentiment(text),
    aspects: extractAspectSentiment(text),
  };
}

// ---------------------------------------------------------------------------
// Aggregate Multiple Reviews
// ---------------------------------------------------------------------------

export function aggregateReviews(reviews: Array<{ text: string; rating?: number }>): AggregatedSentiment {
  if (reviews.length === 0) {
    return {
      averageScore: 0,
      distribution: { positive: 0, neutral: 0, negative: 0 },
      aspects: { food: null, service: null, ambiance: null, value: null },
      topPositive: [],
      topNegative: [],
      reviewCount: 0,
    };
  }

  const analyses = reviews.map(r => analyzeReview(r.text));
  const sentiments = analyses.map(a => a.sentiment);

  // Distribution
  const distribution = { positive: 0, neutral: 0, negative: 0 };
  for (const s of sentiments) distribution[s.label]++;

  // Aggregate aspects
  const allAspects: Record<keyof AspectScores, number[]> = {
    food: [], service: [], ambiance: [], value: [],
  };
  for (const a of analyses) {
    for (const key of ['food', 'service', 'ambiance', 'value'] as const) {
      if (a.aspects[key] !== null) allAspects[key].push(a.aspects[key]!);
    }
  }

  // Top positive/negative words
  const posWords: Record<string, number> = {};
  const negWords: Record<string, number> = {};
  for (const s of sentiments) {
    for (const w of s.positiveWords) posWords[w] = (posWords[w] || 0) + 1;
    for (const w of s.negativeWords) negWords[w] = (negWords[w] || 0) + 1;
  }

  return {
    averageScore: sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length,
    distribution,
    aspects: {
      food: avg(allAspects.food),
      service: avg(allAspects.service),
      ambiance: avg(allAspects.ambiance),
      value: avg(allAspects.value),
    },
    topPositive: topN(posWords, 5),
    topNegative: topN(negWords, 5),
    reviewCount: reviews.length,
  };
}

// ---------------------------------------------------------------------------
// Sentiment → Score (0-100) for Health Score integration
// ---------------------------------------------------------------------------

export function sentimentToScore(agg: AggregatedSentiment): number {
  if (agg.reviewCount === 0) return 0;
  // Map -1..1 to 0..100
  return Math.round((agg.averageScore + 1) * 50);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function avg(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function topN(counts: Record<string, number>, n: number): string[] {
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([word]) => word);
}
