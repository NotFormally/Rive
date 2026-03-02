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
    "description": "AI-powered restaurant management software. HACCP compliance, intelligent logbook, food cost analysis, 25-language translation, OCR invoice scanning, menu engineering, and social media content generation.",
    "offers": [
      {
        "@type": "Offer",
        "name": "Essence",
        "price": "59",
        "priceCurrency": "USD",
        "priceSpecification": { "@type": "UnitPriceSpecification", "billingDuration": "P1M" },
        "description": "AI Logbook, HACCP Compliance, Food Cost Analysis, OCR Scanner"
      },
      {
        "@type": "Offer",
        "name": "Performance",
        "price": "129",
        "priceCurrency": "USD",
        "priceSpecification": { "@type": "UnitPriceSpecification", "billingDuration": "P1M" },
        "description": "Everything in Essence + Menu Engineering, POS Integration, Social Media"
      },
      {
        "@type": "Offer",
        "name": "Intelligence",
        "price": "249",
        "priceCurrency": "USD",
        "priceSpecification": { "@type": "UnitPriceSpecification", "billingDuration": "P1M" },
        "description": "Full platform: Predictive analytics, AI Prep Lists, Reservation Sync, Priority Support"
      }
    ],
    "featureList": [
      "AI-Powered Logbook",
      "HACCP Compliance Assistant",
      "Food Cost Analysis",
      "25-Language Translation",
      "OCR Invoice Scanner",
      "Menu Engineering Matrix",
      "POS Integration (Toast, Square, SumUp, Lightspeed, Zettle)",
      "Instagram Content Generator",
      "Reservation Sync (Libro, Resy, Zenchef)",
      "AI Prep Lists & Forecasting",
      "Bar & Brewery Management"
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
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "dock@rivehub.com",
      "contactType": "customer support"
    },
    "knowsLanguage": ["fr", "en", "ar", "es", "it", "hi", "pa", "ta", "bn", "ru", "pt", "zh-HK", "zh-CN", "tr", "ja", "ko", "ms", "id", "nan", "vi", "de", "th", "pl", "tl", "nl"]
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Pricing", "item": `${SITE_URL}/en/pricing` }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does Rive integrate with my POS system?",
        "acceptedAnswer": { "@type": "Answer", "text": "Rive connects natively with major POS systems including Toast, Square, SumUp, Lightspeed, and Zettle. Setup takes less than 5 minutes — just authorize the connection and your data starts syncing automatically." }
      },
      {
        "@type": "Question",
        "name": "Is my restaurant data secure?",
        "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. All data is encrypted in transit and at rest. We use Supabase infrastructure with row-level security, meaning your data is isolated and only accessible to your team. We never share or sell your data." }
      },
      {
        "@type": "Question",
        "name": "How long does it take to set up?",
        "acceptedAnswer": { "@type": "Answer", "text": "Most restaurants are fully operational within 15 minutes. Connect your POS, invite your team, and Rive starts learning your patterns immediately. You'll receive your first actionable insights within 48 hours." }
      },
      {
        "@type": "Question",
        "name": "What happens after the free plan?",
        "acceptedAnswer": { "@type": "Answer", "text": "The free Essence plan has no time limit — use it as long as you want. When you're ready for advanced AI features like predictive ordering and automated compliance, upgrade at any time." }
      },
      {
        "@type": "Question",
        "name": "Can my team use Rive in their own language?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. Rive supports over 25 languages and automatically translates task instructions for each team member. A chef who speaks Mandarin and a server who speaks French can both use the same system seamlessly." }
      },
      {
        "@type": "Question",
        "name": "Do I need to train my staff?",
        "acceptedAnswer": { "@type": "Answer", "text": "Rive is designed to be intuitive. The interface is minimal and task-oriented — your team can start using it immediately. We also provide onboarding guides and support via chat." }
      }
    ]
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
