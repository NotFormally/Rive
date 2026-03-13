"use client";

import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SpoilageFormPage() {
  const { settings } = useAuth();
  const t = useTranslations("Coulage");
  const tc = useTranslations("Common");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!settings?.module_variance) {
    return (
      <div className="p-8 text-center text-slate-500">
        {tc("module_disabled")}
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center gap-4">
          <a href="/dashboard/variance" className="text-slate-500 hover:text-slate-900">{t("back")}</a>
          <div>
            <h1 className="text-xl font-bold">{t("title")}</h1>
            <p className="text-sm text-slate-500">{t("description")}</p>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>{t("details_title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="ingredient">{t("product_label")}</Label>
                <select id="ingredient" className="w-full border-slate-200 rounded-md p-2 text-sm bg-white border">
                  <option value="">{t("select_product")}</option>
                  <option value="tequila">{/* i18n-ignore */}Tequila Casamigos Reposado</option>
                  <option value="fût">{/* i18n-ignore */}Fût IPA Locale 50L</option>
                  <option value="verre">{/* i18n-ignore */}Verre à vin (Casse)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qty">{t("quantity_label")}</Label>
                  <Input id="qty" type="number" step="0.5" placeholder={t("quantity_placeholder")} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">{t("unit_label")}</Label>
                  <select id="unit" className="w-full border-slate-200 rounded-md p-2 text-sm bg-white border">
                    <option value="oz">oz</option>
                    <option value="L">{t("unit_liters")}</option>
                    <option value="ml">ml</option>
                    <option value="verre">{t("unit_glass")}</option>
                    <option value="unit">{t("unit_unit")}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">{t("reason_label")}</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-slate-50 border-slate-200">
                    <input type="radio" name="reason" value="spill" className="mr-3" required />
                    {t("reason_spill")}
                  </label>
                  <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-slate-50 border-slate-200">
                    <input type="radio" name="reason" value="comp" className="mr-3" required />
                    {t("reason_comp")}
                  </label>
                  <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-slate-50 border-slate-200">
                    <input type="radio" name="reason" value="spoil" className="mr-3" required />
                    {t("reason_spoil")}
                  </label>
                  <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-slate-50 border-slate-200">
                    <input type="radio" name="reason" value="staff" className="mr-3" required />
                    {t("reason_staff")}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">{t("note_label")}</Label>
                <Input id="note" placeholder={t("note_placeholder")} />
              </div>
            </CardContent>
            
            <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-between rounded-b-lg">
              <Button type="button" variant="ghost">{t("cancel")}</Button>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                {loading ? t("recording") : t("record_loss")}
              </Button>
            </CardFooter>
          </Card>
        </form>

        {success && (
          <div className="mt-4 p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md animate-in fade-in slide-in-from-bottom-2 text-sm font-medium">
            {t("success")}
          </div>
        )}
      </div>
    </>
  );
}
