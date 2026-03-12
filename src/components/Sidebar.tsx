"use client";

import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useAuth } from "@/components/AuthProvider";
import { useTranslations } from "next-intl";
import Image from "next/image";
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
  Globe,
  Sparkles,
  Navigation2,
  BookOpen,
  Flag,
  CloudRain,
  Radar,
  ClipboardList,
  Mic,
  Telescope,
  Boxes,
  Waypoints,
  SlidersHorizontal,
  ScanLine,
} from "lucide-react";

export function Sidebar() {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const router = useRouter();
  const { profile, settings, signOut } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = () => setMobileOpen(false);

  const s = settings || {
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

  // Zone I. La Passerelle (The Bridge — Command & Overview)
  const navPasserelle = [
    { name: t("nav_overview"), href: "/dashboard", icon: LayoutDashboard },
    ...(s.module_menu_editor ? [{ name: t("nav_carte"), href: "/dashboard/carte", icon: Compass }] : []),
    ...(s.module_instagram ? [{ name: t("nav_pavillon"), href: "/dashboard/pavillon", icon: Flag }] : []),
    ...(s.module_menu_engineering ? [{ name: t("nav_compas"), href: "/dashboard/compas", icon: Gauge }] : []),
    { name: t("nav_estime"), href: "/dashboard/estime", icon: Sparkles },
  ];

  // Zone II. La Réserve (The Hold — Inventory & Cost)
  const navRéserve = [
    ...(s.module_receipt_scanner ? [{ name: t("nav_reception_ocr"), href: "/dashboard/reserve/reception", icon: ScanLine }] : []),
    ...(s.module_food_cost ? [{ name: t("nav_foodcost"), href: "/dashboard/reserve", icon: Calculator }] : []),
    ...(s.module_variance ? [{ name: t("nav_variance"), href: "/dashboard/reserve/tirant", icon: Droplets }] : []),
    ...(s.module_deposits ? [{ name: t("nav_deposits"), href: "/dashboard/reserve/lest", icon: Recycle }] : []),
    ...(s.module_production ? [{ name: t("nav_production"), href: "/dashboard/reserve/production", icon: Beer }] : []),
  ];

  // Zone III. La Manœuvre (Operations — Service & Prep)
  const navManoeuvre = [
    ...(s.module_smart_prep ? [
      { name: t("nav_appareillage"), href: "/dashboard/quart/appareillage", icon: Brain },
      { name: t("nav_dictee_voice"), href: "/dashboard/atelier/production/voice", icon: Mic }
    ] : []),
    ...(s.module_reservations ? [{ name: t("nav_mouillage"), href: "/dashboard/quart/mouillage", icon: CalendarDays }] : []),
    { name: t("nav_sonar"), href: "/dashboard/quart/sonar", icon: Radar },
    { name: t("nav_haccp_runner"), href: "/dashboard/quart/sonar/audit-demo", icon: ClipboardList },
    { name: t("nav_haccp_checklists"), href: "/dashboard/gouvernail/haccp-checklists", icon: Boxes },
    { name: t("nav_temperature_logs"), href: "/dashboard/gouvernail/temperature-logs", icon: Waypoints },
    ...(s.module_menu_editor ? [{ name: t("nav_menu"), href: "/dashboard/carte/editeur", icon: MenuSquare }] : []),
  ];

  // Zone IV. Le Journal de Bord (The Ship's Log — Analytics & Finance)
  const navJournal = [
    ...(s.module_logbook ? [{ name: t("nav_nid"), href: "/dashboard/journal", icon: BookOpen }] : []),
    { name: t("nav_barometre"), href: "/dashboard/journal/barometre", icon: CloudRain },
  ];

  // Zone V. Le Gouvernail (Dry Dock — Settings & Config)
  const navGouvernail = [
    { name: t("nav_greement"), href: "/dashboard/gouvernail", icon: Settings },
    { name: t("nav_haccp_builder"), href: "/dashboard/gouvernail/haccp-builder", icon: ClipboardList },
    { name: t("nav_multilingual_team"), href: "/dashboard/multilingual", icon: Globe },
  ];

  const renderNavGroup = (items: any[]) => items.map((item) => {
    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleNavClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] text-sm font-outfit ${
          isActive
            ? "bg-[--sidebar-primary] text-[--sidebar-primary-foreground] shadow-[0_0_20px_rgba(0,229,255,0.15)] border border-[--sidebar-primary-foreground]/30 font-bold"
            : "text-[--sidebar-foreground] opacity-70 hover:opacity-100 hover:bg-[--sidebar-accent] hover:-translate-y-[1px]"
        }`}
      >
        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "opacity-100 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" : "opacity-70"}`} />
        <span className="truncate">{item.name}</span>
      </Link>
    );
  });

  const sidebarContent = (
    <>
      <div 
        onClick={() => {
          handleNavClick();
          router.push("/dashboard/gouvernail");
        }}
        className="p-8 cursor-pointer group flex flex-col items-center sm:items-start"
      >
        {profile?.logo_url ? (
          <div className="relative w-full max-w-[140px] aspect-[3/2] mb-2 shadow-[0_0_15px_rgba(34,211,238,0.15)] group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all overflow-hidden rounded-lg bg-white/5 p-2">
            <Image 
              src={profile.logo_url} 
              alt={profile?.restaurant_name || "Restaurant Logo"} 
              fill 
              className="object-contain drop-shadow-md"
              priority
            />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-outfit tracking-[0.05em] text-[--sidebar-foreground] drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] group-hover:text-primary transition-colors text-center sm:text-left"><span className="font-semibold">Rive</span><span className="font-bold">Hub</span></h1>
            <div className="h-px w-12 bg-[--sidebar-primary] mt-2 opacity-80 shadow-[0_0_10px_rgba(34,211,238,0.8)] group-hover:w-full transition-all duration-300 mx-auto sm:mx-0"></div>
          </>
        )}
        <p className="text-[10px] text-[--sidebar-foreground] opacity-70 mt-4 uppercase tracking-[0.2em] font-plex-mono font-bold group-hover:opacity-100 transition-opacity text-center sm:text-left w-full truncate">
          {profile?.restaurant_name || t("restaurant_space")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-5 pb-6 custom-scrollbar-hidden">

        {/* I. La Passerelle */}
        <section>
          <div className="px-4 mb-2 flex items-center gap-2">
            <Telescope className="w-3 h-3 text-[--sidebar-foreground] opacity-40" />
            <span className="text-[10px] font-plex-mono text-[--sidebar-foreground] opacity-50 uppercase tracking-[0.15em]">{t("section_passerelle")}</span>
          </div>
          <nav className="space-y-1">
            {renderNavGroup(navPasserelle)}
          </nav>
        </section>

        {navRéserve.length > 0 && (
        <section>
          <div className="px-4 mb-2 flex items-center gap-2">
            <Boxes className="w-3 h-3 text-[--sidebar-foreground] opacity-40" />
            <span className="text-[10px] font-plex-mono text-[--sidebar-foreground] opacity-50 uppercase tracking-[0.15em]">{t("section_reserve")}</span>
          </div>
          <nav className="space-y-1">
            {renderNavGroup(navRéserve)}
          </nav>
        </section>
        )}

        {/* III. La Manœuvre */}
        <section>
          <div className="px-4 mb-2 flex items-center gap-2">
            <Waypoints className="w-3 h-3 text-[--sidebar-foreground] opacity-40" />
            <span className="text-[10px] font-plex-mono text-[--sidebar-foreground] opacity-50 uppercase tracking-[0.15em]">{t("section_manoeuvre")}</span>
          </div>
          <nav className="space-y-1">
            {renderNavGroup(navManoeuvre)}
          </nav>
        </section>

        {/* IV. Le Journal de Bord */}
        <section>
          <div className="px-4 mb-2 flex items-center gap-2">
            <BookOpen className="w-3 h-3 text-[--sidebar-foreground] opacity-40" />
            <span className="text-[10px] font-plex-mono text-[--sidebar-foreground] opacity-50 uppercase tracking-[0.15em]">{t("section_journal")}</span>
          </div>
          <nav className="space-y-1">
            {renderNavGroup(navJournal)}
          </nav>
        </section>

        <section>
          <div className="px-4 mb-2 flex items-center gap-2">
            <SlidersHorizontal className="w-3 h-3 text-[--sidebar-foreground] opacity-40" />
            <span className="text-[10px] font-plex-mono text-[--sidebar-foreground] opacity-50 uppercase tracking-[0.15em]">{t("section_gouvernail")}</span>
          </div>
          <nav className="space-y-1">
            {renderNavGroup(navGouvernail)}
          </nav>
        </section>

      </div>

      <div className="p-4 border-t border-[--sidebar-border] shrink-0 flex flex-col gap-2">
        <div className="bg-[#1A1A1A]/40 border border-white/5 p-3 rounded-2xl flex items-center justify-between shadow-inner">
          <div className="flex flex-col">
             <span className="font-plex-mono text-[9px] uppercase tracking-wider text-[--sidebar-foreground] opacity-50">{t("current_language")}</span>
             <span className="font-jakarta text-xs font-bold text-[--sidebar-foreground] mt-0.5">{t("active_language")}</span>
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
        aria-label={t("aria_open_menu")}
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

      {/* Mobile Slide-over Sidebar (bg-[#0B131E] enforced for oceanic dark contrast) */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-[60] w-72 bg-[#0B131E] border-r border-cyan-500/10 [color-scheme:dark] text-slate-100 flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } shadow-[0_0_40px_rgba(0,0,0,0.8)]`}
        style={{
          "--sidebar-primary": "#06b6d4",
          "--sidebar-primary-foreground": "#ffffff",
          "--sidebar-foreground": "#e2e8f0",
          "--sidebar-accent": "rgba(34,211,238,0.1)",
          "--sidebar-border": "rgba(34,211,238,0.15)",
        } as React.CSSProperties}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-6 right-6 text-[--sidebar-foreground] opacity-50 hover:opacity-100"
          aria-label={t("aria_close_menu")}
        >
          <X className="w-6 h-6" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-64 bg-[--sidebar] backdrop-blur-3xl h-screen text-[--sidebar-foreground] flex-col fixed left-0 top-0 border-r border-[--sidebar-border] shadow-[0_0_40px_rgba(0,0,0,0.5)] z-30">
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

