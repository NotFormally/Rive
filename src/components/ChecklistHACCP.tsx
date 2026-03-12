"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ClipboardList,
  ChevronRight,
  X,
  Camera,
  Flame,
  Loader2,
  ThermometerSun,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ChecklistType = "opening" | "closing" | "shift" | "receiving" | "custom";

type ItemType = "boolean" | "temperature" | "number" | "text" | "photo" | "select";

interface ChecklistItem {
  id: string;
  checklist_id: string;
  label: string;
  description: string | null;
  item_type: ItemType;
  min_value: number | null;
  max_value: number | null;
  unit: string | null;
  options: string[] | null;
  use_regulatory_limits: boolean;
  regulatory_limit_field: string | null;
  is_required: boolean;
  sort_order: number;
  category: string | null;
}

interface HACCPChecklist {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  checklist_type: ChecklistType;
  frequency: string | null;
  assigned_roles: string[] | null;
  escalation_minutes: number | null;
  template_source: string | null;
  require_photo: boolean;
  require_signature: boolean;
  is_active: boolean;
  sort_order: number;
  checklist_items: ChecklistItem[];
}

interface ChecklistCompletion {
  id: string;
  restaurant_id: string;
  checklist_id: string;
  completed_by: string;
  responses: Record<string, unknown>;
  total_items: number;
  passed_items: number;
  failed_items: number;
  compliance_score: number;
  has_deviations: boolean;
  deviation_count: number;
  corrective_actions_required: number;
  completed_at: string;
  duration_seconds: number;
}

interface RegulatoryProfile {
  id: string;
  country_code: string;
  region_code: string | null;
  cold_holding_max_c: number | null;
  hot_holding_min_c: number | null;
  allergen_list: string[] | null;
  [key: string]: unknown;
}

interface ItemResponse {
  item_id: string;
  value: unknown;
  passed: boolean;
  deviation: boolean;
  deviation_note?: string;
}

type TabKey = "all" | "opening" | "closing" | "shift";

// ─── Component ───────────────────────────────────────────────────────────────

export function ChecklistHACCP() {
  const t = useTranslations("ChecklistHACCP");
  const { user, profile } = useAuth();

  // Data state
  const [checklists, setChecklists] = useState<HACCPChecklist[]>([]);
  const [completions, setCompletions] = useState<ChecklistCompletion[]>([]);
  const [regulatoryProfile, setRegulatoryProfile] = useState<RegulatoryProfile | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [executingChecklist, setExecutingChecklist] = useState<HACCPChecklist | null>(null);
  const [responses, setResponses] = useState<Record<string, ItemResponse>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completionResult, setCompletionResult] = useState<{
    passed: number;
    failed: number;
    score: number;
    deviations: number;
  } | null>(null);

  const startTimeRef = useRef<Date | null>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await fetch("/api/haccp-checklists", {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch checklists");
      const data = await res.json();
      setChecklists(data.checklists || []);
      setCompletions(data.completions || []);
      setRegulatoryProfile(data.regulatoryProfile || null);
      setStreak(data.streak || 0);
    } catch (err) {
      console.error("[ChecklistHACCP] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const isCompletedToday = (checklistId: string): boolean => {
    return completions.some((c) => c.checklist_id === checklistId);
  };

  const filteredChecklists = checklists.filter((cl) => {
    if (activeTab === "all") return true;
    return cl.checklist_type === activeTab;
  });

  const getTemperatureLimits = (
    item: ChecklistItem
  ): { min: number | null; max: number | null } => {
    if (item.use_regulatory_limits && regulatoryProfile && item.regulatory_limit_field) {
      const field = item.regulatory_limit_field;
      if (field === "cold_holding_max_c") {
        return { min: null, max: regulatoryProfile.cold_holding_max_c };
      }
      if (field === "hot_holding_min_c") {
        return { min: regulatoryProfile.hot_holding_min_c, max: null };
      }
      // Generic lookup
      const val = regulatoryProfile[field];
      if (typeof val === "number") {
        return { min: null, max: val };
      }
    }
    return { min: item.min_value, max: item.max_value };
  };

  const isValueInRange = (
    value: number,
    min: number | null,
    max: number | null
  ): boolean => {
    if (min !== null && value < min) return false;
    if (max !== null && value > max) return false;
    return true;
  };

  // ─── Execution Handlers ─────────────────────────────────────────────────────

  const startExecution = (checklist: HACCPChecklist) => {
    setExecutingChecklist(checklist);
    setCompletionResult(null);
    startTimeRef.current = new Date();

    // Initialize responses for all items
    const initialResponses: Record<string, ItemResponse> = {};
    for (const item of checklist.checklist_items) {
      initialResponses[item.id] = {
        item_id: item.id,
        value: item.item_type === "boolean" ? false : item.item_type === "select" ? "" : null,
        passed: true,
        deviation: false,
      };
    }
    setResponses(initialResponses);
  };

  const cancelExecution = () => {
    setExecutingChecklist(null);
    setResponses({});
    setCompletionResult(null);
    startTimeRef.current = null;
  };

  const updateResponse = (itemId: string, value: unknown) => {
    setResponses((prev) => {
      const item = executingChecklist?.checklist_items.find((i) => i.id === itemId);
      if (!item) return prev;

      let passed = true;
      let deviation = false;

      if (item.item_type === "boolean") {
        // Boolean: checked = pass
        passed = value === true;
        deviation = !passed;
      } else if (item.item_type === "temperature" || item.item_type === "number") {
        const numVal = typeof value === "string" ? parseFloat(value) : (value as number);
        if (!isNaN(numVal)) {
          const limits =
            item.item_type === "temperature"
              ? getTemperatureLimits(item)
              : { min: item.min_value, max: item.max_value };
          passed = isValueInRange(numVal, limits.min, limits.max);
          deviation = !passed;
        }
      }

      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          value,
          passed,
          deviation,
        },
      };
    });
  };

  const submitChecklist = async () => {
    if (!executingChecklist || !user || submitting) return;
    setSubmitting(true);

    const endTime = new Date();
    const durationSeconds = startTimeRef.current
      ? Math.round((endTime.getTime() - startTimeRef.current.getTime()) / 1000)
      : 0;

    const responseValues = Object.values(responses);
    const totalItems = responseValues.length;
    const passedItems = responseValues.filter((r) => r.passed).length;
    const failedItems = totalItems - passedItems;
    const deviationCount = responseValues.filter((r) => r.deviation).length;
    const complianceScore = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 100;

    const payload = {
      checklist_id: executingChecklist.id,
      responses: Object.fromEntries(
        responseValues.map((r) => [
          r.item_id,
          { value: r.value, passed: r.passed, deviation: r.deviation, deviation_note: r.deviation_note },
        ])
      ),
      total_items: totalItems,
      passed_items: passedItems,
      failed_items: failedItems,
      compliance_score: complianceScore,
      has_deviations: deviationCount > 0,
      deviation_count: deviationCount,
      corrective_actions_required: deviationCount,
      started_at: startTimeRef.current?.toISOString(),
      completed_at: endTime.toISOString(),
      duration_seconds: durationSeconds,
    };

    try {
      const res = await fetch("/api/haccp-checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error("[ChecklistHACCP] Submit error:", errData);
        return;
      }

      setCompletionResult({
        passed: passedItems,
        failed: failedItems,
        score: complianceScore,
        deviations: deviationCount,
      });

      // Refresh data so the list shows the new completion
      await fetchData();
    } catch (err) {
      console.error("[ChecklistHACCP] Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Tab Configuration ──────────────────────────────────────────────────────

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: t("tab_all") },
    { key: "opening", label: t("tab_opening") },
    { key: "closing", label: t("tab_closing") },
    { key: "shift", label: t("tab_shift") },
  ];

  // ─── Render: Loading ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#CC5833] animate-spin" />
      </div>
    );
  }

  // ─── Render: Execution Modal ────────────────────────────────────────────────

  if (executingChecklist) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Execution Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={cancelExecution}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-[#F2F0E9]" />
            </button>
            <div>
              <h2 className="font-jakarta text-xl font-bold text-[#F2F0E9]">
                {executingChecklist.name}
              </h2>
              <p className="font-outfit text-sm text-[#F2F0E9]/50">
                {executingChecklist.checklist_items.length} {t("items_count")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#CC5833]/10 border border-[#CC5833]/20">
            <Clock className="w-4 h-4 text-[#CC5833]" />
            <span className="font-plex-mono text-xs text-[#CC5833]">{t("in_progress")}</span>
          </div>
        </div>

        {/* Completion Summary (post-submit) */}
        {completionResult && (
          <div className="rounded-[2rem] noise-bg-subtle border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-3">
              {completionResult.score >= 80 ? (
                <CheckCircle2 className="w-8 h-8 text-[#2E4036]" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-[#CC5833]" />
              )}
              <h3 className="font-jakarta text-2xl font-bold text-[#F2F0E9]">
                {completionResult.score}% {t("compliance")}
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-2xl bg-[#2E4036]/20 border border-[#2E4036]/30">
                <p className="font-plex-mono text-2xl font-bold text-[#2E4036]">
                  {completionResult.passed}
                </p>
                <p className="font-outfit text-xs text-[#F2F0E9]/50 mt-1">{t("passed")}</p>
              </div>
              <div className="text-center p-4 rounded-2xl bg-[#CC5833]/10 border border-[#CC5833]/20">
                <p className="font-plex-mono text-2xl font-bold text-[#CC5833]">
                  {completionResult.failed}
                </p>
                <p className="font-outfit text-xs text-[#F2F0E9]/50 mt-1">{t("failed")}</p>
              </div>
              <div className="text-center p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <p className="font-plex-mono text-2xl font-bold text-amber-400">
                  {completionResult.deviations}
                </p>
                <p className="font-outfit text-xs text-[#F2F0E9]/50 mt-1">{t("deviations")}</p>
              </div>
            </div>
            <button
              onClick={cancelExecution}
              className="w-full py-3 rounded-2xl bg-[#2E4036] text-white font-jakarta font-semibold text-sm hover:bg-[#2E4036]/80 transition-colors"
            >
              {t("back_to_list")}
            </button>
          </div>
        )}

        {/* Checklist Items */}
        {!completionResult && (
          <div className="space-y-3">
            {executingChecklist.checklist_items.map((item, index) => {
              const response = responses[item.id];
              const isDeviation = response?.deviation;

              return (
                <div
                  key={item.id}
                  className={`rounded-[2rem] noise-bg-subtle border p-5 transition-colors ${
                    isDeviation
                      ? "border-[#CC5833]/40 bg-[#CC5833]/5"
                      : "border-white/10"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-plex-mono text-xs text-[#F2F0E9]/50">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-jakarta font-semibold text-[#F2F0E9]">{item.label}</p>
                        {item.description && (
                          <p className="font-outfit text-sm text-[#F2F0E9]/40 mt-0.5">
                            {item.description}
                          </p>
                        )}
                        {item.category && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-plex-mono text-[#F2F0E9]/40 uppercase tracking-wider">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {/* Render by item_type */}
                      {renderItemInput(item, response)}

                      {/* Deviation warning */}
                      {isDeviation && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#CC5833]/10 border border-[#CC5833]/20">
                          <AlertTriangle className="w-4 h-4 text-[#CC5833] flex-shrink-0" />
                          <span className="font-outfit text-xs text-[#CC5833]">
                            {t("out_of_range_warning")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Submit Button */}
            <button
              onClick={submitChecklist}
              disabled={submitting}
              className="w-full py-4 rounded-[2rem] bg-[#CC5833] text-white font-jakarta font-bold text-sm hover:bg-[#CC5833]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {t("submit_checklist")}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Render: Item Input ─────────────────────────────────────────────────────

  function renderItemInput(item: ChecklistItem, response: ItemResponse | undefined) {
    if (!response) return null;

    switch (item.item_type) {
      case "boolean":
        return (
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                response.value === true
                  ? "bg-[#2E4036] border-[#2E4036]"
                  : "border-white/20 group-hover:border-white/40"
              }`}
              onClick={() => updateResponse(item.id, !response.value)}
            >
              {response.value === true && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
            <span className="font-outfit text-sm text-[#F2F0E9]/70">{t("mark_complete")}</span>
          </label>
        );

      case "temperature": {
        const limits = getTemperatureLimits(item);
        const unit = item.unit || "°C";
        const numVal =
          response.value !== null && response.value !== undefined
            ? parseFloat(String(response.value))
            : NaN;
        const hasValue = !isNaN(numVal);
        const inRange = hasValue && isValueInRange(numVal, limits.min, limits.max);

        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ThermometerSun
                className={`w-5 h-5 flex-shrink-0 ${
                  hasValue ? (inRange ? "text-[#2E4036]" : "text-[#CC5833]") : "text-[#F2F0E9]/30"
                }`}
              />
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  value={response.value !== null && response.value !== undefined ? String(response.value) : ""}
                  onChange={(e) => updateResponse(item.id, e.target.value === "" ? null : e.target.value)}
                  placeholder={t("enter_temperature")}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 font-plex-mono text-sm text-[#F2F0E9] placeholder:text-[#F2F0E9]/20 outline-none transition-colors ${
                    hasValue
                      ? inRange
                        ? "border-[#2E4036]/40 focus:border-[#2E4036]"
                        : "border-[#CC5833]/40 focus:border-[#CC5833]"
                      : "border-white/10 focus:border-white/30"
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-plex-mono text-xs text-[#F2F0E9]/30">
                  {unit}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {limits.min !== null && (
                <span className="font-plex-mono text-[10px] text-[#F2F0E9]/30">
                  min: {limits.min}{unit}
                </span>
              )}
              {limits.max !== null && (
                <span className="font-plex-mono text-[10px] text-[#F2F0E9]/30">
                  max: {limits.max}{unit}
                </span>
              )}
            </div>
          </div>
        );
      }

      case "number": {
        const numVal =
          response.value !== null && response.value !== undefined
            ? parseFloat(String(response.value))
            : NaN;
        const hasValue = !isNaN(numVal);
        const inRange = hasValue && isValueInRange(numVal, item.min_value, item.max_value);

        return (
          <div className="space-y-2">
            <input
              type="number"
              step="any"
              value={response.value !== null && response.value !== undefined ? String(response.value) : ""}
              onChange={(e) => updateResponse(item.id, e.target.value === "" ? null : e.target.value)}
              placeholder={t("enter_value")}
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 font-plex-mono text-sm text-[#F2F0E9] placeholder:text-[#F2F0E9]/20 outline-none transition-colors ${
                hasValue
                  ? inRange
                    ? "border-[#2E4036]/40 focus:border-[#2E4036]"
                    : "border-[#CC5833]/40 focus:border-[#CC5833]"
                  : "border-white/10 focus:border-white/30"
              }`}
            />
            <div className="flex items-center gap-2">
              {item.min_value !== null && (
                <span className="font-plex-mono text-[10px] text-[#F2F0E9]/30">
                  min: {item.min_value}
                  {item.unit ? ` ${item.unit}` : ""}
                </span>
              )}
              {item.max_value !== null && (
                <span className="font-plex-mono text-[10px] text-[#F2F0E9]/30">
                  max: {item.max_value}
                  {item.unit ? ` ${item.unit}` : ""}
                </span>
              )}
            </div>
          </div>
        );
      }

      case "text":
        return (
          <textarea
            value={typeof response.value === "string" ? response.value : ""}
            onChange={(e) => updateResponse(item.id, e.target.value)}
            placeholder={t("enter_notes")}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-outfit text-sm text-[#F2F0E9] placeholder:text-[#F2F0E9]/20 outline-none focus:border-white/30 transition-colors resize-none"
          />
        );

      case "photo":
        return (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <Camera className="w-4 h-4 text-[#F2F0E9]/50" />
              <span className="font-outfit text-sm text-[#F2F0E9]/70">{t("take_photo")}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    updateResponse(item.id, file.name);
                  }
                }}
              />
            </label>
            {response.value != null && response.value !== "" && (
              <span className="font-plex-mono text-xs text-[#2E4036]">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                {t("photo_attached")}
              </span>
            )}
          </div>
        );

      case "select":
        return (
          <select
            value={typeof response.value === "string" ? response.value : ""}
            onChange={(e) => updateResponse(item.id, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-outfit text-sm text-[#F2F0E9] outline-none focus:border-white/30 transition-colors appearance-none"
          >
            <option value="" className="bg-[#1A1A1A]">
              {t("select_option")}
            </option>
            {(item.options || []).map((opt) => (
              <option key={opt} value={opt} className="bg-[#1A1A1A]">
                {opt}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  }

  // ─── Render: Checklist List ─────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Streak & Stats Banner */}
      <div className="rounded-[2rem] noise-bg-subtle border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#CC5833]/10 border border-[#CC5833]/20 flex items-center justify-center">
              <Flame className="w-7 h-7 text-[#CC5833]" />
            </div>
            <div>
              <p className="font-outfit text-sm text-[#F2F0E9]/50">{t("compliance_streak")}</p>
              <p className="font-jakarta text-3xl font-bold text-[#F2F0E9]">
                {streak} <span className="text-lg text-[#F2F0E9]/40">{t("days")}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-plex-mono text-xs text-[#F2F0E9]/30 uppercase tracking-wider">
              {t("today_progress")}
            </p>
            <p className="font-plex-mono text-lg font-bold text-[#F2F0E9]">
              {checklists.filter((cl) => isCompletedToday(cl.id)).length}
              <span className="text-[#F2F0E9]/30">/{checklists.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full font-outfit text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-[#CC5833] text-white"
                : "bg-white/5 text-[#F2F0E9]/50 hover:bg-white/10 hover:text-[#F2F0E9]/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Checklist Cards */}
      {filteredChecklists.length === 0 ? (
        <div className="rounded-[2rem] noise-bg-subtle border border-white/10 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-[#F2F0E9]/20 mx-auto mb-4" />
          <p className="font-jakarta font-semibold text-[#F2F0E9]/50">{t("no_checklists")}</p>
          <p className="font-outfit text-sm text-[#F2F0E9]/30 mt-1">{t("no_checklists_hint")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChecklists.map((checklist) => {
            const completed = isCompletedToday(checklist.id);
            const todayCompletion = completions.find(
              (c) => c.checklist_id === checklist.id
            );

            return (
              <button
                key={checklist.id}
                onClick={() => !completed && startExecution(checklist)}
                disabled={completed}
                className={`w-full text-left rounded-[2rem] noise-bg-subtle border p-5 transition-all ${
                  completed
                    ? "border-[#2E4036]/30 opacity-80"
                    : "border-white/10 hover:border-[#CC5833]/30 hover:shadow-lg hover:shadow-[#CC5833]/5 active:scale-[0.99]"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      completed
                        ? "bg-[#2E4036]/20 border border-[#2E4036]/30"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 className="w-6 h-6 text-[#2E4036]" />
                    ) : (
                      <ClipboardList className="w-6 h-6 text-[#F2F0E9]/40" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-jakarta font-bold text-[#F2F0E9] truncate">
                        {checklist.name}
                      </h3>
                      <span
                        className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-plex-mono uppercase tracking-wider ${
                          checklist.checklist_type === "opening"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : checklist.checklist_type === "closing"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : checklist.checklist_type === "shift"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : checklist.checklist_type === "receiving"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-white/5 text-[#F2F0E9]/40 border border-white/10"
                        }`}
                      >
                        {t(`type_${checklist.checklist_type}`)}
                      </span>
                    </div>
                    {checklist.description && (
                      <p className="font-outfit text-sm text-[#F2F0E9]/40 mt-0.5 truncate">
                        {checklist.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="font-plex-mono text-[10px] text-[#F2F0E9]/30">
                        {checklist.checklist_items.length} {t("items_count")}
                      </span>
                      {completed && todayCompletion && (
                        <span className="font-plex-mono text-[10px] text-[#2E4036]">
                          {todayCompletion.compliance_score}% {t("compliance")}
                        </span>
                      )}
                      {completed && todayCompletion && todayCompletion.has_deviations && (
                        <span className="flex items-center gap-1 font-plex-mono text-[10px] text-[#CC5833]">
                          <AlertTriangle className="w-3 h-3" />
                          {todayCompletion.deviation_count} {t("deviations")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  {!completed && (
                    <ChevronRight className="w-5 h-5 text-[#F2F0E9]/20 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
