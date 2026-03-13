"use client";

import { useAuth } from "@/components/AuthProvider";
import { MenuImportWizard } from "@/components/menu-import/MenuImportWizard";
import { useTranslations } from "next-intl";

export default function MenuImportPage() {
  const { settings, profile } = useAuth();
  const t = useTranslations("MenuImport");
  const tc = useTranslations("Common");

  if (!settings?.module_menu_editor) {
    return (
      <div className="p-8 text-center text-slate-500">
        {tc("module_disabled")}
      </div>
    );
  }

  if (!profile?.id) {
    return (
      <div className="p-8 text-center text-slate-500">
        {tc("loading")}
      </div>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4">
        <div>
          <h1 className="text-xl font-bold">{t("page_title")}</h1>
          <p className="text-sm text-slate-500">{t("page_subtitle")}</p>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-4xl">
        <MenuImportWizard restaurantId={profile.id} />
      </div>
    </>
  );
}
