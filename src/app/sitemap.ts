import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rivehub.com'

const locales = ['fr', 'en', 'ar', 'es', 'it', 'hi', 'pa', 'ta', 'bn', 'ru', 'pt', 'zh-HK', 'zh-CN', 'tr', 'ms', 'ja', 'ko', 'id', 'nan']

const publicRoutes = [
  { path: '', changeFrequency: 'weekly' as const, priority: 1.0 },
  { path: '/pricing', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/signup', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/login', changeFrequency: 'monthly' as const, priority: 0.4 },
  { path: '/cgu', changeFrequency: 'yearly' as const, priority: 0.3 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const entries: MetadataRoute.Sitemap = []

  for (const route of publicRoutes) {
    for (const locale of locales) {
      // Build alternates for all other locales
      const languages: Record<string, string> = {}
      for (const alt of locales) {
        languages[alt] = `${SITE_URL}/${alt}${route.path}`
      }
      // x-default points to the default locale (fr)
      languages['x-default'] = `${SITE_URL}/fr${route.path}`

      entries.push({
        url: `${SITE_URL}/${locale}${route.path}`,
        lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages,
        },
      })
    }
  }

  return entries
}
