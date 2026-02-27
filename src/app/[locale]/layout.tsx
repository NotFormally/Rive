import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit, Cormorant_Garamond, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rivehub.com'
const allLocales = ['fr', 'en', 'ar', 'es', 'it', 'hi', 'pa', 'ta', 'bn', 'ru', 'pt', 'zh-HK', 'zh-CN', 'tr']

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale;
  const t = await getTranslations({ locale, namespace: 'Meta' });

  const title = t('home_title');
  const description = t('home_description');
  const url = `${SITE_URL}/${locale}`;

  // Build hreflang alternates
  const languages: Record<string, string> = {};
  for (const loc of allLocales) {
    languages[loc] = `${SITE_URL}/${loc}`;
  }
  languages['x-default'] = `${SITE_URL}/fr`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | Rive`,
    },
    description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Rive',
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const locale = (await params).locale;
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="scroll-smooth">
      <body
        className={`${jakarta.variable} ${outfit.variable} ${cormorant.variable} ${plexMono.variable} antialiased bg-[#F2F0E9] text-[#1A1A1A]`}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

