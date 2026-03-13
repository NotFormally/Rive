"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, ArrowLeft, Save, Sparkles, RotateCcw } from "lucide-react";
import { MenuImportUploader } from "./MenuImportUploader";
import { MenuImportPreview } from "./MenuImportPreview";
import { bulkSaveMenuImport } from "@/lib/menu-import-save";
import { supabase } from "@/lib/supabase";
import type { MenuExtractionResult } from "@/app/api/extract-menu/route";

type WizardStatus = 'idle' | 'compressing' | 'uploading' | 'analyzing' | 'preview' | 'saving' | 'success' | 'error';

interface MenuImportWizardProps {
  restaurantId: string;
}

export function MenuImportWizard({ restaurantId }: MenuImportWizardProps) {
  const t = useTranslations("MenuImport");
  const [status, setStatus] = useState<WizardStatus>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const [extractedData, setExtractedData] = useState<MenuExtractionResult | null>(null);
  const [source, setSource] = useState<string>('');
  const [saveResult, setSaveResult] = useState<{ categories: number; items: number; ingredients: number; recipes: number } | null>(null);

  const handleExtracted = (data: MenuExtractionResult, src: string) => {
    setExtractedData(data);
    setSource(src);
    setStatus('preview');
    setErrorMessage('');
  };

  const handleSave = async () => {
    if (!extractedData) return;

    setStatus('saving');
    const result = await bulkSaveMenuImport(supabase, restaurantId, extractedData);

    if (result.success) {
      setSaveResult(result.counts);
      setStatus('success');
      toast.success(t('success_title'));
    } else {
      setStatus('error');
      setErrorMessage(result.error || t('error_save_failed'));
      toast.error(t('error_save_failed'));
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setExtractedData(null);
    setSource('');
    setErrorMessage('');
    setSaveResult(null);
  };

  // Step 1 & processing states — handled by uploader
  const isUploadPhase = status === 'idle' || status === 'compressing' || status === 'uploading' || status === 'analyzing' || (status === 'error' && !extractedData);
  if (isUploadPhase) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            {t('page_title')}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">{t('page_subtitle')}</p>
        </div>
        <div className="p-6">
          <MenuImportUploader
            onExtracted={handleExtracted}
            status={status}
            setStatus={(s) => setStatus(s as WizardStatus)}
            setErrorMessage={setErrorMessage}
          />
          {status === 'error' && errorMessage && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm">{errorMessage}</p>
                <button
                  onClick={handleReset}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 underline"
                >
                  {t('btn_try_another')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Preview & Edit
  if (status === 'preview' && extractedData) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t('preview_title')}</h2>
              <p className="text-sm text-zinc-500 mt-0.5">{t('preview_subtitle')}</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('btn_try_another')}
            </button>
          </div>
          <div className="p-6">
            <MenuImportPreview
              data={extractedData}
              onChange={setExtractedData}
            />
          </div>
        </div>

        {/* Save bar */}
        <div className="sticky bottom-4 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {t('save_confirm_body', {
              categories: extractedData.categories.length,
              items: extractedData.categories.reduce((s, c) => s + c.items.length, 0),
              ingredients: new Set(extractedData.categories.flatMap(c => c.items.flatMap(i => (i.inferredIngredients || []).map(ing => ing.name.toLowerCase())))).size,
            })}
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            {t('btn_save_all')}
          </button>
        </div>
      </div>
    );
  }

  // Saving state
  if (status === 'saving') {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-16 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{t('status_saving')}</h3>
      </div>
    );
  }

  // Success state
  if (status === 'success' && saveResult) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-12 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t('success_title')}</h3>
          <p className="text-sm text-zinc-500 mt-2">
            {t('success_body', {
              categories: saveResult.categories,
              items: saveResult.items,
              ingredients: saveResult.ingredients,
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/dashboard/carte/editeur"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            {t('btn_view_menu')}
          </a>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {t('btn_import_more')}
          </button>
        </div>
      </div>
    );
  }

  // Error state (during save)
  if (status === 'error') {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-12 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t('error_save_title')}</h3>
          <p className="text-sm text-zinc-500 mt-2">{errorMessage}</p>
        </div>
        <button
          onClick={handleReset}
          className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
        >
          {t('btn_try_another')}
        </button>
      </div>
    );
  }

  return null;
}
