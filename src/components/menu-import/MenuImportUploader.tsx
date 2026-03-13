"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload, Camera, FileText, Globe, Loader2, Link2 } from "lucide-react";
import { compressImage, readFileAsBase64 } from "@/lib/compress-image";

type InputTab = 'upload' | 'camera' | 'ubereats';
type UberEatsMode = 'csv' | 'url';

interface MenuImportUploaderProps {
  onExtracted: (data: any, source: string) => void;
  status: string;
  setStatus: (s: string) => void;
  setErrorMessage: (s: string) => void;
}

export function MenuImportUploader({ onExtracted, status, setStatus, setErrorMessage }: MenuImportUploaderProps) {
  const t = useTranslations("MenuImport");
  const [activeTab, setActiveTab] = useState<InputTab>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uberMode, setUberMode] = useState<UberEatsMode>('csv');
  const [uberUrl, setUberUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleFileSelect = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      setErrorMessage(t('error_unsupported_format'));
      setStatus('error');
      return;
    }

    setFileName(file.name);
    if (isImage) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }

    try {
      setStatus('compressing');
      let base64: string;

      if (isImage) {
        base64 = await compressImage(file);
      } else {
        setStatus('uploading');
        base64 = await readFileAsBase64(file);
      }

      setStatus('analyzing');
      const response = await fetch('/api/extract-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || t('error_extraction_failed'));
      }

      const result = await response.json();
      onExtracted(result, 'document');
    } catch (err: any) {
      console.error('Menu extraction failed:', err);
      setStatus('error');
      setErrorMessage(err.message || t('error_extraction_failed'));
    }
  };

  const handleCsvUpload = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.tsv')) {
      setErrorMessage(t('error_unsupported_format'));
      setStatus('error');
      return;
    }

    setStatus('analyzing');
    setFileName(file.name);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) throw new Error('CSV is empty or has no data rows.');

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameCol = headers.findIndex(h => /^(name|nom|item|dish|plat|title)$/i.test(h));
      const descCol = headers.findIndex(h => /^(desc|description)$/i.test(h));
      const priceCol = headers.findIndex(h => /^(price|prix|cost)$/i.test(h));
      const catCol = headers.findIndex(h => /^(category|categ|section|type)$/i.test(h));

      if (nameCol === -1) throw new Error('Could not find a "Name" column in CSV.');

      const categories: Record<string, { name: string; items: any[] }> = {};

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const itemName = cols[nameCol]?.trim();
        if (!itemName) continue;

        const catName = catCol >= 0 ? (cols[catCol]?.trim() || 'Autres') : 'Imported';
        if (!categories[catName]) {
          categories[catName] = { name: catName, items: [] };
        }

        categories[catName].items.push({
          name: itemName,
          description: descCol >= 0 ? (cols[descCol]?.trim() || '') : '',
          price: priceCol >= 0 ? parseFloat(cols[priceCol]?.replace(/[^0-9.,-]/g, '').replace(',', '.') || '0') || 0 : 0,
          allergens: [],
          inferredIngredients: [],
          confidence: 1.0,
        });
      }

      const result = {
        currency: '$',
        categories: Object.values(categories),
      };

      onExtracted(result, 'ubereats-csv');
    } catch (err: any) {
      console.error('CSV parsing failed:', err);
      setStatus('error');
      setErrorMessage(err.message || t('error_extraction_failed'));
    }
  };

  const handleUberUrl = async () => {
    if (!uberUrl.trim()) return;

    setStatus('analyzing');
    try {
      const response = await fetch('/api/extract-menu-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: uberUrl.trim() }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || t('error_extraction_failed'));
      }

      const result = await response.json();
      onExtracted(result, 'ubereats-url');
    } catch (err: any) {
      console.error('UberEats URL extraction failed:', err);
      setStatus('error');
      setErrorMessage(err.message || t('error_extraction_failed'));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const isProcessing = status === 'compressing' || status === 'uploading' || status === 'analyzing';

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-16">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {status === 'compressing' ? t('status_compressing') :
             status === 'uploading' ? t('status_uploading') :
             t('status_analyzing')}
          </h3>
          <p className="text-sm text-zinc-500 mt-1">{t('status_wait')}</p>
        </div>
        {fileName && (
          <p className="text-xs text-zinc-400">{fileName}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-700">
        <TabButton active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} icon={<Upload className="w-4 h-4" />} label={t('tab_upload')} />
        {isMobile && (
          <TabButton active={activeTab === 'camera'} onClick={() => setActiveTab('camera')} icon={<Camera className="w-4 h-4" />} label={t('tab_camera')} />
        )}
        <TabButton active={activeTab === 'ubereats'} onClick={() => setActiveTab('ubereats')} icon={<Globe className="w-4 h-4" />} label={t('tab_ubereats')} />
      </div>

      {/* Tab 1: Upload */}
      {activeTab === 'upload' && (
        <div
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
            ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{t('upload_title')}</h3>
          <p className="text-sm text-zinc-500">{t('upload_formats')}</p>
          <p className="text-xs text-zinc-400 mt-4">{t('upload_tip')}</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
        </div>
      )}

      {/* Tab 2: Camera (mobile only) */}
      {activeTab === 'camera' && (
        <div className="flex flex-col items-center space-y-4 py-8">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
            <Camera className="w-10 h-10" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t('camera_title')}</h3>
          <p className="text-sm text-zinc-500 text-center max-w-xs">{t('camera_desc')}</p>
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Camera className="w-5 h-5" />
            {t('btn_camera')}
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
        </div>
      )}

      {/* Tab 3: UberEats */}
      {activeTab === 'ubereats' && (
        <div className="space-y-4">
          {/* Sub-toggle: CSV vs URL */}
          <div className="flex gap-2">
            <button
              onClick={() => setUberMode('csv')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                uberMode === 'csv'
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1.5" />
              {t('uber_csv')}
            </button>
            <button
              onClick={() => setUberMode('url')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                uberMode === 'url'
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Link2 className="w-4 h-4 inline mr-1.5" />
              {t('uber_url')}
            </button>
          </div>

          {uberMode === 'csv' ? (
            <div
              className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              onClick={() => csvInputRef.current?.click()}
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{t('uber_csv_title')}</h3>
              <p className="text-sm text-zinc-500">{t('uber_csv_desc')}</p>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.tsv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleCsvUpload(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">{t('uber_url_desc')}</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={uberUrl}
                  onChange={(e) => setUberUrl(e.target.value)}
                  placeholder="https://www.ubereats.com/store/..."
                  className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleUberUrl}
                  disabled={!uberUrl.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                >
                  {t('btn_extract')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/** Parse a CSV line handling quoted fields with commas */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
