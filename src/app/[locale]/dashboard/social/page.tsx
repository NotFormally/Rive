"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, Unlink, Instagram, Video, AlertCircle } from "lucide-react";

type SocialConnection = {
  id: string;
  platform: 'meta' | 'tiktok';
  account_name: string;
};

export default function SocialHubPage() {
  const t = useTranslations("SocialHub");
  const { profile } = useAuth();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadConnections();
    }
  }, [profile]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('id, platform, account_name')
        .eq('restaurant_id', profile!.id);

      if (error) throw error;
      setConnections(data || []);
    } catch (err) {
      console.error("Error loading connections:", err);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async (id: string) => {
    if (!confirm(t("btn_disconnect") + " ?")) return;
    try {
      await supabase.from('social_connections').delete().eq('id', id);
      setConnections(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 font-outfit text-muted-foreground">{t("loading")}</div>;

  const metaConn = connections.find(c => c.platform === 'meta');
  const tiktokConn = connections.find(c => c.platform === 'tiktok');

  return (
    <div className="flex flex-col gap-6 md:gap-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-jakarta font-bold text-foreground tracking-tighter mb-1 md:mb-2 flex items-center gap-3">
            {t("title")}
            <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-md mb-2">{t('beta_badge')}</span>
          </h1>
          <p className="text-base md:text-lg font-outfit text-muted-foreground opacity-80">
            {t("subtitle")}
          </p>
        </div>
      </header>

      <div className="max-w-4xl space-y-8">
        
        {/* Beta Alert */}
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl p-5 flex gap-4 shadow-sm items-start">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <p className="text-sm font-outfit leading-relaxed">
            {t("beta_alert")}
          </p>
        </div>

        <Card className="rounded-[2rem] border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-card p-6 md:p-8 pb-4">
            <CardTitle className="text-lg font-jakarta font-bold text-foreground">{t("section_connections")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6 md:p-8 pt-2">
            
            {/* Meta Card */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 border border-border rounded-2xl bg-secondary/10">
              <div className="flex items-start gap-4 mb-4 md:mb-0">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center shrink-0">
                  <Instagram className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-jakarta font-bold text-foreground">{t("connect_meta_title")}</h3>
                  <p className="text-sm font-outfit text-muted-foreground mt-1 max-w-md">
                    {t("connect_meta_desc")}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {metaConn ? (
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-lg border border-green-500/20">
                      <Check className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">{t("status_connected")}: {metaConn.account_name}</span>
                    </div>
                    <button onClick={() => disconnect(metaConn.id)} className="text-xs text-red-500 hover:text-red-700 font-outfit flex items-center gap-1">
                      <Unlink className="h-3 w-3" /> {t("btn_disconnect")}
                    </button>
                  </div>
                ) : (
                  <Button asChild className="rounded-xl px-6 bg-foreground text-background hover:bg-foreground/90 font-jakarta font-bold shadow-lg flex gap-2">
                    <a href="/api/auth/meta">
                      <Link2 className="h-4 w-4" /> {t("btn_connect")}
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* TikTok Card */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 border border-border rounded-2xl bg-secondary/10">
              <div className="flex items-start gap-4 mb-4 md:mb-0">
                <div className="h-12 w-12 rounded-xl bg-[#010101] flex items-center justify-center shrink-0">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-jakarta font-bold text-foreground">{t("connect_tiktok_title")}</h3>
                  <p className="text-sm font-outfit text-muted-foreground mt-1 max-w-md">
                    {t("connect_tiktok_desc")}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {tiktokConn ? (
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-lg border border-green-500/20">
                      <Check className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">{t("status_connected")}: {tiktokConn.account_name}</span>
                    </div>
                    <button onClick={() => disconnect(tiktokConn.id)} className="text-xs text-red-500 hover:text-red-700 font-outfit flex items-center gap-1">
                      <Unlink className="h-3 w-3" /> {t("btn_disconnect")}
                    </button>
                  </div>
                ) : (
                  <Button asChild className="rounded-xl px-6 bg-[#010101] text-white hover:bg-black/80 font-jakarta font-bold shadow-lg flex gap-2 border border-slate-700">
                    <a href="/api/auth/tiktok">
                      <Link2 className="h-4 w-4" /> {t("btn_connect")}
                    </a>
                  </Button>
                )}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Add missing icon
const Check = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
