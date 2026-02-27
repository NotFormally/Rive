import { LandingPage } from "@/components/LandingPage";
import { JsonLd } from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rivehub.com'

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Rive",
    "url": SITE_URL,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "AI-powered restaurant operations platform. HACCP compliance, intelligent logbook, food cost analysis, 14-language translation, OCR invoice scanning, menu engineering, and social media content generation.",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "59",
      "highPrice": "249",
      "priceCurrency": "USD",
      "offerCount": "3"
    },
    "featureList": [
      "AI-Powered Logbook",
      "HACCP Compliance Assistant",
      "Food Cost Analysis",
      "14-Language Translation",
      "OCR Invoice Scanner",
      "Menu Engineering Matrix",
      "POS Integration (Toast, Square, SumUp, Lightspeed, Zettle)",
      "Instagram Content Generator",
      "Reservation Sync (Libro, Resy, Zenchef)",
      "AI Prep Lists"
    ],
    "screenshot": `${SITE_URL}/hero-concept.png`,
    "softwareHelp": {
      "@type": "CreativeWork",
      "url": `${SITE_URL}/fr/cgu`
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Rive",
    "url": SITE_URL,
    "logo": `${SITE_URL}/favicon.ico`,
    "description": "Algorithmic intelligence for gastronomic restaurants.",
    "foundingDate": "2026",
    "areaServed": "Worldwide",
    "knowsLanguage": ["fr", "en", "ar", "es", "it", "hi", "pa", "ta", "bn", "ru", "pt", "zh-HK", "zh-CN", "tr"]
  }
];

export default function Home() {
  return (
    <>
      <JsonLd data={structuredData} />
      <LandingPage />
    </>
  );
}
