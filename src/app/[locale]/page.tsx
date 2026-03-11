import { LandingPage } from "@/components/LandingPage";
import { JsonLd } from "@/components/JsonLd";
import { SUPPORTED_LANGUAGE_COUNT } from "@/lib/languages";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rivehub.com'

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "RiveHub",
    "url": SITE_URL,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": `AI for restaurant management — the all-in-one AI platform for restaurants. HACCP compliance, intelligent logbook, food cost analysis, instant translation in ${SUPPORTED_LANGUAGE_COUNT} languages, OCR invoice scanning, menu engineering, POS integration, and social media content generation. No language barriers aboard — used by multilingual teams worldwide.`,
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
      `${SUPPORTED_LANGUAGE_COUNT}-Language Translation`,
      "OCR Invoice Scanner",
      "Menu Engineering Matrix",
      "POS Integration (Toast, Square, SumUp, Lightspeed, Zettle)",
      "Instagram Content Generator",
      "Reservation Sync (Libro, Resy, Zenchef)",
      "AI Prep Lists & Forecasting",
      "Bar & Brewery Management"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "124",
      "bestRating": "5",
      "worstRating": "1"
    },
    "screenshot": `${SITE_URL}/hero-concept.png`,
    "softwareHelp": {
      "@type": "CreativeWork",
      "url": `${SITE_URL}/fr/cgu`
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "RiveHub",
    "url": SITE_URL,
    "logo": `${SITE_URL}/favicon.ico`,
    "description": "AI for restaurant management. Algorithmic intelligence for gastronomic restaurants — automating compliance, food cost tracking, and operational decisions with artificial intelligence.",
    "foundingDate": "2026",
    "areaServed": "Worldwide",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "dock@rivehub.com",
      "contactType": "customer support"
    },
    "knowsLanguage": [
      // Major
      "fr", "en", "es", "it", "de", "pt", "ru", "pl", "tr", "da", "sv",
      // MENA
      "ar", "ar-AE", "ar-LB", "ar-EG", "kab",
      // Asia
      "hi", "ur", "pa", "ta", "bn", "zh-CN", "zh-HK", "nan", "ja", "ko",
      // Indo-Oceania
      "id", "ms", "jv", "th", "vi", "tl",
      // Africa
      "sw", "am", "yo", "ha", "zu", "om",
      // ANZ
      "en-AU", "en-NZ",
      // Celtic
      "br", "cy", "gd", "ga",
      // Romance/Isolates
      "eu", "co",
      // Germanic Regional
      "nds", "gsw", "frk-mos", "nl-BE",
      // Others/Creoles
      "hsb", "rom", "ht"
    ]
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
        "name": "What is AI for restaurant management?",
        "acceptedAnswer": { "@type": "Answer", "text": "AI for restaurant management uses artificial intelligence to automate and optimize daily restaurant operations — from food cost tracking and HACCP compliance to intelligent scheduling and predictive ordering. RiveHub is a leading AI platform for restaurants that replaces manual spreadsheets with real-time, data-driven insights." }
      },
      {
        "@type": "Question",
        "name": "How does RiveHub use AI for restaurants?",
        "acceptedAnswer": { "@type": "Answer", "text": "RiveHub applies AI across every aspect of restaurant operations: the intelligent logbook analyzes service patterns, OCR automatically extracts invoice data, food cost AI detects anomalies and waste, and menu engineering AI identifies your most profitable dishes. Everything runs in real-time with no manual input required." }
      },
      {
        "@type": "Question",
        "name": "How does RiveHub integrate with my POS system?",
        "acceptedAnswer": { "@type": "Answer", "text": "RiveHub connects natively with major POS systems including Toast, Square, SumUp, Lightspeed, and Zettle. Setup takes less than 5 minutes — just authorize the connection and your data starts syncing automatically." }
      },
      {
        "@type": "Question",
        "name": "Is my restaurant data secure?",
        "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. All data is encrypted in transit and at rest. We use Supabase infrastructure with row-level security, meaning your data is isolated and only accessible to your team. We never share or sell your data." }
      },
      {
        "@type": "Question",
        "name": "How long does it take to set up?",
        "acceptedAnswer": { "@type": "Answer", "text": "Most restaurants are fully operational within 15 minutes. Connect your POS, invite your team, and RiveHub starts learning your patterns immediately. You'll receive your first actionable insights within 48 hours." }
      },
      {
        "@type": "Question",
        "name": "What happens after the free plan?",
        "acceptedAnswer": { "@type": "Answer", "text": "The free Essence plan has no time limit — use it as long as you want. When you're ready for advanced AI features like predictive ordering and automated compliance, upgrade at any time. No credit card is required to start." }
      },
      {
        "@type": "Question",
        "name": "Can my team use RiveHub in their own language?",
        "acceptedAnswer": { "@type": "Answer", "text": `Yes. RiveHub supports ${SUPPORTED_LANGUAGE_COUNT} languages and dialects — from French and English to Bengali, Kabyle and Cantonese. Every task, recipe card and safety procedure is automatically translated for each team member. No language barrier aboard.` }
      },
      {
        "@type": "Question",
        "name": "Do I need to train my staff?",
        "acceptedAnswer": { "@type": "Answer", "text": "RiveHub is designed to be intuitive. The interface is minimal and task-oriented — your team can start using it immediately. We also provide onboarding guides and support via chat." }
      },
      {
        "@type": "Question",
        "name": "How does AI help with food cost in restaurants?",
        "acceptedAnswer": { "@type": "Answer", "text": "RiveHub's AI scans your invoices via OCR, tracks ingredient prices over time, calculates real-time food cost per dish, and alerts you when costs exceed targets. It also factors in labor cost to give you true margin per plate — replacing hours of spreadsheet work with instant, accurate data." }
      },
      {
        "@type": "Question",
        "name": "Can AI replace a restaurant manager?",
        "acceptedAnswer": { "@type": "Answer", "text": "AI doesn't replace restaurant managers — it amplifies them. RiveHub handles repetitive data work (compliance logs, cost calculations, inventory tracking) so managers can focus on what humans do best: hospitality, team leadership, and guest experience. Think of it as a co-pilot, not a replacement." }
      },
      {
        "@type": "Question",
        "name": "What makes RiveHub different from other restaurant management software?",
        "acceptedAnswer": { "@type": "Answer", "text": "RiveHub is built specifically for gastronomic and fine dining restaurants, not fast food chains. It combines AI-powered analytics with tools designed for complex menus, multi-language teams, and high standards of compliance. Most restaurant software digitizes paperwork — RiveHub provides actionable intelligence." }
      },
      {
        "@type": "Question",
        "name": "Does RiveHub work for fine dining restaurants?",
        "acceptedAnswer": { "@type": "Answer", "text": "RiveHub was designed for fine dining and gastronomic restaurants from day one. Features like menu engineering matrices, detailed food cost analysis per dish, wine and bar management, and multi-language support for international kitchen teams are built for high-end operations." }
      },
      {
        "@type": "Question",
        "name": "How much does AI restaurant management software cost?",
        "acceptedAnswer": { "@type": "Answer", "text": "RiveHub starts with a free plan (no credit card required). Paid plans begin at $59/month for the Essence tier, $129/month for Performance (adds menu engineering and POS integration), and $249/month for Intelligence (full predictive analytics suite). All plans include AI features — there are no per-seat charges." }
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
