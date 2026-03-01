import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['zh-CN', 'es', 'en', 'hi', 'ar', 'bn', 'pt', 'ru', 'ja', 'zh-HK', 'vi', 'tr', 'ko', 'fr', 'de', 'ta', 'it', 'th', 'nan', 'pl', 'id', 'pa', 'tl', 'nl', 'ms'],
  defaultLocale: 'en',
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
