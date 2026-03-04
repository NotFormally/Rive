"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useAuth } from "@/components/AuthProvider";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  MenuSquare,
  Calculator,
  Compass,
  CalendarDays,
  Brain,
  Settings,
  LogOut,
  Menu,
  X,
  Share2,
  Recycle,
  Droplets,
  Beer,
  Gauge,
  ChevronDown,
  ChevronRight,
  Globe,
  Sparkles
} from "lucide-react";

export function Sidebar() {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const { profile, settings, signOut } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("finance");

  const handleNavClick = () => setMobileOpen(false);

  // Group I. Le Quotidien (Opérations)
  const navDaily = [
    { name: t("nav_overview"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("nav_menu"), href: "/dashboard/menu", icon: MenuSquare },
    { name: t("nav_reservations"), href: "/dashboard/reservations", icon: CalendarDays },
    { name: t("nav_social"), href: "/dashboard/social", icon: Share2 }
  ];

  // Group II. Cuisine & Performance
  const navFinance = [
    { name: t("nav_foodcost"), href: "/dashboard/food-cost", icon: Calculator },
    { name: t("nav_engineering"), href: "/dashboard/engineering", icon: Compass },
    { name: t("nav_variance"), href: "/dashboard/variance", icon: Droplets }
  ];
  
  const navProduction = [
    { name: t("nav_smartprep"), href: "/dashboard/prep-list", icon: Brain },
    { name: t("nav_production"), href: "/dashboard/production", icon: Beer },
    { name: t("nav_deposits"), href: "/dashboard/deposits", icon: Recycle }
  ];

  // Group III. Système
  const navSystem = [
    { name: t("nav_multilingual_team") || "Équipe Multilingue", href: "/dashboard/multilingual", icon: Globe },
    { name: t("nav_my_intelligence"), href: "/dashboard/my-intelligence", icon: Gauge },
    { name: t("nav_settings"), href: "/dashboard/settings", icon: Settings }
  ];

  const renderNavGroup = (items: typeof navDaily) => items.map((item) => {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleNavClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] text-sm font-outfit ${
          isActive
            ? "bg-[--sidebar-primary] text-[--sidebar-primary-foreground] shadow-lg shadow-black/20 font-bold"
            : "text-[--sidebar-foreground] opacity-90 hover:opacity-100 hover:bg-[--sidebar-accent] hover:-translate-y-[1px]"
        }`}
      >
        <item.icon className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-80"}`} />
        {item.name}
      </Link>
    );
  });

  const sidebarContent = (
    <>
      <div className="p-8">
        <h1 className="text-2xl font-outfit font-semibold text-[--sidebar-foreground] tracking-[0.3em] uppercase">RIVE</h1>
        <div className="h-px w-12 bg-[--sidebar-primary] mt-2 opacity-80"></div>
        <p className="text-[10px] text-[--sidebar-foreground] opacity-70 mt-4 uppercase tracking-[0.2em] font-plex-mono font-bold">
          {profile?.restaurant_name || t("restaurant_space")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-6 custom-scrollbar-hidden">
        
        {/* I. Le Quotidien */}
        <section>
          <div className="px-4 mb-2">
            <span className="text-[10px] font-plex-mono text-[--sidebar-foreground] opacity-50 uppercase tracking-[0.15em]">Le Quotidien</span>
          </div>
          <nav className="space-y-1">
            {renderNavGroup(navDaily)}
          </nav>
        </section>

        {/* II. L'Arrière-Boutique */}
        <section>
          <div className="px-4 mb-2">
            <span className="text-[10px] font-plex-mono text-[--sidebar-foreground] opacity-50 uppercase tracking-[0.15em]">L'Arrière-Boutique</span>
          </div>
          <div className="space-y-2">
            
            {/* Accordion Finance */}
            <div>
              <button 
                onClick={() => setOpenSection(openSection === "finance" ? null : "finance")}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-[--sidebar-foreground] opacity-90 hover:opacity-100 hover:bg-[--sidebar-accent] transition-all duration-300 text-sm font-outfit"
              >
                <div className="flex items-center gap-3">
                  <Calculator className="w-4 h-4 opacity-80" />
                  <span>Intelligence Financière</span>
                </div>
                {openSection === "finance" ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
              </button>
              {openSection === "finance" && (
                <div className="mt-1 ml-4 pl-4 border-l border-[--sidebar-border] space-y-1">
                  {renderNavGroup(navFinance)}
                </div>
              )}
            </div>

            {/* Accordion Production */}
            <div>
              <button 
                onClick={() => setOpenSection(openSection === "production" ? null : "production")}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-[--sidebar-foreground] opacity-90 hover:opacity-100 hover:bg-[--sidebar-accent] transition-all duration-300 text-sm font-outfit"
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-4 h-4 opacity-80" />
                  <span>Production & Suivi</span>
                </div>
                {openSection === "production" ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
              </button>
              {openSection === "production" && (
                <div className="mt-1 ml-4 pl-4 border-l border-[--sidebar-border] space-y-1">
                  {renderNavGroup(navProduction)}
                </div>
              )}
            </div>

          </div>
        </section>

        {/* III. Système */}
        <section>
          <div className="px-4 mb-2">
            <span className="text-[10px] font-plex-mono text-[--sidebar-foreground] opacity-50 uppercase tracking-[0.15em]">Système</span>
          </div>
          <nav className="space-y-1">
            {renderNavGroup(navSystem)}
          </nav>
        </section>
        
      </div>

      <div className="p-4 border-t border-[--sidebar-border] shrink-0 flex flex-col gap-2">
        <div className="bg-[#1A1A1A]/40 border border-white/5 p-3 rounded-2xl flex items-center justify-between shadow-inner">
          <div className="flex flex-col">
             <span className="font-plex-mono text-[9px] uppercase tracking-wider text-[--sidebar-foreground] opacity-50">{t("active_language") || "Langue Active"}</span>
             <span className="font-jakarta text-xs font-bold text-[--sidebar-foreground] mt-0.5">Français (FR)</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
             <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-sm font-outfit text-[--sidebar-foreground] opacity-80 hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
        >
          <LogOut className="w-4 h-4" />
          {t("btn_logout")}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button (forced z-index vs gradient background) */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-6 left-6 z-[60] bg-[--primary] text-white p-3 rounded-2xl shadow-2xl border border-white/10"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-[50] transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-over Sidebar (bg-slate-900 enforced for dark contrast) */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-[60] w-72 bg-slate-900 border-r border-white/10 [color-scheme:dark] text-slate-100 flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } shadow-2xl`}
        style={{
          "--sidebar-primary": "#CC5833",
          "--sidebar-primary-foreground": "#F2F0E9",
          "--sidebar-foreground": "#F8FAFC",
          "--sidebar-accent": "rgba(255,255,255,0.05)",
          "--sidebar-border": "rgba(255,255,255,0.1)",
        } as React.CSSProperties}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-6 right-6 text-[--sidebar-foreground] opacity-50 hover:opacity-100"
          aria-label="Fermer le menu"
        >
          <X className="w-6 h-6" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-64 bg-[--sidebar] min-h-screen text-[--sidebar-foreground] flex-col fixed left-0 top-0 border-r border-[--sidebar-border] shadow-2xl z-30">
        {sidebarContent}
      </aside>
      
      {/* Hide scrollbar utility within same file for quick fix */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar-hidden::-webkit-scrollbar { display: none; }
        .custom-scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}

