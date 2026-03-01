"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition, useState, useEffect, useRef } from "react";
import { Globe } from "lucide-react";

// Ordered by descending number of native speakers
const LANGUAGES = [
  { code: 'zh-CN', label: '中文' },          // Mandarin — 920M
  { code: 'es',    label: 'Español' },        // Spanish — 475M
  { code: 'en',    label: 'English' },         // English — 373M
  { code: 'hi',    label: 'हिन्दी' },            // Hindi — 345M
  { code: 'ar',    label: 'العربية' },          // Arabic — 310M
  { code: 'bn',    label: 'বাংলা' },            // Bengali — 230M
  { code: 'pt',    label: 'Português' },       // Portuguese — 220M
  { code: 'ru',    label: 'Русский' },         // Russian — 154M
  { code: 'ja',    label: '日本語' },           // Japanese — 125M
  { code: 'zh-HK', label: '粵語' },            // Cantonese — 85M
  { code: 'vi',    label: 'Tiếng Việt' },     // Vietnamese — 85M
  { code: 'tr',    label: 'Türkçe' },         // Turkish — 80M
  { code: 'ko',    label: '한국어' },           // Korean — 77M
  { code: 'fr',    label: 'Français' },        // French — 77M
  { code: 'de',    label: 'Deutsch' },         // German — 76M
  { code: 'ta',    label: 'தமிழ்' },            // Tamil — 75M
  { code: 'it',    label: 'Italiano' },        // Italian — 68M
  { code: 'th',    label: 'ไทย' },              // Thai — 60M
  { code: 'nan',   label: '閩南語' },           // Min Nan — 49M
  { code: 'pl',    label: 'Polski' },          // Polish — 45M
  { code: 'id',    label: 'Indonesia' },       // Indonesian — 43M
  { code: 'pa',    label: 'ਪੰਜਾਬੀ' },          // Punjabi — 33M
  { code: 'tl',    label: 'Filipino' },        // Tagalog — 28M
  { code: 'nl',    label: 'Nederlands' },      // Dutch — 25M
  { code: 'ms',    label: 'Melayu' },          // Malay — 25M
];

export function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  const currentLang = LANGUAGES.find(l => l.code === locale);

  return (
    <div 
      className="relative"
      ref={containerRef}
    >
      <button 
        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-black/5 transition-colors text-sm font-medium"
        disabled={isPending}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4 opacity-70" />
        <span className="uppercase text-xs">{currentLang?.code || locale}</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 pt-2 z-50">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-2 min-w-[160px] max-h-[320px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-slate-50 transition-colors ${locale === lang.code ? 'font-bold text-[#CC5833]' : 'text-slate-600'}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
