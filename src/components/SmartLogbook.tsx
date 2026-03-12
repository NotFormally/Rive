"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { hasReachedQuota, TIER_QUOTAS } from "@/lib/quotas";
import { useTranslations } from "next-intl";
import { Sparkles, Trash2, Globe, Shield, AlertTriangle, CheckCircle2, Clock, Lock } from "lucide-react";
import { APP_LANGUAGES } from "@/lib/languages";

type EntryType = 'note' | 'haccp_deviation' | 'corrective_action' | 'temperature_event' | 'inspection_note' | 'incident';
type HACCPCategory = 'temperature' | 'hygiene' | 'allergen' | 'pest_control' | 'equipment' | 'training' | 'supplier' | 'other';
type Severity = 'low' | 'medium' | 'high' | 'critical';
type CorrectiveStatus = 'pending' | 'in_progress' | 'completed' | 'verified';

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
  entryType: EntryType;
  haccpCategory?: HACCPCategory;
  severity?: Severity;
  correctiveAction?: string;
  correctiveActionStatus?: CorrectiveStatus;
  correctiveActionDue?: string;
  isImmutable?: boolean;
};

const ENTRY_TYPE_CONFIG: Record<EntryType, { label: string; color: string; icon: typeof Shield }> = {
  note: { label: 'Note', color: 'bg-primary/10 text-primary', icon: Globe },
  haccp_deviation: { label: 'HACCP Deviation', color: 'bg-red-500/10 text-red-500', icon: AlertTriangle },
  corrective_action: { label: 'Corrective Action', color: 'bg-amber-500/10 text-amber-500', icon: CheckCircle2 },
  temperature_event: { label: 'Temperature', color: 'bg-blue-500/10 text-blue-500', icon: AlertTriangle },
  inspection_note: { label: 'Inspection', color: 'bg-purple-500/10 text-purple-500', icon: Shield },
  incident: { label: 'Incident', color: 'bg-red-600/10 text-red-600', icon: AlertTriangle },
};

const SEVERITY_COLORS: Record<Severity, string> = {
  low: 'bg-green-500/10 text-green-500 ring-green-500/20',
  medium: 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
  high: 'bg-orange-500/10 text-orange-500 ring-orange-500/20',
  critical: 'bg-red-500/10 text-red-500 ring-red-500/20',
};

const CORRECTIVE_STATUS_COLORS: Record<CorrectiveStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-500',
  in_progress: 'bg-blue-500/10 text-blue-500',
  completed: 'bg-green-500/10 text-green-500',
  verified: 'bg-emerald-500/10 text-emerald-500',
};



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
  const currentTier = subscription?.tier || 'free';
  const hasQuota = currentTier !== 'intelligence';

  const notesQuotaReached = hasReachedQuota(usage, 'logbook_notes', currentTier);
  const scansQuotaReached = hasReachedQuota(usage, 'receipt_scans', currentTier);
  const transQuotaReached = hasReachedQuota(usage, 'translations', currentTier);

  // HACCP form state
  const [entryType, setEntryType] = useState<EntryType>('note');
  const [haccpCategory, setHaccpCategory] = useState<HACCPCategory | ''>('');
  const [severity, setSeverity] = useState<Severity | ''>('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [showHACCPFields, setShowHACCPFields] = useState(false);
  const [filterType, setFilterType] = useState<EntryType | 'all'>('all');

  // Load entries from database on mount
  const loadEntries = useCallback(async () => {
    try {
      const response = await fetchWithTimeout('/api/logbook');
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
        entryType: (row.entry_type as EntryType) || 'note',
        haccpCategory: row.haccp_category as HACCPCategory | undefined,
        severity: row.severity as Severity | undefined,
        correctiveAction: row.corrective_action as string | undefined,
        correctiveActionStatus: row.corrective_action_status as CorrectiveStatus | undefined,
        correctiveActionDue: row.corrective_action_due as string | undefined,
        isImmutable: row.is_immutable as boolean | undefined,
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

      const isHACCP = entryType !== 'note';
      const entryData = {
        text: note,
        tags: analysis.tags || [],
        sentiment: analysis.sentiment || "Neutral",
        originalLanguage: analysis.detectedLanguage || "unknown",
        summary: analysis.summary,
        isUrgent: analysis.isUrgent || (severity === 'critical' || severity === 'high'),
        translations: {},
        entryType,
        ...(isHACCP && haccpCategory ? { haccpCategory } : {}),
        ...(isHACCP && severity ? { severity } : {}),
        ...(isHACCP && correctiveAction ? { correctiveAction } : {}),
        isImmutable: isHACCP,
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
        correctiveActionStatus: isHACCP && correctiveAction ? 'pending' : undefined,
      };

      setEntries(prev => [newEntry, ...prev]);
      setNote("");
      setEntryType('note');
      setHaccpCategory('');
      setSeverity('');
      setCorrectiveAction('');
      setShowHACCPFields(false);

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
        translations: {},
        entryType: entryType as EntryType,
        haccpCategory: haccpCategory as HACCPCategory || undefined,
        severity: severity as Severity || undefined,
        correctiveAction: correctiveAction || undefined,
        isImmutable: entryType !== 'note',
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
        receiptData: data,
        entryType: 'note' as EntryType,
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
          {/* HACCP Entry Type Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => { setShowHACCPFields(false); setEntryType('note'); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-jakarta font-semibold transition-all ${
                entryType === 'note' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Globe className="w-3 h-3" /> {t('type_note') || 'Note'}
            </button>
            <button
              type="button"
              onClick={() => { setShowHACCPFields(true); setEntryType('haccp_deviation'); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-jakarta font-semibold transition-all ${
                entryType !== 'note' ? 'bg-[#CC5833] text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Shield className="w-3 h-3" /> HACCP
            </button>
          </div>

          {/* HACCP-specific fields */}
          {showHACCPFields && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-[#CC5833]/5 border border-[#CC5833]/20 rounded-2xl">
              <select
                value={entryType}
                onChange={e => setEntryType(e.target.value as EntryType)}
                className="text-xs rounded-xl border-0 py-2 px-3 ring-1 ring-inset ring-border font-outfit bg-background text-foreground"
              >
                <option value="haccp_deviation">{t('type_deviation') || 'Deviation'}</option>
                <option value="corrective_action">{t('type_corrective') || 'Corrective Action'}</option>
                <option value="temperature_event">{t('type_temperature') || 'Temperature Event'}</option>
                <option value="inspection_note">{t('type_inspection') || 'Inspection Note'}</option>
                <option value="incident">{t('type_incident') || 'Incident'}</option>
              </select>
              <select
                value={haccpCategory}
                onChange={e => setHaccpCategory(e.target.value as HACCPCategory)}
                className="text-xs rounded-xl border-0 py-2 px-3 ring-1 ring-inset ring-border font-outfit bg-background text-foreground"
              >
                <option value="">{t('category_select') || 'Category...'}</option>
                <option value="temperature">{t('cat_temperature') || 'Temperature'}</option>
                <option value="hygiene">{t('cat_hygiene') || 'Hygiene'}</option>
                <option value="allergen">{t('cat_allergen') || 'Allergen'}</option>
                <option value="pest_control">{t('cat_pest') || 'Pest Control'}</option>
                <option value="equipment">{t('cat_equipment') || 'Equipment'}</option>
                <option value="training">{t('cat_training') || 'Training'}</option>
                <option value="supplier">{t('cat_supplier') || 'Supplier'}</option>
                <option value="other">{t('cat_other') || 'Other'}</option>
              </select>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as Severity)}
                className="text-xs rounded-xl border-0 py-2 px-3 ring-1 ring-inset ring-border font-outfit bg-background text-foreground"
              >
                <option value="">{t('severity_select') || 'Severity...'}</option>
                <option value="low">{t('severity_low') || 'Low'}</option>
                <option value="medium">{t('severity_medium') || 'Medium'}</option>
                <option value="high">{t('severity_high') || 'High'}</option>
                <option value="critical">{t('severity_critical') || 'Critical'}</option>
              </select>
              <input
                type="text"
                value={correctiveAction}
                onChange={e => setCorrectiveAction(e.target.value)}
                placeholder={t('corrective_placeholder') || 'Corrective action taken...'}
                className="text-xs rounded-xl border-0 py-2 px-3 ring-1 ring-inset ring-border font-outfit bg-background text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
          )}

          <div>
            <label htmlFor="log-entry" className="sr-only">{t('title')}</label>
            <textarea
              id="log-entry"
              rows={3}
              className="block w-full rounded-2xl border-0 py-3 md:py-4 px-4 text-foreground shadow-inner ring-1 ring-inset ring-border placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-inset focus:ring-primary/50 text-sm leading-6 font-outfit bg-background resize-none"
              placeholder={showHACCPFields ? (t('haccp_placeholder') || 'Describe the HACCP event in detail...') : t('placeholder')}
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
                    <p>{t('quota_desc', { count: TIER_QUOTAS[currentTier].logbook_notes })}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse md:flex-row justify-between md:items-center gap-3 md:gap-0 mt-2">
            <span className="text-[10px] md:text-xs text-muted-foreground font-plex-mono uppercase tracking-wider text-center md:text-left">
              {hasQuota && !notesQuotaReached && t('notes_used', { used: usage?.logbook_notes || 0, total: TIER_QUOTAS[currentTier].logbook_notes })}
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
                {t('scan_quota_desc', { count: TIER_QUOTAS[currentTier].receipt_scans })}
              </p>
            </div>
          )}

          <div className="mt-2 flex justify-between items-center">
            {selectedImage && !scansQuotaReached && (
               <div className="text-xs font-outfit text-muted-foreground">{t('image_ready')}</div>
            )}
            {!selectedImage && hasQuota && (
               <div className="text-xs font-outfit text-muted-foreground ml-auto">{t('scans_used', { used: usage?.receipt_scans || 0, total: TIER_QUOTAS[currentTier].receipt_scans })}</div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Entry type filter */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {(['all', 'note', 'haccp_deviation', 'corrective_action', 'incident'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-xl text-xs font-jakarta font-semibold transition-all ${
                filterType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {type === 'all' ? (t('filter_all') || 'All') : ENTRY_TYPE_CONFIG[type]?.label || type}
            </button>
          ))}
        </div>

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
              {APP_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoadingEntries ? (
          <div className="text-center py-8" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground font-outfit">{tCommon('loading')}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <p className="text-muted-foreground font-outfit text-sm">{t('empty_state')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.filter(e => filterType === 'all' || e.entryType === filterType).map((entry) => {
              const needsTranslation = viewingLanguage !== 'original' && viewingLanguage !== entry.originalLanguage;
              const hasTranslationForCurrentView = entry.translations && entry.translations[viewingLanguage];

              const displayText = hasTranslationForCurrentView ? entry.translations![viewingLanguage].text : entry.text;
              const displaySummary = hasTranslationForCurrentView && entry.summary ? entry.translations![viewingLanguage].summary : entry.summary;

              const isHACCPEntry = entry.entryType !== 'note';
              const typeConfig = ENTRY_TYPE_CONFIG[entry.entryType] || ENTRY_TYPE_CONFIG.note;

              return (
              <div key={entry.id} className={`bg-card rounded-2xl shadow-sm border p-4 ${entry.isUrgent ? 'border-red-400' : isHACCPEntry ? 'border-[#CC5833]/30' : 'border-border/50'}`}>
                {/* HACCP header badges */}
                {isHACCPEntry && (
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold font-jakarta ring-1 ring-inset ${typeConfig.color}`}>
                      <typeConfig.icon className="w-3 h-3" />
                      {typeConfig.label}
                    </span>
                    {entry.severity && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold font-jakarta ring-1 ring-inset ${SEVERITY_COLORS[entry.severity]}`}>
                        {entry.severity.toUpperCase()}
                      </span>
                    )}
                    {entry.haccpCategory && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium font-plex-mono bg-muted text-muted-foreground ring-1 ring-inset ring-border">
                        {entry.haccpCategory}
                      </span>
                    )}
                    {entry.isImmutable && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium font-plex-mono bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20" title="Immutable HACCP record">
                        <Lock className="w-2.5 h-2.5" /> Sealed
                      </span>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="text-foreground/90 text-sm font-outfit whitespace-pre-wrap">{displayText}</p>
                    
                    {needsTranslation && hasTranslationForCurrentView && (
                       <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-outfit text-xs font-semibold text-indigo-400">
                             {t('translated_badge', { lang: entry.originalLanguage.toUpperCase() })}
                          </span>
                       </div>
                    )}

                    {needsTranslation && !hasTranslationForCurrentView && (
                      <div className="mt-2">
                        {transQuotaReached ? (
                          <p className="text-xs font-medium font-outfit text-accent">{t('translation_quota_reached')}</p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => translateEntry(entry.id, viewingLanguage)}
                            disabled={isTranslating === entry.id}
                            className="text-xs font-medium font-outfit text-primary hover:text-[#3A4F43] underline disabled:opacity-50"
                          >
                            {isTranslating === entry.id ? t('translating') : t('translate_to', { lang: APP_LANGUAGES.find(l => l.code === viewingLanguage)?.label || viewingLanguage.toUpperCase() })}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {!entry.isImmutable && (
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="ml-2 text-muted-foreground hover:text-red-500 transition-colors shrink-0 p-1 rounded-md hover:bg-red-50/10"
                      title={t('btn_delete_title')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Corrective Action block */}
                {entry.correctiveAction && (
                  <div className="mt-2 p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/15">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-jakarta font-bold text-amber-500">{t('corrective_action_label') || 'Corrective Action'}</span>
                      {entry.correctiveActionStatus && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold font-jakarta ${CORRECTIVE_STATUS_COLORS[entry.correctiveActionStatus]}`}>
                          {entry.correctiveActionStatus}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-outfit text-foreground/70">{entry.correctiveAction}</p>
                    {entry.correctiveActionDue && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-plex-mono text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Due: {new Date(entry.correctiveActionDue).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}

                {entry.receiptData && (
                  <div className="mt-2 mb-3 bg-secondary/50 rounded-xl p-3 border border-border">
                    <h4 className="font-jakarta font-bold text-sm mb-1 text-foreground">{t('extracted_data')}</h4>
                    <ul className="text-xs font-outfit text-foreground/60 space-y-1">
                      <li><span className="font-medium text-foreground/80">{t('supplier')} :</span> {entry.receiptData.supplierName}</li>
                      <li><span className="font-medium text-foreground/80">{t('label_date')} :</span> {entry.receiptData.date}</li>
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
