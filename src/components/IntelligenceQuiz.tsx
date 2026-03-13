"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronRight, RotateCw, Compass } from "lucide-react";

interface QuizQuestion {
  key: string;
  scores: number[]; // score per option index
}

const QUESTIONS: QuizQuestion[] = [
  { key: "q1", scores: [5, 15, 30, 0] },   // food cost tracking
  { key: "q2", scores: [10, 25, 40] },       // team languages
  { key: "q3", scores: [5, 10, 25, 0] },     // HACCP method
  { key: "q4", scores: [10, 20, 15, 0] },    // menu source
];

const MAX_SCORE = 100; // theoretical max from best answers

export function IntelligenceQuiz() {
  const t = useTranslations("IntelligenceQuiz");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const totalScore = answers.reduce((sum, a, i) => sum + QUESTIONS[i].scores[a], 0);
  const percentage = Math.round((totalScore / MAX_SCORE) * 100);

  function handleAnswer(optionIndex: number) {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setShowResult(true);
    }
  }

  function reset() {
    setCurrentQ(0);
    setAnswers([]);
    setShowResult(false);
  }

  function getLevel(): { key: string; color: string; gradient: string } {
    if (percentage <= 25) return { key: "level_discovery", color: "text-blue-400", gradient: "from-blue-500 to-blue-700" };
    if (percentage <= 50) return { key: "level_operational", color: "text-cyan-400", gradient: "from-cyan-500 to-cyan-700" };
    if (percentage <= 75) return { key: "level_predictive", color: "text-emerald-400", gradient: "from-emerald-500 to-emerald-700" };
    return { key: "level_expert", color: "text-amber-400", gradient: "from-amber-500 to-amber-700" };
  }

  const optionCount = QUESTIONS[currentQ]?.key === "q2" ? 3 : 4;

  return (
    <section className="relative py-24 px-6 md:px-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-cyan-400 font-plex-mono text-xs tracking-widest uppercase mb-4">
            <Compass className="w-4 h-4" />
            {t("badge")}
          </div>
          <h2 className="font-cormorant italic text-3xl md:text-4xl text-[#F2F0E9] font-bold mb-4">
            {t("title")}
          </h2>
          <p className="font-outfit text-slate-400 text-base max-w-lg mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Quiz Card */}
        <div className="bg-[#1A2332] border border-white/5 rounded-2xl overflow-hidden">
          {!showResult ? (
            <>
              {/* Progress bar */}
              <div className="h-1 bg-[#0B131E]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${((currentQ) / QUESTIONS.length) * 100}%` }}
                />
              </div>

              <div className="p-8">
                {/* Question counter */}
                <p className="font-plex-mono text-xs text-slate-500 mb-6 tracking-wider">
                  {currentQ + 1} / {QUESTIONS.length}
                </p>

                {/* Question */}
                <h3 className="font-outfit text-xl text-[#F2F0E9] font-semibold mb-8">
                  {t(`${QUESTIONS[currentQ].key}_question`)}
                </h3>

                {/* Options */}
                <div className="space-y-3">
                  {Array.from({ length: optionCount }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      className="w-full text-left px-5 py-4 rounded-xl border border-white/5 bg-[#0B131E]/50
                        hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-outfit text-[15px] text-slate-300 group-hover:text-[#F2F0E9] transition-colors">
                          {t(`${QUESTIONS[currentQ].key}_opt${i}`)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Results */
            <div className="p-8 text-center">
              {/* Score circle */}
              <div className="relative w-36 h-36 mx-auto mb-8">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none" stroke="#1A2332" strokeWidth="8"
                  />
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${percentage * 3.27} ${327 - percentage * 3.27}`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-outfit text-3xl font-bold text-[#F2F0E9]">{percentage}%</span>
                  <span className="font-plex-mono text-[10px] text-slate-500 tracking-widest uppercase mt-1">
                    {t("score_label")}
                  </span>
                </div>
              </div>

              {/* Level */}
              <p className={`font-plex-mono text-sm tracking-wider uppercase mb-2 ${getLevel().color}`}>
                {t(getLevel().key)}
              </p>
              <h3 className="font-outfit text-xl text-[#F2F0E9] font-semibold mb-3">
                {t("result_title")}
              </h3>
              <p className="font-outfit text-sm text-slate-400 mb-8 max-w-md mx-auto">
                {percentage <= 50
                  ? t("result_low")
                  : t("result_high")}
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-outfit font-semibold text-sm rounded-xl hover:opacity-90 transition-opacity"
                >
                  {t("cta_signup")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 px-5 py-3 text-slate-400 hover:text-[#F2F0E9] font-outfit text-sm transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                  {t("cta_retry")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
