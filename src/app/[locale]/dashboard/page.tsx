"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmartLogbook } from "@/components/SmartLogbook";
import { DailyInsight } from "@/components/DailyInsight";
import { SocialProofBanner } from "@/components/SocialProofBanner";
import { useTranslations, useLocale } from "next-intl";
import { 
  Camera, 
  MenuSquare, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  Circle,
  FileText,
  Activity,
  Award,
  ArrowRight,
  Zap,
  Droplets
} from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const { user, profile, settings, usage, subscription, intelligenceScore, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    menuItems: 0,
    teamMembers: 1, // at least the owner
    integrations: 0,
    electricity_price: 0.15,
    water_price: 0.003,
    monthly_electricity: 7350,
    monthly_water: 126000
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;
    setLoadingStats(true);

    try {
      // Run all 3 count queries in parallel instead of sequentially
      const [menuResult, teamResult, intResult] = await Promise.all([
        supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('restaurant_id', profile.id),
        supabase.from('restaurant_members').select('*', { count: 'exact', head: true }).eq('restaurant_id', profile.id),
        supabase.from('restaurant_integrations').select('*', { count: 'exact', head: true }).eq('restaurant_id', profile.id),
      ]);

      setStats({
        menuItems: menuResult.count || 0,
        teamMembers: teamResult.count || 1,
        integrations: intResult.count || 0,
        electricity_price: (profile as any).electricity_price_kwh || 0.15,
        water_price: (profile as any).water_price_l || 0.003,
        monthly_electricity: (profile as any).monthly_electricity_usage_kwh ?? 7350,
        monthly_water: (profile as any).monthly_water_usage_l ?? 126000
      });
    } catch (e) {
      console.error("Error fetching dashboard stats", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const s = settings || {
    module_logbook: true,
    module_menu_editor: true,
    module_instagram: false,
    module_receipt_scanner: true,
  };

  const setupProgress = [
    {
      id: "menu",
      title: t("setup_menu_title"),
      desc: t("setup_menu_desc"),
      done: stats.menuItems > 0,
      action: () => router.push("/dashboard/menu")
    },
    {
      id: "pos",
      title: t("setup_pos_title"),
      desc: t("setup_pos_desc"),
      done: stats.integrations > 0,
      action: () => router.push("/dashboard/settings?tab=integrations")
    },
    {
      id: "team",
      title: t("setup_team_title"),
      desc: t("setup_team_desc"),
      done: stats.teamMembers > 1,
      action: () => router.push("/dashboard/settings?tab=team")
    }
  ];

  const setupCompleted = setupProgress.every(step => step.done);

  return (
    <>
    <div className="flex flex-col gap-6 md:gap-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-jakarta font-bold text-foreground tracking-tighter mb-1 md:mb-2">
            {t("welcome_back")} {profile?.restaurant_name ? `, ${profile.restaurant_name}` : ""}
          </h1>
          <div className="flex flex-col gap-1 mt-2">
            {profile?.tagline && (
              <p className="text-lg md:text-xl font-outfit text-primary/90 font-medium">
                « {profile.tagline} »
              </p>
            )}
            <p className="text-base font-outfit text-muted-foreground opacity-80 capitalize">
              {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 px-4 py-2 rounded-full hidden md:flex">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          <span className="text-[10px] font-plex-mono font-bold uppercase tracking-wider text-primary/60">{t("system_operational")}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10 items-start">
        
        {/* Left Column: Schedule & Tasks */}
        <div className="space-y-8 md:space-y-10">
          
          {/* WEEKLY SCHEDULE WIDGET */}
          <section className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden p-6 md:p-8 relative transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[11px] font-plex-mono font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                Weekly Schedule
              </h2>
              <div className="bg-secondary/40 text-xs px-3 py-1 rounded-full text-muted-foreground border border-white/5">
                All Months <span className="ml-1 text-[9px]">▼</span>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar-hidden items-end">
              {/* Active Day */}
              <div className="relative group shrink-0 w-32 bg-[--sidebar-primary] border border-primary/40 rounded-3xl p-4 shadow-[0_0_25px_rgba(0,229,255,0.15)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none"></div>
                <div className="relative z-10">
                  <span className="text-primary text-sm font-jakarta font-medium">Wed</span>
                  <div className="w-8 h-px bg-primary/30 my-2"></div>
                  <div className="text-[10px] text-primary/80 mb-2">10:00 AM - 6:00 PM</div>
                  <div className="bg-primary/20 text-primary text-[10px] w-fit px-2 py-0.5 rounded-md mt-1 backdrop-blur-md border border-primary/20">Server</div>
                </div>
              </div>

              {/* Inactive Days */}
              {[
                { day: "Wed", date: "18", start: "10:00 AM", role: "Server" },
                { day: "Tue", date: "19" },
                { day: "Wed", date: "20", start: "10:00 AM", role: "Server" },
                { day: "Thu", date: "27", start: "10:00 AM", role: "Server" },
                { day: "Fri", date: "28", start: "10:00 PM", role: "Bartender", active: true },
                { day: "Sat", date: "29", role: "Server" },
              ].map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-16 opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="text-xs text-slate-400 font-medium">{d.day}</div>
                  <div className="text-lg font-jakarta font-bold text-slate-100">{d.date}</div>
                  {d.start && (
                    <div className={`mt-2 p-2 rounded-xl text-[10px] w-full text-center border font-medium ${d.active ? 'bg-pink-500/20 border-pink-400/50 text-pink-300 shadow-[0_0_15px_rgba(255,0,122,0.25)]' : 'bg-slate-800/60 border-slate-600/50 text-slate-200 shadow-sm'}`}>
                      {d.start}
                      <div className="mt-1 opacity-80">{d.role}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shadow-[0_0_15px_rgba(0,229,255,0.3)] font-bold">
                Add Availability
              </Button>
            </div>
          </section>

          {/* TASK PREP LISTS WIDGET */}
          <section className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 md:p-8 relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[11px] font-plex-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Task Prep Lists
              </h2>
              <span className="text-[12px] opacity-50 cursor-pointer">▲</span>
            </div>

            <div className="space-y-4">
              {[
                { id: "1", text: "Prepare smoothie bases", color: "bg-emerald-400", shadow: "shadow-[0_0_10px_rgba(52,211,153,0.5)]" },
                { id: "2", text: "Restock front-of-house", color: "bg-yellow-400", shadow: "shadow-[0_0_10px_rgba(250,204,21,0.5)]" },
                { id: "3", text: "Check ambient temps", color: "bg-pink-500", shadow: "shadow-[0_0_10px_rgba(255,0,122,0.5)]" },
                { id: "4", text: "Add availability tasks", color: "bg-white/20", shadow: "" },
              ].map((task) => (
                <label key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-[0.4rem] border border-white/20 flex items-center justify-center group-hover:border-white/40">
                      {/* empty checkbox */}
                    </div>
                    <span className="text-foreground/80 font-outfit text-sm">{task.text}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className={`w-8 h-1.5 rounded-full ${task.color} opacity-80 ${task.shadow}`}></div>
                     <div className={`w-1.5 h-1.5 rounded-full ${task.color} ${task.shadow}`}></div>
                  </div>
                </label>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Logbook & Insight */}
        <div className="space-y-8 md:space-y-10">
          
          <DailyInsight />

          {s.module_logbook && (
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px w-8 bg-border"></div>
                <h2 className="text-xs font-plex-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("section_logbook")}
                </h2>
                <div className="h-px flex-1 bg-border"></div>
              </div>
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/5 bg-card border border-border/50 transition-all duration-500 hover:shadow-black/10">
                <SmartLogbook />
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Utilities Column: Live Utility Costs (Monthly) */}
      <div className="mt-8 md:mt-12 space-y-6 md:space-y-8">
          
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-[11px] font-plex-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Live Utility Costs
            </h2>
          </div>

          {/* Monthly Energy Usage Widget */}
          <section className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 relative group overflow-hidden">
             <div className="flex justify-between items-start mb-6">
                <h3 className="text-sm font-outfit font-medium text-foreground">Monthly Energy Usage</h3>
                <span className="text-muted-foreground opacity-50 tracking-widest leading-none">...</span>
             </div>
             
             {/* Chart Area mockup */}
             <div className="relative h-48 w-full flex items-end justify-between gap-1 mt-8">
                {/* Y-Axis labels */}
                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-muted-foreground opacity-50">
                  <span>100</span>
                  <span>75</span>
                  <span>50</span>
                  <span>25</span>
                  <span>0</span>
                </div>
                
                {/* Horizontal Guide lines */}
                <div className="absolute left-6 right-0 top-1.5 h-px bg-white/5"></div>
                <div className="absolute left-6 right-0 top-[25%] h-px bg-white/5"></div>
                <div className="absolute left-6 right-0 top-[50%] h-px bg-white/5"></div>
                <div className="absolute left-6 right-0 top-[75%] h-px bg-white/5"></div>
                <div className="absolute left-6 right-0 bottom-6 h-px bg-white/10"></div>
                
                {/* Tooltip mockup */}
                <div className="absolute right-0 top-4 bg-white/10 backdrop-blur-md border border-white/10 p-2 rounded-lg text-[9px] font-plex-mono z-10 shadow-lg">
                   <div>Last 30 Days</div>
                   <div className="text-primary font-bold">Monthly: {stats.monthly_electricity} kWh</div>
                   <div className="text-pink-400">Current: {Math.floor(stats.monthly_electricity * 0.75)} kWh</div>
                </div>

                {/* Bars */}
                {/* We map 6 generic months, showing cyan/pink split */}
                <div className="w-6 shrink-0 ml-8"></div> {/* Spacer for Y axis */}
                {[
                  { d: "Jul", cyan: 30, pink: 60 },
                  { d: "Aug", cyan: 60, pink: 20 },
                  { d: "Sep", cyan: 50, pink: 50 },
                  { d: "Oct", cyan: 40, pink: 30 },
                  { d: "Nov", cyan: 70, pink: 40 },
                  { d: "Dec", cyan: 90, pink: 30 },
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 z-0 group-hover:opacity-90 transition-opacity">
                    <div className="w-full max-w-[24px] flex flex-col justify-end gap-[1px] rounded-t-sm overflow-hidden h-[150px]">
                      <div className="w-full bg-primary shadow-[0_0_10px_rgba(0,229,255,0.4)] transition-all rounded-t-sm" style={{ height: `${bar.cyan}%` }}></div>
                      <div className="w-full bg-pink-500 shadow-[0_0_10px_rgba(255,0,122,0.4)] transition-all rounded-b-sm" style={{ height: `${bar.pink}%` }}></div>
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-2">{bar.d}</span>
                  </div>
                ))}
             </div>
          </section>

          {/* Monthly Water Consumption Widget */}
          <section className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 relative group overflow-hidden mt-4 md:mt-6">
             <div className="flex justify-between items-start mb-6">
                <h3 className="text-sm font-outfit font-medium text-foreground">Monthly Water Consumption</h3>
                <span className="text-muted-foreground opacity-50 tracking-widest leading-none">...</span>
             </div>
             
             {/* Line Chart Area mockup */}
             <div className="relative h-48 w-full flex items-end justify-between gap-1 mt-8">
                {/* Y-Axis labels */}
                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-muted-foreground opacity-50">
                  <span>40</span>
                  <span>30</span>
                  <span>20</span>
                  <span>10</span>
                  <span>0</span>
                </div>
                
                {/* Horizontal Guide lines */}
                <div className="absolute left-6 right-0 top-1.5 h-px bg-white/5"></div>
                <div className="absolute left-6 right-0 top-[33%] h-px bg-white/5"></div>
                <div className="absolute left-6 right-0 top-[66%] h-px bg-white/5"></div>
                <div className="absolute left-6 right-0 bottom-6 h-px bg-white/10"></div>
                
                {/* Tooltip mockup */}
                <div className="absolute right-0 top-2 bg-white/10 backdrop-blur-md border border-white/10 p-2 rounded-lg text-[9px] font-plex-mono z-10 shadow-lg">
                   <div>Last 30 Days</div>
                   <div className="text-primary font-bold">Water: {(stats.monthly_water / 1000).toFixed(1)} kL</div>
                   <div className="text-pink-400">Current: {Math.floor((stats.monthly_water / 1000) * 0.81)} kL</div>
                </div>

                {/* SVG Line Graph Overlay */}
                <svg className="absolute left-8 right-0 bottom-6 top-1.5 w-[calc(100%-2rem)] h-[calc(100%-1.5rem)] overflow-visible z-0" preserveAspectRatio="none" viewBox="0 0 100 100">
                  {/* Area fill */}
                  <path d="M0,80 Q10,60 20,70 T40,40 T60,60 T80,30 T100,50 L100,100 L0,100 Z" fill="url(#waterGrad)" opacity="0.3" />
                  {/* Stroke cyan line */}
                  <path d="M0,80 Q10,60 20,70 T40,40 T60,60 T80,30 T100,50" fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                  
                  {/* Data Point Dots */}
                  <circle cx="20" cy="70" r="3" fill="#0B1120" stroke="#00E5FF" strokeWidth="1.5" className="drop-shadow-[0_0_5px_rgba(0,229,255,1)]" />
                  <circle cx="40" cy="40" r="3" fill="#0B1120" stroke="#00E5FF" strokeWidth="1.5" className="drop-shadow-[0_0_5px_rgba(0,229,255,1)]" />
                  <circle cx="80" cy="30" r="3" fill="#0B1120" stroke="#00E5FF" strokeWidth="1.5" className="drop-shadow-[0_0_5px_rgba(0,229,255,1)]" />
                  
                  <defs>
                    <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#0B1120" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* X Axis Labels */}
                <div className="w-6 shrink-0 ml-8"></div>
                {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"].map((month, i) => (
                  <div key={i} className="flex-1 flex justify-center mt-auto mb-[-24px] z-10">
                    <span className="text-[9px] text-muted-foreground">{month}</span>
                  </div>
                ))}
             </div>
          </section>

        </div>

      <SocialProofBanner variant="dashboard" />
    </div>
    </>
  );
}

