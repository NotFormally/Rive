import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  // Use slug as a readable name (replace hyphens with spaces, capitalize)
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: t("menu_title", { name }),
    description: t("menu_description", { name }),
  };
}

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
