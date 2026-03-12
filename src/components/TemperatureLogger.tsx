"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import {
  ThermometerSun,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  X,
  Bell,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
  Flame,
  Truck,
  ChefHat,
  Refrigerator,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type EquipmentType = "cooler" | "freezer" | "hot_holding" | "cooking" | "receiving" | "other";
type TempUnit = "°C" | "°F";
type AlertSeverity = "warning" | "critical" | "emergency";
type AlertStatus = "open" | "acknowledged" | "resolved" | "escalated";

interface RegulatoryProfile {
  id: string;
  cold_holding_max_c: number | null;
  hot_holding_min_c: number | null;
  cooking_min_c: Record<string, number> | null;
  danger_zone_min_c: number | null;
  danger_zone_max_c: number | null;
  [key: string]: unknown;
}

interface TemperatureLog {
  id: string;
  restaurant_id: string;
  logged_by: string;
  equipment_name: string;
  equipment_type: EquipmentType;
  location: string | null;
  temperature_c: number;
  unit: TempUnit;
  min_acceptable: number | null;
  max_acceptable: number | null;
  is_within_limits: boolean;
  deviation_c: number | null;
  source: string;
  food_item: string | null;
  notes: string | null;
  created_at: string;
}

interface TemperatureAlert {
  id: string;
  restaurant_id: string;
  temperature_log_id: string;
  severity: AlertSeverity;
  alert_type: string;
  message: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  corrective_action: string | null;
  status: AlertStatus;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cToF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

function fToC(f: number): number {
  return Math.round(((f - 32) * 5) / 9 * 10) / 10;
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const EQUIPMENT_ICONS: Record<EquipmentType, typeof Snowflake> = {
  cooler: Refrigerator,
  freezer: Snowflake,
  hot_holding: Flame,
  cooking: ChefHat,
  receiving: Truck,
  other: ThermometerSun,
};

// ─── Component ───────────────────────────────────────────────────────────────

export function TemperatureLogger() {
  const t = useTranslations("TemperatureLogger");
  const { user, profile } = useAuth();

  // Data state
  const [logs, setLogs] = useState<TemperatureLog[]>([]);
  const [alerts, setAlerts] = useState<TemperatureAlert[]>([]);
  const [regulatoryProfile, setRegulatoryProfile] = useState<RegulatoryProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick-log form state
  const [temperature, setTemperature] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [equipmentType, setEquipmentType] = useState<EquipmentType>("cooler");
  const [location, setLocation] = useState("");
  const [foodItem, setFoodItem] = useState("");
  const [unit, setUnit] = useState<TempUnit>("°C");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Equipment quick-add
  const [savedEquipment, setSavedEquipment] = useState<string[]>([]);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEquipmentName, setNewEquipmentName] = useState("");

  // Alerts panel
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [alertSubmitting, setAlertSubmitting] = useState(false);

  const tempInputRef = useRef<HTMLInputElement>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await fetch("/api/temperature-logs", {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch temperature data");
      const data = await res.json();
      setLogs(data.logs || []);
      setAlerts(data.alerts || []);
      setRegulatoryProfile(data.regulatoryProfile || null);

      // Build saved equipment list from recent logs
      const equipmentNames = new Set<string>();
      for (const log of data.logs || []) {
        if (log.equipment_name) equipmentNames.add(log.equipment_name);
      }
      setSavedEquipment(Array.from(equipmentNames));
    } catch (err) {
      console.error("[TemperatureLogger] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Temperature Validation ─────────────────────────────────────────────────

  const getTemperatureC = (): number | null => {
    const val = parseFloat(temperature);
    if (isNaN(val)) return null;
    return unit === "°F" ? fToC(val) : val;
  };

  const getLimits = (): { min: number | null; max: number | null } => {
    if (!regulatoryProfile) return { min: null, max: null };

    switch (equipmentType) {
      case "cooler":
      case "receiving":
        return { min: null, max: regulatoryProfile.cold_holding_max_c };
      case "freezer":
        return { min: null, max: regulatoryProfile.cold_holding_max_c != null ? -18 : null };
      case "hot_holding":
        return { min: regulatoryProfile.hot_holding_min_c, max: null };
      case "cooking": {
        if (foodItem && regulatoryProfile.cooking_min_c) {
          const cookingMin = regulatoryProfile.cooking_min_c[foodItem];
          if (typeof cookingMin === "number") {
            return { min: cookingMin, max: null };
          }
        }
        // Default cooking minimum
        return { min: regulatoryProfile.cooking_min_c ? 74 : null, max: null };
      }
      default:
        return { min: null, max: null };
    }
  };

  const limits = getLimits();

  const isWithinLimits = (): boolean | null => {
    const tempC = getTemperatureC();
    if (tempC === null) return null;
    if (limits.min !== null && tempC < limits.min) return false;
    if (limits.max !== null && tempC > limits.max) return false;
    return true;
  };

  const getDeviation = (): number | null => {
    const tempC = getTemperatureC();
    if (tempC === null) return null;
    if (limits.min !== null && tempC < limits.min) return Math.round((limits.min - tempC) * 10) / 10;
    if (limits.max !== null && tempC > limits.max) return Math.round((tempC - limits.max) * 10) / 10;
    return null;
  };

  const getSeverity = (deviationC: number): AlertSeverity => {
    if (deviationC > 5) return "emergency";
    if (deviationC >= 2) return "critical";
    return "warning";
  };

  const displayLimit = (value: number | null, type: "min" | "max"): string | null => {
    if (value === null) return null;
    if (unit === "°F") return `${type === "min" ? "Min" : "Max"}: ${cToF(value)}°F`;
    return `${type === "min" ? "Min" : "Max"}: ${value}°C`;
  };

  const withinLimitsStatus = isWithinLimits();
  const hasTemp = temperature !== "" && !isNaN(parseFloat(temperature));

  // ─── Submit Handler ─────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!user || submitting || !hasTemp || !equipmentName.trim()) return;
    setSubmitting(true);

    const tempC = getTemperatureC()!;
    const deviation = getDeviation();
    const withinLimits = isWithinLimits() ?? true;

    const payload = {
      equipment_name: equipmentName.trim(),
      equipment_type: equipmentType,
      location: location.trim() || null,
      temperature_c: tempC,
      unit,
      min_acceptable: limits.min,
      max_acceptable: limits.max,
      is_within_limits: withinLimits,
      deviation_c: deviation,
      source: "manual",
      food_item: (equipmentType === "cooking" || equipmentType === "receiving") ? foodItem.trim() || null : null,
      notes: notes.trim() || null,
    };

    try {
      const res = await fetch("/api/temperature-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error("[TemperatureLogger] Submit error:", errData);
        return;
      }

      // Reset form
      setTemperature("");
      setNotes("");
      setFoodItem("");
      setShowNotes(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 2000);

      // Refresh data
      await fetchData();

      // Focus back to temperature input for quick next entry
      tempInputRef.current?.focus();
    } catch (err) {
      console.error("[TemperatureLogger] Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Alert Handlers ─────────────────────────────────────────────────────────

  const handleAcknowledge = async (alertId: string) => {
    setAlertSubmitting(true);
    try {
      const res = await fetch("/api/temperature-alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: alertId, action: "acknowledge" }),
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error("[TemperatureLogger] Acknowledge error:", err);
    } finally {
      setAlertSubmitting(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    if (!correctiveAction.trim()) return;
    setAlertSubmitting(true);
    try {
      const res = await fetch("/api/temperature-alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_id: alertId,
          action: "resolve",
          corrective_action: correctiveAction.trim(),
        }),
      });
      if (res.ok) {
        setResolvingAlertId(null);
        setCorrectiveAction("");
        await fetchData();
      }
    } catch (err) {
      console.error("[TemperatureLogger] Resolve error:", err);
    } finally {
      setAlertSubmitting(false);
    }
  };

  // ─── Equipment Management ───────────────────────────────────────────────────

  const addEquipment = () => {
    if (!newEquipmentName.trim()) return;
    const name = newEquipmentName.trim();
    if (!savedEquipment.includes(name)) {
      setSavedEquipment((prev) => [name, ...prev]);
    }
    setEquipmentName(name);
    setNewEquipmentName("");
    setShowAddEquipment(false);
  };

  // ─── Unit Toggle ────────────────────────────────────────────────────────────

  const toggleUnit = () => {
    const val = parseFloat(temperature);
    if (!isNaN(val)) {
      if (unit === "°C") {
        setTemperature(String(cToF(val)));
        setUnit("°F");
      } else {
        setTemperature(String(fToC(val)));
        setUnit("°C");
      }
    } else {
      setUnit((prev) => (prev === "°C" ? "°F" : "°C"));
    }
  };

  // ─── Render: Loading ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#CC5833] animate-spin" />
      </div>
    );
  }

  const openAlerts = alerts.filter((a) => a.status === "open" || a.status === "acknowledged");
  const EquipmentIcon = EQUIPMENT_ICONS[equipmentType] || ThermometerSun;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ━━━ Open Alerts Banner ━━━ */}
      {openAlerts.length > 0 && (
        <button
          onClick={() => setAlertsExpanded(!alertsExpanded)}
          className="w-full rounded-[2rem] noise-bg-subtle border border-[#CC5833]/30 bg-[#CC5833]/5 p-4 flex items-center justify-between transition-colors hover:border-[#CC5833]/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#CC5833]/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#CC5833]" />
            </div>
            <div className="text-left">
              <p className="font-jakarta font-bold text-[#CC5833]">
                {openAlerts.length} {t("open_alerts")}
              </p>
              <p className="font-outfit text-xs text-[#F2F0E9]/40">
                {t("tap_to_manage")}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#CC5833] transition-transform ${
              alertsExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* ━━━ Alerts Panel (Expanded) ━━━ */}
      {alertsExpanded && openAlerts.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {openAlerts.map((alert) => {
            const isResolving = resolvingAlertId === alert.id;
            const severityColors: Record<AlertSeverity, string> = {
              warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
              critical: "bg-orange-500/10 border-orange-500/20 text-orange-400",
              emergency: "bg-red-500/10 border-red-500/20 text-red-400",
            };

            return (
              <div
                key={alert.id}
                className="rounded-[2rem] noise-bg-subtle border border-white/10 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <ShieldAlert
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        alert.severity === "emergency"
                          ? "text-red-400"
                          : alert.severity === "critical"
                            ? "text-orange-400"
                            : "text-amber-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-plex-mono uppercase tracking-wider border ${
                            severityColors[alert.severity]
                          }`}
                        >
                          {t(`severity_${alert.severity}`)}
                        </span>
                        <span className="font-plex-mono text-[10px] text-[#F2F0E9]/30">
                          {formatTime(alert.created_at)}
                        </span>
                      </div>
                      <p className="font-outfit text-sm text-[#F2F0E9]/70 mt-1">
                        {alert.message}
                      </p>
                      {alert.status === "acknowledged" && (
                        <p className="font-plex-mono text-[10px] text-[#F2F0E9]/30 mt-1">
                          {t("acknowledged")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resolve form */}
                {isResolving ? (
                  <div className="space-y-2">
                    <textarea
                      value={correctiveAction}
                      onChange={(e) => setCorrectiveAction(e.target.value)}
                      placeholder={t("corrective_action_placeholder")}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-outfit text-sm text-[#F2F0E9] placeholder:text-[#F2F0E9]/20 outline-none focus:border-[#CC5833]/40 transition-colors resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolve(alert.id)}
                        disabled={!correctiveAction.trim() || alertSubmitting}
                        className="flex-1 py-2.5 rounded-xl bg-[#2E4036] text-white font-jakarta font-semibold text-sm hover:bg-[#2E4036]/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {alertSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        {t("resolve")}
                      </button>
                      <button
                        onClick={() => {
                          setResolvingAlertId(null);
                          setCorrectiveAction("");
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#F2F0E9]/50 font-outfit text-sm hover:bg-white/10 transition-colors"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {alert.status === "open" && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={alertSubmitting}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#F2F0E9]/70 font-outfit text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {t("acknowledge")}
                      </button>
                    )}
                    <button
                      onClick={() => setResolvingAlertId(alert.id)}
                      className="flex-1 py-2.5 rounded-xl bg-[#2E4036]/20 border border-[#2E4036]/30 text-[#2E4036] font-jakarta font-semibold text-sm hover:bg-[#2E4036]/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {t("resolve")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ━━━ Quick Log Section ━━━ */}
      <div className="rounded-[2rem] noise-bg-subtle border border-white/10 p-6 space-y-5">
        {/* Temperature Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EquipmentIcon className="w-5 h-5 text-[#F2F0E9]/40" />
              <span className="font-outfit text-sm text-[#F2F0E9]/50">
                {t("temperature_reading")}
              </span>
            </div>
            {/* Limit display */}
            <div className="flex items-center gap-2">
              {displayLimit(limits.min, "min") && (
                <span className="font-plex-mono text-[10px] text-[#F2F0E9]/30 px-2 py-1 rounded-lg bg-white/5">
                  {displayLimit(limits.min, "min")}
                </span>
              )}
              {displayLimit(limits.max, "max") && (
                <span className="font-plex-mono text-[10px] text-[#F2F0E9]/30 px-2 py-1 rounded-lg bg-white/5">
                  {displayLimit(limits.max, "max")}
                </span>
              )}
            </div>
          </div>

          {/* Big Temperature Input */}
          <div
            className={`relative rounded-2xl border-2 transition-all ${
              hasTemp
                ? withinLimitsStatus === true
                  ? "border-[#2E4036]/60 shadow-[0_0_20px_rgba(46,64,54,0.15)]"
                  : withinLimitsStatus === false
                    ? "border-[#CC5833]/60 shadow-[0_0_20px_rgba(204,88,51,0.2)]"
                    : "border-white/20"
                : "border-white/10"
            }`}
          >
            <div className="flex items-center">
              <input
                ref={tempInputRef}
                type="number"
                inputMode="decimal"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent px-6 py-5 font-plex-mono text-5xl font-bold text-[#F2F0E9] placeholder:text-[#F2F0E9]/10 outline-none w-full min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={toggleUnit}
                className="flex-shrink-0 mr-4 px-3 py-2 rounded-xl bg-white/5 border border-white/10 font-plex-mono text-lg font-bold text-[#F2F0E9]/50 hover:bg-white/10 hover:text-[#F2F0E9] transition-colors active:scale-95"
              >
                {unit}
              </button>
            </div>

            {/* Status indicator bar */}
            {hasTemp && (
              <div
                className={`h-1 rounded-b-2xl transition-colors ${
                  withinLimitsStatus === true
                    ? "bg-[#2E4036]"
                    : withinLimitsStatus === false
                      ? "bg-[#CC5833]"
                      : "bg-white/10"
                }`}
              />
            )}
          </div>

          {/* Out-of-limit warning */}
          {hasTemp && withinLimitsStatus === false && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#CC5833]/10 border border-[#CC5833]/20 animate-in fade-in duration-300">
              <AlertTriangle className="w-4 h-4 text-[#CC5833] flex-shrink-0" />
              <span className="font-outfit text-sm text-[#CC5833]">
                {t("out_of_limits")}{" "}
                <span className="font-plex-mono font-bold">
                  {getDeviation() !== null ? `${getDeviation()}°C ${t("deviation")}` : ""}
                </span>
              </span>
            </div>
          )}

          {/* Within limits confirmation */}
          {hasTemp && withinLimitsStatus === true && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E4036]/10 border border-[#2E4036]/20 animate-in fade-in duration-300">
              <CheckCircle2 className="w-4 h-4 text-[#2E4036] flex-shrink-0" />
              <span className="font-outfit text-sm text-[#2E4036]">
                {t("within_limits")}
              </span>
            </div>
          )}
        </div>

        {/* Equipment & Type Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Equipment Name */}
          <div className="space-y-1.5">
            <label className="font-outfit text-xs text-[#F2F0E9]/40 uppercase tracking-wider">
              {t("equipment")}
            </label>
            {showAddEquipment ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newEquipmentName}
                  onChange={(e) => setNewEquipmentName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEquipment()}
                  placeholder={t("equipment_name_placeholder")}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-outfit text-sm text-[#F2F0E9] placeholder:text-[#F2F0E9]/20 outline-none focus:border-[#CC5833]/40 transition-colors"
                  autoFocus
                />
                <button
                  onClick={addEquipment}
                  className="p-2.5 rounded-xl bg-[#CC5833] text-white hover:bg-[#CC5833]/80 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowAddEquipment(false);
                    setNewEquipmentName("");
                  }}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#F2F0E9]/50 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={equipmentName}
                  onChange={(e) => setEquipmentName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-outfit text-sm text-[#F2F0E9] outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#1A1A1A]">
                    {t("select_equipment")}
                  </option>
                  {savedEquipment.map((name) => (
                    <option key={name} value={name} className="bg-[#1A1A1A]">
                      {name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowAddEquipment(true)}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#F2F0E9]/50 hover:bg-white/10 hover:text-[#F2F0E9] transition-colors"
                  title={t("add_equipment")}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Equipment Type */}
          <div className="space-y-1.5">
            <label className="font-outfit text-xs text-[#F2F0E9]/40 uppercase tracking-wider">
              {t("equipment_type")}
            </label>
            <select
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value as EquipmentType)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-outfit text-sm text-[#F2F0E9] outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
            >
              <option value="cooler" className="bg-[#1A1A1A]">{t("type_cooler")}</option>
              <option value="freezer" className="bg-[#1A1A1A]">{t("type_freezer")}</option>
              <option value="hot_holding" className="bg-[#1A1A1A]">{t("type_hot_holding")}</option>
              <option value="cooking" className="bg-[#1A1A1A]">{t("type_cooking")}</option>
              <option value="receiving" className="bg-[#1A1A1A]">{t("type_receiving")}</option>
              <option value="other" className="bg-[#1A1A1A]">{t("type_other")}</option>
            </select>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="font-outfit text-xs text-[#F2F0E9]/40 uppercase tracking-wider">
            {t("location")}
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("location_placeholder")}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-outfit text-sm text-[#F2F0E9] placeholder:text-[#F2F0E9]/20 outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Food Item (cooking / receiving only) */}
        {(equipmentType === "cooking" || equipmentType === "receiving") && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="font-outfit text-xs text-[#F2F0E9]/40 uppercase tracking-wider">
              {t("food_item")}
            </label>
            <input
              type="text"
              value={foodItem}
              onChange={(e) => setFoodItem(e.target.value)}
              placeholder={t("food_item_placeholder")}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-outfit text-sm text-[#F2F0E9] placeholder:text-[#F2F0E9]/20 outline-none focus:border-white/30 transition-colors"
            />
          </div>
        )}

        {/* Notes Toggle */}
        {!showNotes ? (
          <button
            onClick={() => setShowNotes(true)}
            className="text-[#F2F0E9]/30 font-outfit text-sm hover:text-[#F2F0E9]/60 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("add_notes")}
          </button>
        ) : (
          <div className="space-y-1.5 animate-in fade-in duration-300">
            <label className="font-outfit text-xs text-[#F2F0E9]/40 uppercase tracking-wider">
              {t("notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notes_placeholder")}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-outfit text-sm text-[#F2F0E9] placeholder:text-[#F2F0E9]/20 outline-none focus:border-white/30 transition-colors resize-none"
            />
          </div>
        )}

        {/* Log Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !hasTemp || !equipmentName.trim()}
          className={`w-full py-4 rounded-[2rem] font-jakarta font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
            submitSuccess
              ? "bg-[#2E4036] text-white"
              : "bg-[#CC5833] text-white hover:bg-[#CC5833]/90 disabled:opacity-40 disabled:cursor-not-allowed"
          }`}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("logging")}
            </>
          ) : submitSuccess ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {t("logged_success")}
            </>
          ) : (
            <>
              <ThermometerSun className="w-5 h-5" />
              {t("log_temperature")}
            </>
          )}
        </button>
      </div>

      {/* ━━━ Recent Logs ━━━ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-jakarta font-bold text-lg text-[#F2F0E9]">
            {t("todays_logs")}
          </h2>
          <span className="font-plex-mono text-xs text-[#F2F0E9]/30">
            {logs.length} {t("entries")}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="rounded-[2rem] noise-bg-subtle border border-white/10 p-12 text-center">
            <ThermometerSun className="w-12 h-12 text-[#F2F0E9]/20 mx-auto mb-4" />
            <p className="font-jakarta font-semibold text-[#F2F0E9]/50">
              {t("no_logs_yet")}
            </p>
            <p className="font-outfit text-sm text-[#F2F0E9]/30 mt-1">
              {t("no_logs_hint")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const LogIcon = EQUIPMENT_ICONS[log.equipment_type] || ThermometerSun;
              const displayTemp =
                log.unit === "°F" ? `${cToF(log.temperature_c)}°F` : `${log.temperature_c}°C`;

              return (
                <div
                  key={log.id}
                  className={`rounded-2xl noise-bg-subtle border p-4 flex items-center gap-4 transition-colors ${
                    log.is_within_limits
                      ? "border-white/10"
                      : "border-[#CC5833]/20 bg-[#CC5833]/5"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      log.is_within_limits
                        ? "bg-[#2E4036]/20 border border-[#2E4036]/30"
                        : "bg-[#CC5833]/10 border border-[#CC5833]/20"
                    }`}
                  >
                    <LogIcon
                      className={`w-5 h-5 ${
                        log.is_within_limits ? "text-[#2E4036]" : "text-[#CC5833]"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-jakarta font-semibold text-sm text-[#F2F0E9] truncate">
                        {log.equipment_name}
                      </span>
                      {log.food_item && (
                        <span className="font-outfit text-xs text-[#F2F0E9]/30 truncate">
                          — {log.food_item}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-[#F2F0E9]/20" />
                      <span className="font-plex-mono text-[10px] text-[#F2F0E9]/30">
                        {formatTime(log.created_at)}
                      </span>
                      {log.location && (
                        <span className="font-plex-mono text-[10px] text-[#F2F0E9]/20">
                          {log.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Temperature & Status */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`font-plex-mono text-lg font-bold ${
                        log.is_within_limits ? "text-[#2E4036]" : "text-[#CC5833]"
                      }`}
                    >
                      {displayTemp}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-lg text-[10px] font-plex-mono uppercase tracking-wider ${
                        log.is_within_limits
                          ? "bg-[#2E4036]/20 text-[#2E4036] border border-[#2E4036]/30"
                          : "bg-[#CC5833]/10 text-[#CC5833] border border-[#CC5833]/20"
                      }`}
                    >
                      {log.is_within_limits ? t("pass") : t("fail")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
