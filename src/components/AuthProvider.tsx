"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { computeEffectiveModules, type SubscriptionTier, type TierModules } from "@/lib/subscription-tiers";
import type { IntelligenceLevel } from "@/lib/intelligence-score";
import type { HealthGrade } from "@/lib/health-score";
import type { User } from "@supabase/supabase-js";

export type MemberRole = 'owner' | 'admin' | 'editor';

export type RestaurantProfile = {
  id: string;
  user_id: string;
  restaurant_name: string;
  slug: string;
  tagline: string;
  address: string;
  phone: string;
  hours: string;
  logo_url: string | null;
  social_media_context?: string;
  hourly_labor_cost?: number;
};

export type ModuleSettings = TierModules;

export type UsageMetrics = {
  logbook_notes: number;
  corrective_actions: number;
  translations: number;
  menu_engineering: number;
  instagram_posts: number;
  receipt_scans: number;
  // Extended metrics (La Traversée)
  food_cost_reports: number;
  deposit_entries: number;
  variance_reports: number;
  production_batches: number;
  smart_prep_generations: number;
  reservation_syncs: number;
};

type SubscriptionInfo = {
  tier: SubscriptionTier;
  stripeCustomerId: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: RestaurantProfile | null;
  role: MemberRole | null;
  settings: ModuleSettings | null;
  usage: UsageMetrics | null;
  subscription: SubscriptionInfo | null;
  intelligenceScore: number | null;
  intelligenceLevel: IntelligenceLevel | null;
  healthScore: number | null;
  healthGrade: HealthGrade | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const defaultSettings: ModuleSettings = {
  module_logbook: true,
  module_menu_editor: true,
  module_food_cost: true,
  module_menu_engineering: true,
  module_instagram: false,
  module_receipt_scanner: true,
  module_reservations: true,
  module_smart_prep: true,
  module_deposits: true,
  module_variance: true,
  module_production: true,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  settings: null,
  usage: null,
  subscription: null,
  intelligenceScore: null,
  intelligenceLevel: null,
  healthScore: null,
  healthGrade: null,
  loading: true,
  signOut: async () => {},
  refreshSettings: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [role, setRole] = useState<MemberRole | null>(null);
  const [settings, setSettings] = useState<ModuleSettings | null>(null);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [intelligenceScore, setIntelligenceScore] = useState<number | null>(null);
  const [intelligenceLevel, setIntelligenceLevel] = useState<IntelligenceLevel | null>(null);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [healthGrade, setHealthGrade] = useState<HealthGrade | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    try {
      // 1. Find membership (which restaurant does this user belong to?)
      const { data: membership, error: memberError } = await supabase
        .from("restaurant_members")
        .select("restaurant_id, role")
        .eq("user_id", userId)
        .not("accepted_at", "is", null)
        .limit(1)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        console.error("[AuthProvider] DB Error loading membership:", memberError);
      }

      if (!membership) {
         console.warn("[AuthProvider] No active membership found for user. Team Management will be hidden.");
         return;
      }

      setRole(membership.role as MemberRole);

      // 2. Load the restaurant profile
      const { data: profileData, error: profileError } = await supabase
        .from("restaurant_profiles")
        .select("*")
        .eq("id", membership.restaurant_id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("[AuthProvider] DB Error loading profile:", profileError);
      }

      if (profileData) {
        setProfile(profileData);

        // 3, 4 & 5. Load settings + intelligence score + health score in parallel
        const [settingsResult, scoreResult, healthResult] = await Promise.all([
          supabase
            .from("restaurant_settings")
            .select("*")
            .eq("restaurant_id", profileData.id)
            .single(),
          supabase
            .from("restaurant_intelligence_score")
            .select("score, level")
            .eq("restaurant_id", profileData.id)
            .single(),
          supabase
            .from("restaurant_health_scores")
            .select("total_score, grade")
            .eq("restaurant_id", profileData.id)
            .maybeSingle(),
        ]);

        const { data: settingsData } = settingsResult;
        if (settingsData) {
          const { modules, tier } = computeEffectiveModules(settingsData);
          setSettings(modules);
          setUsage(settingsData.usage_metrics || null);
          setSubscription({ tier, stripeCustomerId: settingsData.stripe_customer_id || null });
        } else {
          setSettings(defaultSettings);
          setUsage(null);
          setSubscription({ tier: 'free', stripeCustomerId: null });
        }

        const { data: scoreData } = scoreResult;
        if (scoreData) {
          setIntelligenceScore(scoreData.score);
          setIntelligenceLevel(scoreData.level as IntelligenceLevel);
        } else {
          setIntelligenceScore(0);
          setIntelligenceLevel('discovery');
        }

        const { data: healthData } = healthResult;
        if (healthData) {
          setHealthScore(healthData.total_score);
          setHealthGrade(healthData.grade as HealthGrade);
        }
      }
    } catch (err) {
      console.error("Critical error in loadProfile:", err);
    }
  };

  const refreshSettings = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("restaurant_settings")
      .select("*")
      .eq("restaurant_id", profile.id)
      .single();
    if (data) {
      const { modules, tier } = computeEffectiveModules(data);
      setSettings(modules);
      setUsage(data.usage_metrics || null);
      setSubscription({ tier, stripeCustomerId: data.stripe_customer_id || null });
    } else {
      setSettings(defaultSettings);
      setUsage(null);
      setSubscription({ tier: 'free', stripeCustomerId: null });
    }
  };

  const refreshProfile = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("restaurant_profiles")
      .select("*")
      .eq("id", profile.id)
      .single();
      
    if (!error && data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Failsafe: if Supabase hangs indefinitely or throws silently, force loading to false after 3 seconds.
    const fallbackTimeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3000);

    // Check initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error("Initial getSession error:", error);
      const currentUser = session?.user ?? null;
      if (isMounted) setUser(currentUser);
      
      if (currentUser) {
        loadProfile(currentUser.id).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        if (isMounted) setLoading(false);
      }
    }).catch(e => {
      console.error("Unhandled rejection in getSession:", e);
      if (isMounted) setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          const currentUser = session?.user ?? null;
          if (isMounted) setUser(currentUser);
          
          if (currentUser) {
            await loadProfile(currentUser.id);
          } else {
            if (isMounted) {
              setProfile(null);
              setRole(null);
              setSettings(null);
              setUsage(null);
              setSubscription(null);
              setIntelligenceScore(null);
              setIntelligenceLevel(null);
              setHealthScore(null);
              setHealthGrade(null);
            }
          }
        } catch (e) {
          console.error("Unhandled error in onAuthStateChange:", e);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      authSub.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
    setSettings(null);
    setUsage(null);
    setSubscription(null);
    setIntelligenceScore(null);
    setIntelligenceLevel(null);
    setHealthScore(null);
    setHealthGrade(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, settings, usage, subscription, intelligenceScore, intelligenceLevel, healthScore, healthGrade, loading, signOut, refreshSettings, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
