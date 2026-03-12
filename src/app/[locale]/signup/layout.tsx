import { getTranslations } from "next-intl/server";
import { SUPPORTED_LANGUAGE_COUNT } from "@/lib/languages";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("signup_title"),
    description: t("signup_description", { count: SUPPORTED_LANGUAGE_COUNT }),
  };
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
