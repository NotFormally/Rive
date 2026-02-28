"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { hasReachedQuota, FREEMIUM_QUOTAS } from "@/lib/quotas";
import { useTranslations } from "next-intl";

type LogEntry = {
  id: string;
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

const LOGBOOK_LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ru', label: 'Русский' },
  { code: 'pt', label: 'Português' },
  { code: 'zh-HK', label: '粵語' },
  { code: 'zh-CN', label: '中文' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ms', label: 'Bahasa Melayu' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'nan', label: '閩南語' },
];

export function SmartLogbook() {
  const [note, setNote] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [viewingLanguage, setViewingLanguage] = useState("original");
  const [isTranslating, setIsTranslating] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const t = useTranslations('Logbook');
  const tCommon = useTranslations('Common');

  const { profile, subscription, usage, refreshSettings } = useAuth();
  const isFreemium = subscription?.tier === 'freemium';
  const hasQuota = isFreemium;

  const notesQuotaReached = hasReachedQuota(usage, 'logbook_notes', isFreemium);
  const scansQuotaReached = hasReachedQuota(usage, 'receipt_scans', isFreemium);
  const transQuotaReached = hasReachedQuota(usage, 'translations', isFreemium);

  // Load entries from database on mount
  const loadEntries = useCallback(async () => {
    try {
      const response = await fetch('/api/logbook');
      if (!response.ok) throw new Error('Failed to load entries');
      const data = await response.json();
      const mapped: LogEntry[] = data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        text: row.text as string,
        timestamp: row.created_at as string,
        tags: (row.tags as string[]) || [],
        sentiment: (row.sentiment as string) || 'Neutral',
        originalLanguage: (row.original_language as string) || 'unknown',
        summary: row.summary as string | undefined,
        isUrgent: row.is_urgent as boolean,
        translations: (row.translations as Record<string, { text: string; summary?: string }>) || {},
        receiptData: row.receipt_data as LogEntry['receiptData'] | undefined,
      }));
      setEntries(mapped);
    } catch (error) {
      console.error("Failed to load logbook entries:", error);
    } finally {
      setIsLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

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

      const entryData = {
        text: note,
        tags: analysis.tags || [],
        sentiment: analysis.sentiment || "Neutral",
        originalLanguage: analysis.detectedLanguage || "unknown",
        summary: analysis.summary,
        isUrgent: analysis.isUrgent,
        translations: {}
      };

      // Persist to database
      const saveResponse = await fetch('/api/logbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });

      if (!saveResponse.ok) throw new Error('Failed to save entry');
      const saved = await saveResponse.json();

      const newEntry: LogEntry = {
        id: saved.id,
        ...entryData,
        timestamp: saved.created_at,
      };

      setEntries(prev => [newEntry, ...prev]);
      setNote("");

      if (profile) {
        await supabase.rpc('increment_usage', { restaurant_uuid: profile.id, metric_name: 'logbook_notes' });
        refreshSettings();
      }
    } catch (error) {
      console.error("Failed to analyze note:", error);
      // Fallback: save without AI analysis
      const fallbackData = {
        text: note,
        tags: ["Uncategorized"],
        sentiment: "Neutral",
        originalLanguage: "unknown",
        translations: {}
      };

      try {
        const saveResponse = await fetch('/api/logbook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fallbackData),
        });
        if (saveResponse.ok) {
          const saved = await saveResponse.json();
          setEntries(prev => [{
            id: saved.id,
            ...fallbackData,
            timestamp: saved.created_at,
          }, ...prev]);
        }
      } catch {
        // If DB save also fails, add to local state only
        setEntries(prev => [{
          id: crypto.randomUUID(),
          ...fallbackData,
          timestamp: new Date().toISOString(),
        }, ...prev]);
      }
      setNote("");
    } finally {
      setIsClassifying(false);
    }
  };

  const translateEntry = async (entryId: string, targetLanguage: string) => {
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

      const updatedTranslations = {
        ...entry.translations,
        [targetLanguage]: {
          text: data.translation,
          summary: data.summaryTranslation
        }
      };

      const newEntries = [...entries];
      newEntries[entryIndex] = {
        ...entry,
        translations: updatedTranslations
      };
      setEntries(newEntries);

      // Persist translation to database
      await fetch('/api/logbook', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entryId, translations: updatedTranslations }),
      });

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

  const removeEntry = async (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
    try {
      await fetch(`/api/logbook?id=${entryId}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Failed to delete entry:", error);
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

      const entryData = {
        text: t('extracted_data'),
        tags: [t('supplier'), "Opex"],
        sentiment: "Neutral",
        originalLanguage: "fr",
        summary: `Reçu scanné : ${data.totalAmount} chez ${data.supplierName}.`,
        receiptData: data
      };

      // Persist to database
      const saveResponse = await fetch('/api/logbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });

      if (saveResponse.ok) {
        const saved = await saveResponse.json();
        setEntries(prev => [{
          id: saved.id,
          ...entryData,
          timestamp: saved.created_at,
        }, ...prev]);
      }

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
      <div className="bg-card rounded-[2rem] shadow-sm border border-border/50 p-5 md:p-6">
        <h2 className="text-xl font-jakarta font-bold mb-4 text-foreground">{t('title')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="log-entry" className="sr-only">Nouvelle note</label>
            <textarea
              id="log-entry"
              rows={3}
              className="block w-full rounded-2xl border-0 py-3 md:py-4 px-4 text-foreground shadow-inner ring-1 ring-inset ring-border placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-inset focus:ring-primary/50 text-sm leading-6 font-outfit bg-background resize-none"
              placeholder={t('placeholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={notesQuotaReached}
            />
          </div>

          {notesQuotaReached && (
            <div className="rounded-2xl bg-accent/5 p-4 border border-accent/20">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium font-jakarta text-accent">{t('quota_reached')}</h3>
                  <div className="mt-2 text-sm font-outfit text-foreground/60">
                    <p>{t('quota_desc', { count: FREEMIUM_QUOTAS.logbook_notes })}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse md:flex-row justify-between md:items-center gap-3 md:gap-0 mt-2">
            <span className="text-[10px] md:text-xs text-muted-foreground font-plex-mono uppercase tracking-wider text-center md:text-left">
              {hasQuota && !notesQuotaReached && `${usage?.logbook_notes || 0} / ${FREEMIUM_QUOTAS.logbook_notes} notes IA utilisées`}
            </span>
            <button
              type="submit"
              disabled={isClassifying || !note.trim() || notesQuotaReached}
              className="inline-flex w-full md:w-auto justify-center items-center rounded-2xl bg-primary px-5 py-3 md:py-2.5 text-sm font-bold font-outfit text-primary-foreground shadow-sm hover:bg-[#3A4F43] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95"
            >
              {isClassifying ? t('btn_loading') : t('btn_save')}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-medium font-jakarta text-foreground mb-2">{t('scan_title')}</h3>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleImageUpload}
              className="block w-full text-sm text-muted-foreground font-outfit file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {selectedImage && (
              <button
                type="button"
                onClick={scanReceipt}
                disabled={isScanning || scansQuotaReached}
                className="whitespace-nowrap inline-flex items-center rounded-xl bg-[#2E4036] px-4 py-2 text-sm font-bold font-outfit text-[#F2F0E9] shadow-sm hover:bg-[#3A4F43] disabled:opacity-50"
              >
                {isScanning ? t('scan_loading') : t('btn_scan')}
              </button>
            )}
          </div>

          {scansQuotaReached && selectedImage && (
            <div className="mt-4 rounded-2xl bg-accent/5 p-4 border border-accent/20">
              <p className="text-sm font-outfit text-accent">
                {t('scan_quota_desc', { count: FREEMIUM_QUOTAS.receipt_scans })}
              </p>
            </div>
          )}

          <div className="mt-2 flex justify-between items-center">
            {selectedImage && !scansQuotaReached && (
               <div className="text-xs font-outfit text-muted-foreground">Image prête à être scannée par l'IA.</div>
            )}
            {!selectedImage && hasQuota && (
               <div className="text-xs font-outfit text-muted-foreground ml-auto">{usage?.receipt_scans || 0} / {FREEMIUM_QUOTAS.receipt_scans} scans utilisés</div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-jakarta font-bold text-foreground">{t('last_entries')}</h3>
          <div className="flex items-center gap-2">
            <label htmlFor="view-lang" className="text-sm font-medium font-outfit text-foreground/70">{t('view_lang')}</label>
            <select
              id="view-lang"
              value={viewingLanguage}
              onChange={(e) => setViewingLanguage(e.target.value)}
              className="text-sm rounded-xl border-0 py-1.5 pl-3 pr-8 text-foreground ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary/50 font-outfit bg-card"
            >
              <option value="original">{t('lang_original')}</option>
              {LOGBOOK_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoadingEntries ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground font-outfit">{tCommon('loading')}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <p className="text-muted-foreground font-outfit text-sm">{t('empty_state') || 'Aucune note pour le moment. Ajoutez votre première observation.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const needsTranslation = viewingLanguage !== 'original' && viewingLanguage !== entry.originalLanguage;
              const hasTranslationForCurrentView = entry.translations && entry.translations[viewingLanguage];

              const displayText = hasTranslationForCurrentView ? entry.translations![viewingLanguage].text : entry.text;
              const displaySummary = hasTranslationForCurrentView && entry.summary ? entry.translations![viewingLanguage].summary : entry.summary;

              return (
              <div key={entry.id} className={`bg-card rounded-2xl shadow-sm border p-4 ${entry.isUrgent ? 'border-red-400' : 'border-border/50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="text-foreground/90 text-sm font-outfit whitespace-pre-wrap">{displayText}</p>
                    {needsTranslation && !hasTranslationForCurrentView && (
                      <div className="mt-2">
                        {transQuotaReached ? (
                          <p className="text-xs font-medium font-outfit text-accent">Quota de traductions atteint. Passez au forfait supérieur.</p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => translateEntry(entry.id, viewingLanguage)}
                            disabled={isTranslating === entry.id}
                            className="text-xs font-medium font-outfit text-primary hover:text-[#3A4F43] underline disabled:opacity-50"
                          >
                            {isTranslating === entry.id ? 'Traduction en cours...' : `Traduire en ${LOGBOOK_LANGUAGES.find(l => l.code === viewingLanguage)?.label || viewingLanguage.toUpperCase()}`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="ml-2 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                    title="Supprimer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {entry.receiptData && (
                  <div className="mt-2 mb-3 bg-secondary/50 rounded-xl p-3 border border-border">
                    <h4 className="font-jakarta font-bold text-sm mb-1 text-foreground">{t('extracted_data')}</h4>
                    <ul className="text-xs font-outfit text-foreground/60 space-y-1">
                      <li><span className="font-medium text-foreground/80">{t('supplier')} :</span> {entry.receiptData.supplierName}</li>
                      <li><span className="font-medium text-foreground/80">Date :</span> {entry.receiptData.date}</li>
                      <li><span className="font-medium text-foreground/80">{t('amount')} :</span> <span className="text-green-700 font-semibold">{entry.receiptData.totalAmount}</span></li>
                      <li><span className="font-medium text-foreground/80">{t('items')} :</span> {entry.receiptData.topItems.join(', ')}</li>
                    </ul>
                  </div>
                )}

                {displaySummary && !entry.receiptData && (
                  <div className="mt-2 p-2.5 bg-primary/5 rounded-xl text-xs font-outfit text-primary border border-primary/10">
                    <span className="font-bold mr-1">{t('ai_summary')}</span> {displaySummary}
                  </div>
                )}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-2 flex-wrap">
                    {entry.isUrgent && (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium font-jakarta bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20">
                        {t('urgent')}
                      </span>
                    )}
                    {entry.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium font-jakarta ring-1 ring-inset
                          ${tag === 'Urgent' ? 'bg-red-50 text-red-700 ring-red-600/10' :
                            tag === 'Positif' ? 'bg-green-50 text-green-700 ring-green-600/10' :
                            'bg-primary/5 text-primary ring-primary/10'
                          }
                        `}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <time className="text-xs font-plex-mono text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
