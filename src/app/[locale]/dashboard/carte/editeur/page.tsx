"use client";

import { useAuth } from "@/components/AuthProvider";
import { MenuEditor } from "@/components/MenuEditor";
import { useTranslations } from "next-intl";

export default function MenuEditorPage() {
  const { settings, profile } = useAuth();
  const t = useTranslations("CartEditor");
  const tc = useTranslations("Common");

  if (!settings?.module_menu_editor) {
    return (
      <div className="p-8 text-center text-slate-500">
        {tc("module_disabled")}
      </div>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4">
        <div>
          <h1 className="text-xl font-bold">{t("title")}</h1>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </div>
      </header>

      <div className="p-8 max-w-5xl">
        <MenuEditor restaurantId={profile?.id} />
      </div>
    </>
  );
}
