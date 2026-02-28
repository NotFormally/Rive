"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { useTranslations, useLocale } from 'next-intl';
import { useAuth, type MemberRole } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TIER_CONFIG, type TierModules } from "@/lib/subscription-tiers";

const MODULE_EMOJIS: Record<string, string> = {
  module_logbook: "📋",
  module_menu_editor: "🍽️",
  module_food_cost: "💰",
  module_menu_engineering: "🧭",
  module_receipt_scanner: "📸",
  module_instagram: "📱",
  module_reservations: "📅",
  module_smart_prep: "🧠",
  module_deposits: "♻️",
  module_variance: "💧",
  module_production: "🍺",
};

const ROLE_COLORS: Record<MemberRole, string> = {
  owner:  "bg-amber-100 text-amber-800 border-amber-200",
  admin:  "bg-[#2E4036]/10 text-[#2E4036] border-[#2E4036]/20",
  editor: "bg-[#CC5833]/10 text-[#CC5833] border-[#CC5833]/20",
};

type TeamMember = {
  id: string;
  user_id: string | null;
  role: MemberRole;
  email: string | null;
  invited_email: string | null;
  invited_at: string;
  accepted_at: string | null;
};

export default function SettingsPage() {
  const { user, profile, role, settings, subscription, loading: authLoading, refreshSettings } = useAuth();
  const t = useTranslations("Settings");
  const locale = useLocale();
  const [localSettings, setLocalSettings] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileTagline, setProfileTagline] = useState("");
  const [socialContext, setSocialContext] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();

  // Team state
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor'>("editor");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper to get auth headers for API calls
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        module_logbook: settings.module_logbook,
        module_menu_editor: settings.module_menu_editor,
        module_food_cost: settings.module_food_cost,
        module_menu_engineering: settings.module_menu_engineering,
        module_receipt_scanner: settings.module_receipt_scanner,
        module_instagram: settings.module_instagram,
        module_reservations: settings.module_reservations,
        module_smart_prep: settings.module_smart_prep,
        module_deposits: settings.module_deposits,
        module_variance: settings.module_variance,
        module_production: settings.module_production,
      });
    }
    if (profile) {
      setProfileName(profile.restaurant_name);
      setProfileTagline(profile.tagline || "");
      setSocialContext(profile.social_media_context || "");
    }
  }, [settings, profile]);

  // Load team members
  const loadMembers = useCallback(async () => {
    if (!profile) return;
    setTeamLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/team/members', { headers });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (e) {
      console.error("Failed to load team:", e);
    } finally {
      setTeamLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile && role && ['owner', 'admin'].includes(role)) {
      loadMembers();
    }
  }, [profile, role, loadMembers]);

  const handleToggle = async (moduleKey: string) => {
    const newValue = !localSettings[moduleKey];
    setLocalSettings(prev => ({ ...prev, [moduleKey]: newValue }));

    if (profile) {
      await supabase
        .from("restaurant_settings")
        .update({ [moduleKey]: newValue })
        .eq("restaurant_id", profile.id);
      await refreshSettings();
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase
      .from("restaurant_profiles")
      .update({
        restaurant_name: profileName,
        tagline: profileTagline,
        social_media_context: socialContext,
      })
      .eq("id", profile.id);
    setSaving(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole, locale }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteMsg({ type: 'success', text: data.message || t("btn_invite") });
        setInviteEmail("");
        loadMembers();
      } else {
        setInviteMsg({ type: 'error', text: data.error || t("error_generic") });
      }
    } catch {
      setInviteMsg({ type: 'error', text: t("error_network") });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm(t("confirm_remove"))) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/team/members', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ memberId }),
      });
      if (res.ok) loadMembers();
      else {
        const d = await res.json();
        alert(d.error || t("error_generic"));
      }
    } catch {
      alert(t("error_network"));
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/team/members', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ memberId, newRole }),
      });
      if (res.ok) loadMembers();
      else {
        const d = await res.json();
        alert(d.error || t("error_generic"));
      }
    } catch {
      alert(t("error_network"));
    }
  };

  const handlePortalSession = async () => {
    if (!subscription?.stripeCustomerId) return;
    try {
      setPortalLoading(true);
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: subscription.stripeCustomerId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
      alert(t("portal_error"));
      setPortalLoading(false);
    }
  };

  if (authLoading) return <div className="p-8 text-center flex-1 font-outfit text-muted-foreground">{t("loading")}</div>;
  if (!user) return null;

  const canManageTeam = role === 'owner' || role === 'admin';

  return (
    <div className="flex flex-col gap-6 md:gap-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-jakarta font-bold text-foreground tracking-tighter mb-1 md:mb-2">
            {t("title")}
          </h1>
          <p className="text-base md:text-lg font-outfit text-muted-foreground opacity-80">
            {t("subtitle")}
          </p>
        </div>
      </header>

      <div className="max-w-3xl space-y-8">
        {/* Restaurant Profile */}
        <Card className="rounded-[2rem] border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-card p-6 md:p-8 pb-4">
            <CardTitle className="text-lg font-jakarta font-bold text-foreground">{t("section_restaurant")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6 md:p-8 pt-2">
            <div>
              <label className="block text-sm font-medium font-outfit text-foreground/70 mb-1">{t("label_name")}</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-outfit bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium font-outfit text-foreground/70 mb-1">{t("label_tagline")}</label>
              <input
                type="text"
                value={profileTagline}
                onChange={(e) => setProfileTagline(e.target.value)}
                placeholder={t("placeholder_tagline")}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-outfit bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium font-outfit text-foreground/70 mb-1">{t("label_social_context")}</label>
              <textarea
                value={socialContext}
                onChange={(e) => setSocialContext(e.target.value)}
                placeholder={t("placeholder_social_context")}
                rows={3}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-outfit bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50 resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">{t("desc_social_context")}</p>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="bg-primary hover:bg-[#3A4F43] text-primary-foreground rounded-xl">
              {saving ? t("btn_saving") : t("btn_save")}
            </Button>
          </CardContent>
        </Card>

        {/* Team Management */}
        {canManageTeam && (
          <Card className="rounded-[2rem] border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-card p-6 md:p-8 pb-4">
              <CardTitle className="text-lg font-jakarta font-bold text-foreground">{t("section_team")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 md:p-8 pt-2">
              <p className="text-sm font-outfit text-muted-foreground">
                {t("team_desc")}
              </p>

              {/* Invite form */}
              <div className="bg-secondary/50 p-5 rounded-2xl border border-border space-y-3">
                <p className="text-sm font-medium font-jakarta text-foreground">{t("invite_title")}</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-outfit bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                    disabled={inviting}
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'editor')}
                    className="px-4 py-2.5 border border-border rounded-xl text-sm font-outfit bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={inviting}
                  >
                    {role === 'owner' && <option value="admin">{t("role_admin")}</option>}
                    <option value="editor">{t("role_editor")}</option>
                  </select>
                </div>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="bg-accent hover:bg-[#b84d2d] text-accent-foreground w-full rounded-xl">
                  {inviting ? t("btn_sending") : t("btn_invite")}
                </Button>
                {inviteMsg && (
                  <p className={`text-sm font-outfit ${inviteMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {inviteMsg.text}
                  </p>
                )}
              </div>

              {/* Members list */}
              <div className="space-y-2">
                <p className="text-sm font-medium font-jakarta text-foreground">{t("members_title")}</p>
                {teamLoading ? (
                  <p className="text-sm font-outfit text-muted-foreground">{t("loading")}</p>
                ) : members.length === 0 ? (
                  <p className="text-sm font-outfit text-muted-foreground">{t("no_members")}</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => {
                      const roleColor = ROLE_COLORS[member.role];
                      const isPending = !member.accepted_at;
                      const isCurrentUser = member.user_id === user.id;

                      return (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between p-3 border border-border rounded-xl ${isPending ? 'opacity-60 bg-secondary/30' : 'bg-card'}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold font-jakarta text-primary">
                              {(member.email || member.invited_email || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium font-outfit text-foreground truncate">
                                {member.email || member.invited_email}
                                {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">{t("you_label")}</span>}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleColor}`}>
                                  {t(`role_${member.role}`)}
                                </span>
                                {isPending && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200 flex items-center gap-1">
                                    <span className="animate-pulse h-1.5 w-1.5 bg-orange-500 rounded-full inline-block"></span>
                                    {t("status_pending")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          {!isCurrentUser && member.role !== 'owner' && (
                            <div className="flex items-center gap-1 shrink-0">
                              {role === 'owner' && member.accepted_at && (
                                <select
                                  value={member.role}
                                  onChange={(e) => handleChangeRole(member.id, e.target.value)}
                                  className="text-xs px-2 py-1 border border-border rounded-lg bg-background font-outfit"
                                >
                                  <option value="admin">{t("role_admin_short")}</option>
                                  <option value="editor">{t("role_editor")}</option>
                                </select>
                              )}
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                                title={t("btn_remove_title")}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Module Toggles */}
        <Card className="rounded-[2rem] border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-card p-6 md:p-8 pb-4">
            <CardTitle className="text-lg font-jakarta font-bold text-foreground">{t("section_modules")}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8 pt-2">
            <p className="text-sm font-outfit text-muted-foreground mb-6">{t("modules_desc")}</p>
            <div className="space-y-3">
              {Object.entries(MODULE_EMOJIS).map(([key, emoji]) => {
                const isAllowed = subscription && TIER_CONFIG[subscription.tier].modules[key as keyof TierModules];

                // Find minimum tier required for this module if not allowed
                let requiredTierLabel = "";
                if (!isAllowed) {
                  const entry = Object.entries(TIER_CONFIG).find(([_, t]) => t.modules[key as keyof TierModules]);
                  if (entry) requiredTierLabel = entry[1].label;
                }

                return (
                  <div
                    key={key}
                    onClick={() => !isAllowed && router.push('/pricing' as any)}
                    className={`flex items-center justify-between p-4 border border-border rounded-2xl transition-all duration-300 ${
                      isAllowed ? 'hover:bg-secondary/30 bg-card' : 'opacity-60 bg-secondary/20 relative cursor-pointer hover:border-accent/30'
                    }`}
                  >
                    {!isAllowed && (
                      <div className="absolute inset-0 bg-transparent z-10" title={`Requis: ${requiredTierLabel}`} />
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-sm font-jakarta text-foreground">{t(`${key}_label`)}</p>
                          {!isAllowed && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-accent/20">
                              {t("included_with", { tier: requiredTierLabel })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-outfit text-muted-foreground">{t(`${key}_desc`)}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); isAllowed && handleToggle(key); }}
                      disabled={!isAllowed}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                        !isAllowed ? "bg-border/50 cursor-not-allowed" :
                        localSettings[key] ? "bg-primary cursor-pointer" : "bg-border cursor-pointer"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          !isAllowed ? "translate-x-1" :
                          localSettings[key] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="rounded-[2rem] border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-card p-6 md:p-8 pb-4">
            <CardTitle className="text-lg font-jakarta font-bold text-foreground">{t("section_account")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6 md:p-8 pt-2">
            <p className="text-sm font-outfit text-foreground/70">
              <strong className="text-foreground">{t("label_email")}</strong> {user.email}
            </p>
            <p className="text-sm font-outfit text-foreground/70">
              <strong className="text-foreground">{t("label_slug")}</strong> /menu/{profile?.slug}
            </p>
            {role && (
              <p className="text-sm font-outfit text-foreground/70">
                <strong className="text-foreground">{t("label_role")}</strong>{" "}
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ROLE_COLORS[role]}`}>
                  {t(`role_${role}`)}
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Webhooks & Integrations */}
        <Card className="rounded-[2rem] border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-card p-6 md:p-8 pb-4">
            <CardTitle className="text-lg font-jakarta font-bold text-foreground">{t("section_integrations")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6 md:p-8 pt-2">
            <p className="text-sm font-outfit text-foreground/70">
              {t("integrations_desc")}
            </p>
            <Button
              onClick={() => router.push('/dashboard/settings/reservations' as any)}
              className="bg-primary hover:bg-[#3A4F43] text-primary-foreground w-full rounded-xl"
            >
              {t("btn_manage_integrations")}
            </Button>
            <div className="bg-secondary/50 p-5 rounded-2xl border border-border mt-4">
               <div className="flex flex-col gap-2">
                 <span className="text-sm font-medium font-jakarta text-foreground">{t("webhook_title")}</span>
                 <p className="text-xs font-outfit text-muted-foreground mb-2">{t("webhook_desc")}</p>
                 <div className="flex gap-2 items-center">
                    <code className="flex-1 bg-background px-3 py-2 rounded-lg text-xs overflow-hidden text-ellipsis whitespace-nowrap font-plex-mono text-foreground/70 border border-border">
                      https://app.rive.com/api/webhooks/reservations?token=RIVE_SEC_{profile?.id?.slice(0,8) || 'XXXX'}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://app.rive.com/api/webhooks/reservations?token=RIVE_SEC_${profile?.id?.slice(0,8)}`);
                        alert(t("copied_alert"));
                      }}
                    >
                      {t("btn_copy")}
                    </Button>
                 </div>
                 <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                    <span className="animate-pulse h-2 w-2 bg-amber-500 rounded-full inline-block shrink-0"></span>
                    <span className="font-outfit">{t("webhook_waiting")}</span>
                 </div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card className="rounded-[2rem] border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-card p-6 md:p-8 pb-4">
            <CardTitle className="text-lg font-jakarta font-bold text-foreground">{t("section_subscription")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6 md:p-8 pt-2">
            <p className="text-sm font-outfit text-foreground/70">
              <strong className="text-foreground">{t("label_plan")}</strong> <span className="capitalize">{subscription?.tier || 'freemium'}</span>
            </p>
            {subscription?.stripeCustomerId ? (
              <Button
                onClick={handlePortalSession}
                disabled={portalLoading}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-xl"
              >
                {portalLoading ? t("portal_loading") : t("btn_manage_subscription")}
              </Button>
            ) : (
              <div>
                <p className="text-sm font-outfit text-muted-foreground mb-4">{t("freemium_desc")}</p>
                <Button onClick={() => router.push('/pricing' as any)} className="bg-accent hover:bg-[#b84d2d] text-accent-foreground rounded-xl">
                  {t("btn_view_plans")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
