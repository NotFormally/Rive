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
  X
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
    { name: t("nav_reservations"), href: "/dashboard/reservations", icon: CalendarDays, show: settings?.module_reservations },
    { name: t("nav_smartprep"), href: "/dashboard/prep-list", icon: Brain, show: settings?.module_smart_prep },
    { name: t("nav_settings"), href: "/dashboard/settings", icon: Settings, show: true },
  ];

  const handleNavClick = () => setMobileOpen(false);

  const sidebarContent = (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Rive</h1>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
          {profile?.restaurant_name || t("restaurant_space")}
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.filter(item => item.show).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-indigo-200" : "text-slate-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
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
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-2 rounded-lg shadow-lg"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-over Sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          aria-label="Fermer le menu"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 min-h-screen text-slate-300 flex-col fixed left-0 top-0">
        {sidebarContent}
      </aside>
    </>
  );
}

