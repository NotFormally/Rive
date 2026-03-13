"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTranslations } from "next-intl";
import { ChevronDown, Store, Shield, Pencil, Crown } from "lucide-react";

const ROLE_CONFIG = {
  owner: { icon: Crown, color: "text-amber-400" },
  admin: { icon: Shield, color: "text-cyan-400" },
  editor: { icon: Pencil, color: "text-slate-400" },
} as const;

export function RestaurantSwitcher() {
  const t = useTranslations("RestaurantSwitcher");
  const { profile, restaurants, switchRestaurant } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Don't show switcher if user has only 1 restaurant
  if (restaurants.length <= 1) {
    return (
      <p className="text-[10px] text-[--sidebar-foreground] opacity-70 mt-4 uppercase tracking-[0.2em] font-plex-mono font-bold text-center sm:text-left w-full truncate">
        {profile?.restaurant_name || t("label")}
      </p>
    );
  }

  const handleSwitch = async (restaurantId: string) => {
    if (restaurantId === profile?.id) {
      setIsOpen(false);
      return;
    }
    setSwitching(true);
    setIsOpen(false);
    await switchRestaurant(restaurantId);
    setSwitching(false);
  };

  return (
    <div className="relative mt-3 w-full" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="w-full flex items-center justify-between gap-1 px-3 py-2 rounded-xl hover:bg-white/5 transition-all duration-200 group border border-transparent hover:border-cyan-500/20"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Store className="w-3.5 h-3.5 text-cyan-400 shrink-0 opacity-70 group-hover:opacity-100" />
          <span className="text-[10px] text-[--sidebar-foreground] opacity-80 group-hover:opacity-100 uppercase tracking-[0.15em] font-plex-mono font-bold truncate">
            {switching ? t("switching") : (profile?.restaurant_name || t("label"))}
          </span>
        </div>
        <ChevronDown className={`w-3 h-3 text-[--sidebar-foreground] opacity-50 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full pt-1 z-50">
          <div className="bg-[#0F1923] rounded-xl shadow-2xl border border-cyan-500/15 p-1.5 animate-in fade-in zoom-in-95 duration-200 max-h-[280px] overflow-y-auto">
            <div className="px-3 py-1.5">
              <span className="text-[8px] uppercase tracking-[0.2em] text-[--sidebar-foreground] opacity-40 font-plex-mono">{t("label")}</span>
            </div>
            {restaurants.map((r) => {
              const isActive = r.restaurant_id === profile?.id;
              const roleConfig = ROLE_CONFIG[r.role];
              const RoleIcon = roleConfig.icon;
              return (
                <button
                  key={r.restaurant_id}
                  onClick={() => handleSwitch(r.restaurant_id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-start gap-2.5 group/item ${
                    isActive
                      ? 'bg-cyan-500/10 border border-cyan-500/20'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-outfit font-semibold truncate ${isActive ? 'text-cyan-300' : 'text-[--sidebar-foreground] opacity-90'}`}>
                        {r.restaurant_name}
                      </span>
                    </div>
                    {r.address && (
                      <p className="text-[9px] text-[--sidebar-foreground] opacity-40 truncate mt-0.5 font-plex-mono">
                        {r.address}
                      </p>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 shrink-0 mt-0.5 ${roleConfig.color}`}>
                    <RoleIcon className="w-3 h-3" />
                    <span className="text-[8px] uppercase tracking-wider font-plex-mono">{t(`role_${r.role}`)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
