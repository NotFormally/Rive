"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmartLogbook } from "@/components/SmartLogbook";
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t("header_title")}</h1>
          <p className="text-sm text-slate-500 capitalize">
            {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </header>

      <div className="p-8 max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold mb-4 text-slate-700">{t("section_tasks")}</h2>
              <div className="space-y-4">
                {sessions.length === 0 && (
                  <p className="text-sm text-slate-500 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">{t("no_tasks")}</p>
                )}
                {sessions.map((session) => {
                  const template = session.templates;
                  if (!template) return null;
                  return (
                    <Card key={session.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{template.title}</CardTitle>
                          <Badge variant={session.status === 'completed' ? 'default' : 'secondary'} className={session.status === 'completed' ? 'bg-green-500' : ''}>
                            {session.status === 'completed' ? t("status_completed") : t("status_todo")}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs text-slate-500 mb-2">
                          {t("tasks_to_review", { count: template.tasks?.length || 0 })}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                          onClick={() => router.push(`/checklist/${session.id}` as any)}
                          variant={session.status === 'completed' ? 'outline' : 'default'}
                        >
                          {session.status === 'completed' ? t("btn_review") : t("btn_start")}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            {s.module_logbook && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-700">{t("section_logbook")}</h2>
                </div>
                <SmartLogbook />
              </section>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
