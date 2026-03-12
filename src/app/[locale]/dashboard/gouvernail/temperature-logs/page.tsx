"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { TemperatureLogger } from "@/components/TemperatureLogger";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function TemperatureLogsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("TemperatureLogger");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="pt-24 pb-12 px-6 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#CC5833] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="pt-24 pb-12 px-6">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-8">
        <Link
          href="/dashboard/gouvernail"
          className="inline-flex items-center gap-2 text-[#F2F0E9]/50 hover:text-[#F2F0E9] font-outfit text-sm transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back_to_gouvernail")}
        </Link>
        <h1 className="font-jakarta text-3xl font-bold text-[#F2F0E9]">
          {t("page_title")}
        </h1>
        <p className="font-outfit text-[#F2F0E9]/50 mt-1">
          {t("page_subtitle")}
        </p>
      </div>

      <TemperatureLogger />
    </div>
  );
}
