"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, Clock, Search, ShieldCheck } from "lucide-react";

const ADMIN_EMAIL = "nassim.saighi@gmail.com";

type UserRecord = {
  id: string;
  restaurant_name: string;
  slug: string;
  created_at: string;
  user_id: string;
  // From signup_notifications join
  email?: string;
  locale?: string;
  // From restaurant_settings join
  subscription_tier?: string;
  trial_ends_at?: string;
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!authLoading && user) {
      // Check admin access
      if (user.email !== ADMIN_EMAIL) {
        router.push("/dashboard");
        return;
      }
      loadUsers();
    }
  }, [user, authLoading, router]);

  const loadUsers = async () => {
    setLoadingData(true);

    // Fetch restaurant profiles
    const { data: profiles } = await supabase
      .from("restaurant_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!profiles) {
      setLoadingData(false);
      return;
    }

    // Fetch signup notifications to get email + locale
    const { data: notifications } = await supabase
      .from("signup_notifications")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch settings to get subscription info
    const { data: settings } = await supabase
      .from("restaurant_settings")
      .select("restaurant_id, subscription_tier, trial_ends_at");

    // Merge data
    const merged = profiles.map((p: any) => {
      const notif = notifications?.find((n: any) => n.email && p.slug?.includes(n.restaurant_name?.toLowerCase().replace(/[^a-z0-9]+/g, "-")));
      const setting = settings?.find((s: any) => s.restaurant_id === p.id);

      // Try to find notification by exact match or closest match
      const notifByEmail = notifications?.find(
        (n: any) => n.restaurant_name === p.restaurant_name
      );

      return {
        ...p,
        email: notifByEmail?.email || notif?.email || "—",
        locale: notifByEmail?.locale || notif?.locale || "fr",
        subscription_tier: setting?.subscription_tier || "trial",
        trial_ends_at: setting?.trial_ends_at || null,
      };
    });

    setUsers(merged);
    setLoadingData(false);
  };

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Chargement du registre...</div>
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) return null;

  const filteredUsers = users.filter(
    (u) =>
      u.restaurant_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.locale?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const localeBreakdown = users.reduce((acc: Record<string, number>, u) => {
    const locale = u.locale || "fr";
    acc[locale] = (acc[locale] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-[#1A1A1A] text-white border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#CC5833]" />
            <div>
              <h1 className="text-lg font-bold font-jakarta">Registre Utilisateurs</h1>
              <p className="text-xs text-slate-400 font-plex-mono">Admin privé — Rive</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
                <Users className="w-4 h-4" /> Utilisateurs totaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Langues actives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Object.keys(localeBreakdown).length}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(localeBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([locale, count]) => (
                    <Badge key={locale} variant="secondary" className="text-[10px] font-plex-mono">
                      {locale.toUpperCase()}: {count}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Dernière inscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {users[0]?.created_at
                  ? new Date(users[0].created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </div>
              <div className="text-xs text-slate-400 mt-1">{users[0]?.restaurant_name || ""}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, ou langue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E4036]/20 bg-white"
          />
        </div>

        {/* User Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Restaurant</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Langue</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u, i) => {
                  const isNew =
                    new Date(u.created_at).getTime() >
                    Date.now() - 24 * 60 * 60 * 1000;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-400 font-plex-mono text-xs">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          {u.restaurant_name}
                          {isNew && (
                            <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5">
                              NEW
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-plex-mono text-xs">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="font-plex-mono text-[10px] uppercase"
                        >
                          {u.locale}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            u.subscription_tier === "performance"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            u.subscription_tier === "performance"
                              ? "bg-[#CC5833]"
                              : u.subscription_tier === "enterprise"
                              ? "bg-[#2E4036] text-white"
                              : ""
                          }
                        >
                          {u.subscription_tier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
