"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { useTranslations, useLocale } from 'next-intl';
import { useAuth, type MemberRole } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TIER_CONFIG, type TierModules } from "@/lib/subscription-tiers";

const MODULE_LABELS: Record<string, { label: string; emoji: string; description: string }> = {
  module_logbook:          { label: "Cahier de Bord Intelligent",  emoji: "📋", description: "Notes IA, classification automatique, urgences" },
  module_menu_editor:      { label: "Gestionnaire de Menu + QR",   emoji: "🍽️", description: "Menu CRUD, mini-site web public, QR Code" },
  module_food_cost:        { label: "Food Cost — Marges",          emoji: "💰", description: "Calcul automatique des marges par plat" },
  module_menu_engineering: { label: "Menu Engineering — Carte Marine", emoji: "🧭", description: "Classification Phare/Ancre/Dérive/Écueil + IA" },
  module_receipt_scanner:  { label: "Scanner de Reçus (OCR)",      emoji: "📸", description: "Extraction IA des factures fournisseurs" },
  module_instagram:        { label: "Générateur Instagram",        emoji: "📱", description: "Posts IA pour vos plats avec captions et hashtags" },
  module_reservations:     { label: "Réservations (Libro/Resy/Zenchef)", emoji: "📅", description: "Flux en temps réel de vos réservations depuis vos plateformes" },
  module_smart_prep:       { label: "Smart Prep Lists",            emoji: "🧠", description: "Listes de préparation IA basées sur vos ventes et réservations" },
};

const ROLE_LABELS: Record<MemberRole, { label: string; color: string }> = {
  owner:  { label: "Propriétaire", color: "bg-amber-100 text-amber-800 border-amber-200" },
  admin:  { label: "Administrateur", color: "bg-[#2E4036]/10 text-[#2E4036] border-[#2E4036]/20" },
  editor: { label: "Éditeur", color: "bg-[#CC5833]/10 text-[#CC5833] border-[#CC5833]/20" },
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
  const locale = useLocale();
  const [localSettings, setLocalSettings] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileTagline, setProfileTagline] = useState("");
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
      });
    }
    if (profile) {
      setProfileName(profile.restaurant_name);
      setProfileTagline(profile.tagline || "");
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
        setInviteMsg({ type: 'success', text: data.message || 'Invitation envoyée !' });
        setInviteEmail("");
        loadMembers();
      } else {
        setInviteMsg({ type: 'error', text: data.error || 'Erreur' });
      }
    } catch {
      setInviteMsg({ type: 'error', text: 'Erreur réseau.' });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Retirer ce membre de l'équipe ?")) return;
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
        alert(d.error || "Erreur");
      }
    } catch {
      alert("Erreur réseau.");
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
        alert(d.error || "Erreur");
      }
    } catch {
      alert("Erreur réseau.");
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
      alert("Impossible de charger le portail.");
      setPortalLoading(false);
    }
  };

  if (authLoading) return <div className="p-8 text-center flex-1 font-outfit text-muted-foreground">Chargement...</div>;
  if (!user) return null;

  const canManageTeam = role === 'owner' || role === 'admin';

  return (
    <div className="flex flex-col gap-6 md:gap-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-jakarta font-bold text-foreground tracking-tighter mb-1 md:mb-2">
            Paramètres
          </h1>
          <p className="text-base md:text-lg font-outfit text-muted-foreground opacity-80">
            Gérez vos préférences, modules et équipe
          </p>
        </div>
      </header>

      <div className="max-w-3xl space-y-8">
        {/* Restaurant Profile */}
        <Card className="rounded-[2rem] border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-card p-6 md:p-8 pb-4">
            <CardTitle className="text-lg font-jakarta font-bold text-foreground">Mon Restaurant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6 md:p-8 pt-2">
            <div>
              <label className="block text-sm font-medium font-outfit text-foreground/70 mb-1">Nom du restaurant</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-outfit bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium font-outfit text-foreground/70 mb-1">Slogan</label>
              <input
                type="text"
                value={profileTagline}
                onChange={(e) => setProfileTagline(e.target.value)}
                placeholder="Cuisine française contemporaine"
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-outfit bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="bg-primary hover:bg-[#3A4F43] text-primary-foreground rounded-xl">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </CardContent>
        </Card>

        {/* Team Management */}
        {canManageTeam && (
          <Card className="rounded-[2rem] border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-card p-6 md:p-8 pb-4">
              <CardTitle className="text-lg font-jakarta font-bold text-foreground">Équipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 md:p-8 pt-2">
              <p className="text-sm font-outfit text-muted-foreground">
                Invitez d&apos;autres personnes à co-administrer votre restaurant. Chaque membre reçoit un lien d&apos;invitation.
              </p>

              {/* Invite form */}
              <div className="bg-secondary/50 p-5 rounded-2xl border border-border space-y-3">
                <p className="text-sm font-medium font-jakarta text-foreground">Inviter un membre</p>
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
                    {role === 'owner' && <option value="admin">Administrateur</option>}
                    <option value="editor">Éditeur</option>
                  </select>
                </div>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="bg-accent hover:bg-[#b84d2d] text-accent-foreground w-full rounded-xl">
                  {inviting ? "Envoi..." : "Envoyer l'invitation"}
                </Button>
                {inviteMsg && (
                  <p className={`text-sm font-outfit ${inviteMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {inviteMsg.text}
                  </p>
                )}
              </div>

              {/* Members list */}
              <div className="space-y-2">
                <p className="text-sm font-medium font-jakarta text-foreground">Membres actuels</p>
                {teamLoading ? (
                  <p className="text-sm font-outfit text-muted-foreground">Chargement...</p>
                ) : members.length === 0 ? (
                  <p className="text-sm font-outfit text-muted-foreground">Aucun membre pour le moment.</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => {
                      const roleInfo = ROLE_LABELS[member.role];
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
                                {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(vous)</span>}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleInfo.color}`}>
                                  {roleInfo.label}
                                </span>
                                {isPending && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200 flex items-center gap-1">
                                    <span className="animate-pulse h-1.5 w-1.5 bg-orange-500 rounded-full inline-block"></span>
                                    En attente
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
                                  <option value="admin">Admin</option>
                                  <option value="editor">Éditeur</option>
                                </select>
                              )}
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                                title="Retirer"
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
            <CardTitle className="text-lg font-jakarta font-bold text-foreground">Modules Actifs</CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8 pt-2">
            <p className="text-sm font-outfit text-muted-foreground mb-6">Activez ou désactivez les modules de votre barre de navigation.</p>
            <div className="space-y-3">
              {Object.entries(MODULE_LABELS).map(([key, config]) => {
                const isAllowed = subscription && TIER_CONFIG[subscription.tier].modules[key as keyof TierModules];

                // Find minimum tier required for this module if not allowed
                let requiredTierLabel = "Supérieur";
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
                      <span className="text-2xl">{config.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-sm font-jakarta text-foreground">{config.label}</p>
                          {!isAllowed && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-accent/20">
                              Inclus avec {requiredTierLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-outfit text-muted-foreground">{config.description}</p>
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
            <CardTitle className="text-lg font-jakarta font-bold text-foreground">Compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6 md:p-8 pt-2">
            <p className="text-sm font-outfit text-foreground/70">
              <strong className="text-foreground">Email :</strong> {user.email}
            </p>
            <p className="text-sm font-outfit text-foreground/70">
              <strong className="text-foreground">Slug du menu QR :</strong> /menu/{profile?.slug}
            </p>
            {role && (
              <p className="text-sm font-outfit text-foreground/70">
                <strong className="text-foreground">Rôle :</strong>{" "}
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ROLE_LABELS[role].color}`}>
                  {ROLE_LABELS[role].label}
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Webhooks & Integrations */}
        <Card className="rounded-[2rem] border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-card p-6 md:p-8 pb-4">
            <CardTitle className="text-lg font-jakarta font-bold text-foreground">Intégrations &amp; Webhooks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6 md:p-8 pt-2">
            <p className="text-sm font-outfit text-foreground/70">
              Connectez vos plateformes de réservation (Libro, Resy, etc.) pour bénéficier des <strong className="text-foreground">Smart Prep Lists</strong> (Prédictions IA).
            </p>
            <Button
              onClick={() => router.push('/dashboard/settings/reservations' as any)}
              className="bg-primary hover:bg-[#3A4F43] text-primary-foreground w-full rounded-xl"
            >
              Gérer mes intégrations natives
            </Button>
            <div className="bg-secondary/50 p-5 rounded-2xl border border-border mt-4">
               <div className="flex flex-col gap-2">
                 <span className="text-sm font-medium font-jakarta text-foreground">Webhook Universel Rive</span>
                 <p className="text-xs font-outfit text-muted-foreground mb-2">Copiez ce lien et collez-le dans les paramètres &quot;Webhooks&quot; de votre logiciel de réservation.</p>
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
                        alert('Lien copié !');
                      }}
                    >
                      Copier
                    </Button>
                 </div>
                 <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                    <span className="animate-pulse h-2 w-2 bg-amber-500 rounded-full inline-block shrink-0"></span>
                    <span className="font-outfit">En attente de la première réservation pour activer la prédiction...</span>
                 </div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card className="rounded-[2rem] border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-card p-6 md:p-8 pb-4">
            <CardTitle className="text-lg font-jakarta font-bold text-foreground">Abonnement &amp; Facturation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6 md:p-8 pt-2">
            <p className="text-sm font-outfit text-foreground/70">
              <strong className="text-foreground">Forfait actuel :</strong> <span className="capitalize">{subscription?.tier || 'trial'}</span>
            </p>
            {subscription?.stripeCustomerId ? (
              <Button
                onClick={handlePortalSession}
                disabled={portalLoading}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-xl"
              >
                {portalLoading ? "Chargement du portail..." : "Gérer mon abonnement (Stripe)"}
              </Button>
            ) : (
              <div>
                <p className="text-sm font-outfit text-muted-foreground mb-4">Vous êtes actuellement sur le système d&apos;essai gratuit ou manuel. Vous n&apos;avez pas de facturation automatique configurée.</p>
                <Button onClick={() => router.push('/pricing' as any)} className="bg-accent hover:bg-[#b84d2d] text-accent-foreground rounded-xl">
                  Voir les forfaits
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
