import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: [
    // Major
    'fr', 'en', 'es', 'it', 'de', 'pt', 'ru', 'pl', 'tr', 'da', 'sv', 'ro', 'el', 'hu', 'cs',
    // MENA + Iran
    'fa', 'ar', 'ar-AE', 'ar-LB', 'ar-EG', 'kab',
    // Asia
    'hi', 'ur', 'pa', 'ta', 'bn', 'zh-CN', 'zh-HK', 'nan', 'ja', 'ko',
    // Indo-Oceania
    'id', 'ms', 'jv', 'th', 'vi', 'tl',
    // Africa
    'sw', 'am', 'yo', 'ha', 'zu', 'om',
    // ANZ
    'en-AU', 'en-NZ',
    // Celtic
    'br', 'cy', 'gd', 'ga',
    // Romance/Isolates
    'eu', 'co',
    // Germanic Regional
    'nds', 'gsw', 'frk-mos', 'nl-BE',
    // Others
    'nl', 'hsb', 'rom', 'ht',
  ],
  defaultLocale: 'en',
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
