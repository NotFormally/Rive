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
  ArrowRight
} from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const { user, profile, settings, usage, subscription, intelligenceScore, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    menuItems: 0,
    teamMembers: 1, // at least the owner
    integrations: 0
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
        integrations: intResult.count || 0
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
          <p className="text-base md:text-lg font-outfit text-muted-foreground opacity-80 capitalize">
            {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 px-4 py-2 rounded-full hidden md:flex">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          <span className="text-[10px] font-plex-mono font-bold uppercase tracking-wider text-primary/60">DASHBOARD.OPERATIONAL_SYSTEM</span>
        </div>
      </header>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-[1.5rem] border-none shadow-sm bg-card transition-all hover:-translate-y-1">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-plex-mono text-muted-foreground uppercase">{t("stat_menu_items")}</p>
              <h4 className="text-2xl font-bold font-jakarta mt-1">{loadingStats ? "..." : stats.menuItems}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
              <MenuSquare className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-[1.5rem] border-none shadow-sm bg-card transition-all hover:-translate-y-1">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-plex-mono text-muted-foreground uppercase">{t("stat_log_entries")}</p>
              <h4 className="text-2xl font-bold font-jakarta mt-1">{usage?.logbook_notes || 0}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-none shadow-sm bg-card transition-all hover:-translate-y-1">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-plex-mono text-muted-foreground uppercase">{t("stat_intelligence") || "Intelligence"}</p>
              <h4 className="text-2xl font-bold font-jakarta mt-1 flex items-center gap-1">
                {intelligenceScore || 0}
                <span className="text-xs font-normal text-muted-foreground">/1000</span>
              </h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-none shadow-sm bg-card transition-all hover:-translate-y-1">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-plex-mono text-muted-foreground uppercase">{t("stat_tier")}</p>
              <h4 className="text-lg font-bold font-jakarta mt-1 capitalize text-accent">{subscription?.tier || "free"}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10 items-start">
        
        {/* Left Column: Setup & Quick Actions */}
        <div className="space-y-8 md:space-y-10">
          
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xs font-plex-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {t("setup_guide")}
              </h2>
              <div className="h-px flex-1 bg-border"></div>
            </div>
            
            <div className="bg-card rounded-[2rem] border border-border/50 shadow-sm overflow-hidden p-6 md:p-8 relative">
                {/* Visual noise overlay */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
               
               {setupCompleted ? (
                 <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-2">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold font-jakarta">{t("setup_completed")}</h3>
                    <p className="text-sm font-outfit text-muted-foreground">L\'écosystème IA est calibré et collecte vos données.</p>
                 </div>
               ) : (
                <div className="space-y-6 relative z-10">
                  {setupProgress.map((step, idx) => (
                    <div 
                      key={step.id} 
                      className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 ${
                        step.done 
                          ? 'bg-secondary/50 opacity-60' 
                          : 'bg-background border border-border/50 hover:shadow-md cursor-pointer'
                      }`}
                      onClick={() => !step.done && step.action()}
                    >
                      <div className="mt-1">
                        {step.done ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-base font-bold font-jakarta ${step.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {step.title}
                        </h4>
                        <p className="text-sm font-outfit text-muted-foreground mt-1">{step.desc}</p>
                      </div>
                      {!step.done && (
                        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors self-center">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
               )}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xs font-plex-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {t("quick_actions")}
              </h2>
              <div className="h-px flex-1 bg-border"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-6 px-4 flex flex-col items-center justify-center gap-3 rounded-[1.5rem] bg-card hover:bg-secondary/50 border-border/50 hover:border-primary/20 transition-all font-outfit"
                  onClick={() => document.getElementById("log-entry")?.focus()}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                     <Camera className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-sm">{t("action_scan")}</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto py-6 px-4 flex flex-col items-center justify-center gap-3 rounded-[1.5rem] bg-card hover:bg-secondary/50 border-border/50 hover:border-primary/20 transition-all font-outfit"
                  onClick={() => router.push("/dashboard/menu")}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                     <MenuSquare className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-sm">{t("action_menu")}</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto py-6 px-4 flex flex-col items-center justify-center gap-3 rounded-[1.5rem] bg-card hover:bg-secondary/50 border-border/50 hover:border-primary/20 transition-all font-outfit"
                  onClick={() => router.push("/dashboard/social")}
                >
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
                     <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-sm">{t("action_social")}</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto py-6 px-4 flex flex-col items-center justify-center gap-3 rounded-[1.5rem] bg-card hover:bg-secondary/50 border-border/50 hover:border-primary/20 transition-all font-outfit"
                  onClick={() => router.push("/dashboard/settings?tab=team")}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                     <Users className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-sm">{t("action_team")}</span>
                </Button>
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

      <SocialProofBanner variant="dashboard" />
    </div>
    </>
  );
}

