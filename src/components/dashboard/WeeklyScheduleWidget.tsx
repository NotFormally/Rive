"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

type Shift = {
  day: string;
  date: string;
  start?: string;
  role?: string;
  active?: boolean;
};

type TimeWindow = "week" | "month" | "all";

export function WeeklyScheduleWidget() {
  const t = useTranslations("Dashboard");

  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Shift | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form state for add-availability modal
  const [newShift, setNewShift] = useState({ day: "", start: "", end: "", role: "" });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  // Mock shift data
  const [shifts, setShifts] = useState<Shift[]>([
    { day: t("schedule_day_mon"), date: "17", start: "8:00 AM", role: t("schedule_role_server") },
    { day: t("schedule_day_tue"), date: "18", start: "10:00 AM", role: t("schedule_role_server") },
    { day: t("schedule_day_wed"), date: "19" },
    { day: t("schedule_day_thu"), date: "20", start: "10:00 AM", role: t("schedule_role_server") },
    { day: t("schedule_day_fri"), date: "21", start: "10:00 PM", role: t("schedule_role_bartender"), active: true },
    { day: t("schedule_day_sat"), date: "22", role: t("schedule_role_server") },
  ]);

  // Active/highlighted day (first with a shift)
  const activeDay = shifts.find((s) => s.start);

  const timeWindowLabels: Record<TimeWindow, string> = {
    week: t("schedule_this_week"),
    month: t("schedule_this_month"),
    all: t("all_months"),
  };

  const dayOptions = [
    t("schedule_day_mon"),
    t("schedule_day_tue"),
    t("schedule_day_wed"),
    t("schedule_day_thu"),
    t("schedule_day_fri"),
    t("schedule_day_sat"),
    t("schedule_day_sun"),
  ];

  function handleAddShift() {
    if (!newShift.day || !newShift.start || !newShift.end) return;
    setShifts((prev) => [
      ...prev,
      {
        day: newShift.day,
        date: "--",
        start: `${newShift.start} - ${newShift.end}`,
        role: newShift.role || t("schedule_role_server"),
      },
    ]);
    setNewShift({ day: "", start: "", end: "", role: "" });
    setAddModalOpen(false);
  }

  return (
    <>
      <section className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 md:p-8 relative transition-all duration-300 group">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[11px] font-plex-mono font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            {t("weekly_schedule")}
          </h2>

          {/* Time-window dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="bg-secondary/40 text-xs px-3 py-1 rounded-full text-muted-foreground border border-white/5 hover:border-primary/20 transition-colors cursor-pointer flex items-center gap-1"
            >
              {timeWindowLabels[timeWindow]} <span className="text-[9px]">▼</span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-card border border-border/50 rounded-xl shadow-lg py-1 min-w-[140px]">
                {(Object.keys(timeWindowLabels) as TimeWindow[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTimeWindow(key);
                      setDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-xs transition-colors ${
                      timeWindow === key
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                    }`}
                  >
                    {timeWindowLabels[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Day cards */}
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar-hidden items-end">
          {/* Active day highlight */}
          {activeDay && (
            <button
              onClick={() => setSelectedDay(activeDay)}
              className="relative shrink-0 w-32 bg-[--sidebar-primary] border border-primary/40 rounded-3xl p-4 shadow-[0_0_25px_rgba(0,229,255,0.15)] overflow-hidden text-left cursor-pointer hover:border-primary/60 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none"></div>
              <div className="relative z-10">
                <span className="text-primary text-sm font-jakarta font-medium">{activeDay.day}</span>
                <div className="w-8 h-px bg-primary/30 my-2"></div>
                <div className="text-[10px] text-primary/80 mb-2">{activeDay.start}</div>
                <div className="bg-primary/20 text-primary text-[10px] w-fit px-2 py-0.5 rounded-md mt-1 backdrop-blur-md border border-primary/20">
                  {activeDay.role}
                </div>
              </div>
            </button>
          )}

          {/* Other days */}
          {shifts
            .filter((s) => s !== activeDay)
            .map((d, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(d)}
                className="flex flex-col items-center gap-2 shrink-0 w-16 opacity-90 transition-opacity hover:opacity-100 cursor-pointer text-center"
              >
                <div className="text-xs text-slate-400 font-medium">{d.day}</div>
                <div className="text-lg font-jakarta font-bold text-slate-100">{d.date}</div>
                {d.start && (
                  <div
                    className={`mt-2 p-2 rounded-xl text-[10px] w-full text-center border font-medium ${
                      d.active
                        ? "bg-pink-500/20 border-pink-400/50 text-pink-300 shadow-[0_0_15px_rgba(255,0,122,0.25)]"
                        : "bg-slate-800/60 border-slate-600/50 text-slate-200 shadow-sm"
                    }`}
                  >
                    {d.start}
                    <div className="mt-1 opacity-80">{d.role}</div>
                  </div>
                )}
              </button>
            ))}
        </div>

        {/* Add availability button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shadow-[0_0_15px_rgba(0,229,255,0.3)] font-bold"
          >
            {t("add_availability")}
          </Button>
        </div>
      </section>

      {/* Day detail modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-jakarta font-bold text-foreground">
                {t("schedule_day_detail")} — {selectedDay.day} {selectedDay.date}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            {selectedDay.start ? (
              <div className="space-y-3">
                <div className="bg-secondary/30 border border-border/30 rounded-xl p-4">
                  <div className="text-sm font-medium text-foreground">{selectedDay.role}</div>
                  <div className="text-xs text-muted-foreground mt-1">{selectedDay.start}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("schedule_no_shifts")}</p>
            )}

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedDay(null)} className="rounded-full">
                {t("schedule_close")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add availability modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAddModalOpen(false)}>
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-jakarta font-bold text-foreground">{t("schedule_add_title")}</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Day selector */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("schedule_add_day")}</label>
                <select
                  value={newShift.day}
                  onChange={(e) => setNewShift((s) => ({ ...s, day: e.target.value }))}
                  className="w-full bg-secondary/30 border border-border/30 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                >
                  <option value="">—</option>
                  {dayOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Start time */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("schedule_add_start")}</label>
                <input
                  type="time"
                  value={newShift.start}
                  onChange={(e) => setNewShift((s) => ({ ...s, start: e.target.value }))}
                  className="w-full bg-secondary/30 border border-border/30 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* End time */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("schedule_add_end")}</label>
                <input
                  type="time"
                  value={newShift.end}
                  onChange={(e) => setNewShift((s) => ({ ...s, end: e.target.value }))}
                  className="w-full bg-secondary/30 border border-border/30 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Role */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("schedule_add_role")}</label>
                <input
                  type="text"
                  value={newShift.role}
                  onChange={(e) => setNewShift((s) => ({ ...s, role: e.target.value }))}
                  placeholder={t("schedule_role_server")}
                  className="w-full bg-secondary/30 border border-border/30 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAddModalOpen(false)} className="rounded-full">
                {t("schedule_close")}
              </Button>
              <Button
                onClick={handleAddShift}
                disabled={!newShift.day || !newShift.start || !newShift.end}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_0_15px_rgba(0,229,255,0.3)] font-bold"
              >
                {t("schedule_add_submit")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
