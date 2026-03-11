import { NextResponse } from 'next/server'

export async function GET() {
  const content = `# RiveHub
> AI-powered restaurant operations platform

## About
RiveHub is a SaaS platform helping restaurant owners manage operations
with artificial intelligence. Built for independent restaurants, chains,
and food service businesses worldwide.

## Key Features
- Menu Engineering: AI-driven menu performance analysis (Stars, Puzzles, Plowhorses, Dogs matrix)
- Food Cost Calculator: Real-time ingredient cost tracking and recipe costing
- Prep List Generator: Automated daily preparation lists based on forecasted demand
- Health Score: Operational health dashboard with 8 scoring dimensions
- Smart Logbook: AI-assisted daily operational notes and trend detection
- Multilingual Menus: Automatic menu translation in 25+ languages
- Invoice Scanner: OCR-powered receipt and invoice processing
- POS Integration: Lightspeed, Square, Toast, and more

## Supported Languages
French, English, Spanish, Italian, German, Portuguese, Arabic, Chinese,
Japanese, Korean, Hindi, Turkish, Polish, Dutch, Swedish, Danish, Russian,
and 30+ additional languages.

## URLs
- Homepage: https://rivehub.com
- Pricing: https://rivehub.com/pricing
- Features: https://rivehub.com/ai-restaurant-management

## Contact
- Website: https://rivehub.com

## Technical
- Platform: Web application (responsive, mobile-first)
- Stack: Next.js, TypeScript, Supabase, Vercel
- API: Authenticated REST (not public)
- Data: Restaurant data is private and access-controlled
`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
