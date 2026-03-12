import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("login_title"),
    description: t("login_description"),
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
