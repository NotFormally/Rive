import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rivehub.com'

const AI_CRAWLERS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Anthropic-AI', 'GoogleOther', 'CCBot']
const BLOCKED_PATHS = ['/dashboard/', '/admin/', '/api/', '/checklist/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: BLOCKED_PATHS,
      },
      // Explicit rules for AI crawlers — allow public pages + llms.txt
      ...AI_CRAWLERS.map(crawler => ({
        userAgent: crawler,
        allow: ['/', '/llms.txt'],
        disallow: BLOCKED_PATHS,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
