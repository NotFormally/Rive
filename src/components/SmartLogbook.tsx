"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { hasReachedQuota, FREE_QUOTAS } from "@/lib/quotas";
import { useTranslations } from "next-intl";

type LogEntry = {
  id: number;
  text: string;
  timestamp: string;
  tags: string[];
  sentiment: string;
  originalLanguage: string;
  summary?: string;
  isUrgent?: boolean;
  translations?: Record<string, { text: string; summary?: string }>;
  receiptData?: {
    supplierName: string;
    totalAmount: string;
    date: string;
    topItems: string[];
  };
};

export function SmartLogbook() {
  const [note, setNote] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [viewingLanguage, setViewingLanguage] = useState("original");
  const [isTranslating, setIsTranslating] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const t = useTranslations('Logbook');
  const tCommon = useTranslations('Common');

  const { profile, subscription, usage, refreshSettings } = useAuth();
  const isTrial = subscription?.tier === 'trial';
  
  const notesQuotaReached = hasReachedQuota(usage, 'logbook_notes', isTrial);
  const scansQuotaReached = hasReachedQuota(usage, 'receipt_scans', isTrial);
  const transQuotaReached = hasReachedQuota(usage, 'translations', isTrial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || notesQuotaReached) return;

    setIsClassifying(true);

    try {
      const response = await fetch('/api/analyze-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const analysis = await response.json();

      const newEntry: LogEntry = {
        id: Date.now(),
        text: note,
        timestamp: new Date().toISOString(),
        tags: analysis.tags || [],
        sentiment: analysis.sentiment || "Neutral",
        originalLanguage: analysis.detectedLanguage || "unknown",
        summary: analysis.summary,
        isUrgent: analysis.isUrgent,
        translations: {}
      };

      setEntries([newEntry, ...entries]);
      setNote("");
      
      if (profile) {
        await supabase.rpc('increment_usage', { restaurant_uuid: profile.id, metric_name: 'logbook_notes' });
        refreshSettings();
      }
    } catch (error) {
      console.error("Failed to analyze note:", error);
      // Fallback
      setEntries([{
        id: Date.now(),
        text: note,
        timestamp: new Date().toISOString(),
        tags: ["Uncategorized"],
        sentiment: "Neutral",
        originalLanguage: "unknown",
        translations: {}
      }, ...entries]);
      setNote("");
    } finally {
      setIsClassifying(false);
    }
  };

  const translateEntry = async (entryId: number, targetLanguage: string) => {
    if (transQuotaReached) return;
    const entryIndex = entries.findIndex(e => e.id === entryId);
    if (entryIndex === -1) return;
    
    const entry = entries[entryIndex];
    setIsTranslating(entryId);

    try {
      const response = await fetch('/api/translate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: entry.text, summary: entry.summary, targetLanguage }),
      });
      
      if (!response.ok) throw new Error('Translation failed');
      const data = await response.json();

      const newEntries = [...entries];
      newEntries[entryIndex] = {
        ...entry,
        translations: {
          ...entry.translations,
          [targetLanguage]: {
            text: data.translation,
            summary: data.summaryTranslation
          }
        }
      };
      setEntries(newEntries);
      
      if (profile) {
        await supabase.rpc('increment_usage', { restaurant_uuid: profile.id, metric_name: 'translations' });
        refreshSettings();
      }
    } catch (error) {
      console.error("Failed to translate:", error);
    } finally {
      setIsTranslating(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const scanReceipt = async () => {
    if (!selectedImage || scansQuotaReached) return;
    
    setIsScanning(true);
    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: selectedImage }),
      });
      
      if (!response.ok) throw new Error('Failed to scan receipt');
      
      const data = await response.json();
      
      const newEntry: LogEntry = {
        id: Date.now(),
        text: t('extracted_data'),
        timestamp: new Date().toISOString(),
        tags: [t('supplier'), "Opex"],
        sentiment: "Neutral",
        originalLanguage: "fr",
        summary: `Reçu scanné : ${data.totalAmount} chez ${data.supplierName}.`,
        receiptData: data
      };

      setEntries([newEntry, ...entries]);
      setSelectedImage(null);
      
      if (profile) {
        await supabase.rpc('increment_usage', { restaurant_uuid: profile.id, metric_name: 'receipt_scans' });
        refreshSettings();
      }
    } catch (error) {
      console.error("Failed to scan receipt:", error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full space-y-4 md:space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] md:rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-5 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">{t('title')}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="log-entry" className="sr-only">Nouvelle note</label>
            <textarea
              id="log-entry"
              rows={3}
              className="block w-full rounded-2xl md:rounded-lg border-0 py-3 md:py-4 px-4 text-zinc-900 shadow-inner ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:ring-zinc-700 dark:text-zinc-100 resize-none"
              placeholder={t('placeholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={notesQuotaReached}
            />
          </div>
          
          {notesQuotaReached && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">{t('quota_reached')}</h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                    <p>{t('quota_desc', { count: FREE_QUOTAS.logbook_notes })}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col-reverse md:flex-row justify-between md:items-center gap-3 md:gap-0 mt-2">
            <span className="text-[10px] md:text-xs text-zinc-500 font-plex-mono uppercase tracking-wider text-center md:text-left">
              {isTrial && !notesQuotaReached && `${usage?.logbook_notes || 0} / ${FREE_QUOTAS.logbook_notes} notes IA utilisées`}
            </span>
            <button
              type="submit"
              disabled={isClassifying || !note.trim() || notesQuotaReached}
              className="inline-flex w-full md:w-auto justify-center items-center rounded-2xl md:rounded-md bg-indigo-600 px-4 py-3 md:py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95"
            >
              {isClassifying ? t('btn_loading') : t('btn_save')}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">{t('scan_title')}</h3>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleImageUpload}
              className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400"
            />
            {selectedImage && (
              <button
                type="button"
                onClick={scanReceipt}
                disabled={isScanning || scansQuotaReached}
                className="whitespace-nowrap inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
              >
                {isScanning ? t('scan_loading') : t('btn_scan')}
              </button>
            )}
          </div>
          
          {scansQuotaReached && selectedImage && (
            <div className="mt-4 rounded-md bg-blue-50 dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {t('scan_quota_desc', { count: FREE_QUOTAS.receipt_scans })}
              </p>
            </div>
          )}
          
          <div className="mt-2 flex justify-between items-center">
            {selectedImage && !scansQuotaReached && (
               <div className="text-xs text-zinc-500">Image prête à être scannée par l'IA.</div>
            )}
            {!selectedImage && isTrial && (
               <div className="text-xs text-zinc-500 ml-auto">{usage?.receipt_scans || 0} / {FREE_QUOTAS.receipt_scans} scans utilisés</div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{t('last_entries')}</h3>
          <div className="flex items-center gap-2">
            <label htmlFor="view-lang" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('view_lang')}</label>
            <select
              id="view-lang"
              value={viewingLanguage}
              onChange={(e) => setViewingLanguage(e.target.value)}
              className="text-sm rounded-md border-0 py-1.5 pl-3 pr-8 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:ring-zinc-700 dark:text-zinc-100"
            >
              <option value="original">{t('lang_original')}</option>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="it">Italiano</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
        <div className="space-y-4">
          {entries.map((entry) => {
            const needsTranslation = viewingLanguage !== 'original' && viewingLanguage !== entry.originalLanguage;
            const hasTranslationForCurrentView = entry.translations && entry.translations[viewingLanguage];
            
            const displayText = hasTranslationForCurrentView ? entry.translations![viewingLanguage].text : entry.text;
            const displaySummary = hasTranslationForCurrentView && entry.summary ? entry.translations![viewingLanguage].summary : entry.summary;

            return (
            <div key={entry.id} className={`bg-white dark:bg-zinc-900 rounded-lg shadow-sm border p-4 ${entry.isUrgent ? 'border-red-400 dark:border-red-500/50' : 'border-zinc-200 dark:border-zinc-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-zinc-800 dark:text-zinc-200 text-sm whitespace-pre-wrap">{displayText}</p>
                  {needsTranslation && !hasTranslationForCurrentView && (
                    <div className="mt-2">
                      {transQuotaReached ? (
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Quota de traductions atteint. Passez au forfait supérieur.</p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => translateEntry(entry.id, viewingLanguage)}
                          disabled={isTranslating === entry.id}
                          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 underline disabled:opacity-50"
                        >
                          {isTranslating === entry.id ? 'Traduction en cours...' : `Traduire en ${viewingLanguage.toUpperCase()}`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {entry.receiptData && (
                <div className="mt-2 mb-3 bg-zinc-50 dark:bg-zinc-800/50 rounded p-3 border border-zinc-200 dark:border-zinc-700">
                  <h4 className="font-semibold text-sm mb-1 text-zinc-900 dark:text-zinc-100">{t('extracted_data')}</h4>
                  <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                    <li><span className="font-medium text-zinc-800 dark:text-zinc-300">{t('supplier')} :</span> {entry.receiptData.supplierName}</li>
                    <li><span className="font-medium text-zinc-800 dark:text-zinc-300">Date :</span> {entry.receiptData.date}</li>
                    <li><span className="font-medium text-zinc-800 dark:text-zinc-300">{t('amount')} :</span> <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{entry.receiptData.totalAmount}</span></li>
                    <li><span className="font-medium text-zinc-800 dark:text-zinc-300">{t('items')} :</span> {entry.receiptData.topItems.join(', ')}</li>
                  </ul>
                </div>
              )}

              {displaySummary && !entry.receiptData && (
                <div className="mt-2 p-2 bg-indigo-50/50 dark:bg-indigo-900/10 rounded text-xs text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/30">
                  <span className="font-semibold mr-1">{t('ai_summary')}</span> {displaySummary}
                </div>
              )}
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2 flex-wrap">
                  {entry.isUrgent && (
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 ring-1 ring-inset ring-red-600/20">
                      {t('urgent')}
                    </span>
                  )}
                  {entry.tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset
                        ${tag === 'Urgent' ? 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/30 dark:text-red-400' : 
                          tag === 'Positif' ? 'bg-green-50 text-green-700 ring-green-600/10 dark:bg-green-900/30 dark:text-green-400' :
                          'bg-indigo-50 text-indigo-700 ring-indigo-600/10 dark:bg-indigo-900/30 dark:text-indigo-400'
                        }
                      `}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <time className="text-xs text-zinc-500">
                  {new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
}
