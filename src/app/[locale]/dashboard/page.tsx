"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmartLogbook } from "@/components/SmartLogbook";
import { MobileInputTerminal } from "@/components/MobileInputTerminal";
import { DailyInsight } from "@/components/DailyInsight";
import { SocialProofBanner } from "@/components/SocialProofBanner";
import { useTranslations, useLocale } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const { user, profile, settings, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('sessions')
      .select('*, templates(*, tasks(id))')
      .eq('date', today);
    if (data) setSessions(data);
  };

  const s = settings || {
    module_logbook: true,
    module_menu_editor: true,
    module_food_cost: true,
    module_menu_engineering: true,
    module_instagram: false,
    module_receipt_scanner: true,
  };

  return (
    <>
    <div className="flex flex-col gap-6 md:gap-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-jakarta font-bold text-foreground tracking-tighter mb-1 md:mb-2">
            {t("header_title")}
          </h1>
          <p className="text-base md:text-lg font-outfit text-muted-foreground opacity-80 capitalize">
            {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 px-4 py-2 rounded-full hidden md:flex">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          <span className="text-[10px] font-plex-mono font-bold uppercase tracking-wider text-primary/60">Système Opérationnel</span>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10 items-start">
        
        <div className="space-y-8 md:space-y-10">
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-border"></div>
              <h2 className="text-xs font-plex-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {t("section_tasks")}
              </h2>
              <div className="h-px w-8 bg-border"></div>
            </div>
            
            <div className="space-y-6">
              {sessions.length === 0 && (
                <div className="text-sm font-outfit text-muted-foreground bg-card/50 backdrop-blur-sm p-8 rounded-[2rem] border border-border shadow-sm italic text-center">
                  {t("no_tasks")}
                </div>
              )}
              {sessions.map((session) => {
                const template = session.templates;
                if (!template) return null;
                const isCompleted = session.status === 'completed';
                return (
                  <Card key={session.id} className={`overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border-none shadow-xl shadow-black/5 transition-all duration-500 hover:-translate-y-1 ${isCompleted ? 'bg-secondary/50 opacity-80' : 'bg-card'}`}>
                    <CardHeader className="p-6 md:p-8 pb-4">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="outline" className={`rounded-full px-3 py-1 font-plex-mono text-[9px] md:text-[10px] uppercase tracking-wider ${isCompleted ? 'border-green-500/30 text-green-600 bg-green-50' : 'border-accent/30 text-accent bg-accent/5'}`}>
                          {isCompleted ? t("status_completed") : t("status_todo")}
                        </Badge>
                        <span className="text-[9px] md:text-[10px] font-plex-mono text-muted-foreground opacity-50 uppercase tracking-widest">ID: {session.id.slice(0,8)}</span>
                      </div>
                      <CardTitle className={`text-xl md:text-2xl font-jakarta font-bold ${isCompleted ? 'text-muted-foreground line-through opacity-60' : 'text-foreground'}`}>
                        {template.title}
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm font-outfit mt-2 leading-relaxed">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 md:px-8 pb-4">
                      <div className="flex items-center gap-2 text-[10px] md:text-xs font-plex-mono font-bold text-primary/40 uppercase tracking-wider mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
                        {t("tasks_to_review", { count: template.tasks?.length || 0 })}
                      </div>
                    </CardContent>
                    <CardFooter className="p-6 md:p-8 pt-0">
                      <Button 
                        className={`w-full h-14 rounded-2xl font-bold text-sm transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-transparent border border-border text-muted-foreground hover:bg-white' 
                            : 'bg-primary text-primary-foreground hover:bg-[#3A4F43] hover:shadow-lg'
                        }`} 
                        onClick={() => router.push(`/checklist/${session.id}` as any)}
                        variant={isCompleted ? 'outline' : 'default'}
                      >
                        {isCompleted ? t("btn_review") : t("btn_start")}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-8 md:space-y-10">
          {/* Daily Insight — Hook Model ritual */}
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
              
              <div className="mt-8 md:mt-10 flex items-center gap-4 mb-6">
                <div className="h-px w-8 bg-border"></div>
                <h2 className="text-xs font-plex-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Terminal Staff (Démo)
                </h2>
                <div className="h-px flex-1 bg-border"></div>
              </div>
              <div className="transition-all duration-500 hover:scale-[1.01]">
                 <MobileInputTerminal />
              </div>
            </section>
          )}
        </div>

      </div>

      {/* Social Proof */}
      <SocialProofBanner variant="dashboard" />
    </div>
    </>
  );
}
