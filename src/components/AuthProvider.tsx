"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { computeEffectiveModules, type SubscriptionTier, type TierModules } from "@/lib/subscription-tiers";
import type { User } from "@supabase/supabase-js";

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
};

export type ModuleSettings = TierModules;

export type UsageMetrics = {
  logbook_notes: number;
  corrective_actions: number;
  translations: number;
  menu_engineering: number;
  instagram_posts: number;
  receipt_scans: number;
};

type SubscriptionInfo = {
  tier: SubscriptionTier;
  trialExpired: boolean;
  daysLeft: number;
  stripeCustomerId: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: RestaurantProfile | null;
  settings: ModuleSettings | null;
  usage: UsageMetrics | null;
  subscription: SubscriptionInfo | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSettings: () => Promise<void>;
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
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  settings: null,
  usage: null,
  subscription: null,
  loading: true,
  signOut: async () => {},
  refreshSettings: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [settings, setSettings] = useState<ModuleSettings | null>(null);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from("restaurant_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileData) {
      setProfile(profileData);

      const { data: settingsData } = await supabase
        .from("restaurant_settings")
        .select("*")
        .eq("restaurant_id", profileData.id)
        .single();

      if (settingsData) {
        // Compute effective modules based on subscription tier
        const { modules, tier, trialExpired, daysLeft } = computeEffectiveModules(settingsData);
        setSettings(modules);
        setUsage(settingsData.usage_metrics || null);
        setSubscription({ tier, trialExpired, daysLeft, stripeCustomerId: settingsData.stripe_customer_id || null });
      } else {
        setSettings(defaultSettings);
        setUsage(null);
        setSubscription({ tier: 'trial', trialExpired: false, daysLeft: 14, stripeCustomerId: null });
      }
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
      const { modules, tier, trialExpired, daysLeft } = computeEffectiveModules(data);
      setSettings(modules);
      setUsage(data.usage_metrics || null);
      setSubscription({ tier, trialExpired, daysLeft, stripeCustomerId: data.stripe_customer_id || null });
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadProfile(currentUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await loadProfile(currentUser.id);
        } else {
          setProfile(null);
          setSettings(null);
          setUsage(null);
          setSubscription(null);
        }
        setLoading(false);
      }
    );

    return () => authSub.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSettings(null);
    setUsage(null);
    setSubscription(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, settings, usage, subscription, loading, signOut, refreshSettings }}>
      {children}
    </AuthContext.Provider>
  );
}
