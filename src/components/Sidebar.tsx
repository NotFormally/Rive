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
  Beer
} from "lucide-react";

export function Sidebar() {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const { profile, settings, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { name: t("nav_overview"), href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: t("nav_menu"), href: "/dashboard/menu", icon: MenuSquare, show: settings?.module_menu_editor },
    { name: t("nav_foodcost"), href: "/dashboard/food-cost", icon: Calculator, show: settings?.module_food_cost },
    { name: t("nav_engineering"), href: "/dashboard/engineering", icon: Compass, show: settings?.module_menu_engineering },
    { name: t("nav_deposits"), href: "/dashboard/deposits", icon: Recycle, show: settings?.module_deposits },
    { name: t("nav_variance"), href: "/dashboard/variance", icon: Droplets, show: settings?.module_variance },
    { name: t("nav_reservations"), href: "/dashboard/reservations", icon: CalendarDays, show: settings?.module_reservations },
    { name: t("nav_smartprep"), href: "/dashboard/prep-list", icon: Brain, show: settings?.module_smart_prep },
    { name: t("nav_social"), href: "/dashboard/social", icon: Share2, show: settings?.module_instagram },
    { name: t("nav_production"), href: "/dashboard/production", icon: Beer, show: settings?.module_production },
    { name: t("nav_settings"), href: "/dashboard/settings", icon: Settings, show: true },
  ];

  const handleNavClick = () => setMobileOpen(false);

  const sidebarContent = (
    <>
      <div className="p-8">
        <h1 className="text-3xl font-jakarta font-bold text-[--sidebar-foreground] tracking-tighter">Rive</h1>
        <div className="h-px w-12 bg-[--sidebar-primary] mt-2 opacity-60"></div>
        <p className="text-[10px] text-[--sidebar-foreground] opacity-40 mt-4 uppercase tracking-[0.2em] font-plex-mono font-bold">
          {profile?.restaurant_name || t("restaurant_space")}
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        {navItems.filter(item => item.show).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] text-sm font-outfit ${
                isActive
                  ? "bg-[--sidebar-primary] text-[--sidebar-primary-foreground] shadow-lg shadow-black/20 font-bold"
                  : "text-[--sidebar-foreground] opacity-70 hover:opacity-100 hover:bg-[--sidebar-accent] hover:-translate-y-[1px]"
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-50"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto border-t border-[--sidebar-border]">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-sm font-outfit text-[--sidebar-foreground] opacity-50 hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
        >
          <LogOut className="w-4 h-4" />
          {t("btn_logout")}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-6 left-6 z-50 bg-[--sidebar] text-[--sidebar-foreground] p-3 rounded-2xl shadow-xl border border-[--sidebar-border]"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-over Sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[--sidebar] text-[--sidebar-foreground] flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } shadow-2xl border-r border-[--sidebar-border]`}
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
    </>
  );
}

