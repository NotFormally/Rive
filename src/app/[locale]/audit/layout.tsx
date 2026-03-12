import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("audit_title"),
    description: t("audit_description"),
  };
}

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
