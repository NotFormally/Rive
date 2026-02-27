import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale;
  const t = await getTranslations({ locale, namespace: 'Meta' });
  return {
    title: t('cgu_title'),
    description: t('cgu_description'),
  };
}

export default function CGUPage() {
  const t = useTranslations("CGU");

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("title")}</h1>
        <p className="text-sm text-slate-500 mb-8 italic">
          {t("last_update")}
        </p>

        <div className="prose prose-slate prose-blue max-w-none">
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4 border-b pb-2">{t("s1_title")}</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            {t("s1_p1")}
          </p>
          <ul className="list-disc pl-5 mb-6 text-slate-700 space-y-2">
            <li>{t("s1_l1")}</li>
            <li>{t("s1_l2")}</li>
            <li>{t("s1_l3")}</li>
            <li>{t("s1_l4")}</li>
            <li>{t("s1_l5")}</li>
            <li>{t("s1_l6")}</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4 border-b pb-2">{t("s2_title")}</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            {t("s2_p1")}<br />
            {t("s2_p2")}<br />
            {t("s2_p3")}
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4 border-b pb-2">{t("s3_title")}</h2>
          
          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">{t("s3_s1_title")}</h3>
          <p className="mb-4 text-slate-700 leading-relaxed">
            {t("s3_s1_p1")}
          </p>
          <ul className="list-disc pl-5 mb-6 text-slate-700 space-y-2">
            <li>{t("s3_l1")}</li>
            <li>{t("s3_l2")}</li>
            <li>{t("s3_l3")}</li>
            <li>{t("s3_l4")}</li>
            <li>{t("s3_l5")}</li>
            <li>{t("s3_l6")}</li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">{t("s3_s2_title")}</h3>
          <p className="mb-4 text-slate-900 font-medium leading-relaxed">
            {t("s3_s2_p1")}
          </p>
          <p className="mb-4 text-slate-700 leading-relaxed">{t("s3_s2_p2")}</p>
          <ul className="list-disc pl-5 mb-6 text-slate-700 space-y-2">
            <li>{t("s3_s2_l1")}</li>
            <li>{t("s3_s2_l2")}</li>
            <li>{t("s3_s2_l3")}</li>
            <li>{t("s3_s2_l4")}</li>
            <li>{t("s3_s2_l5")}</li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">{t("s3_s3_title")}</h3>
          <ul className="list-disc pl-5 mb-6 text-slate-700 space-y-2">
            <li>{t("s3_s3_l1")}</li>
            <li>{t("s3_s3_l2")}</li>
            <li>{t("s3_s3_l3")}</li>
            <li>{t("s3_s3_l4")}</li>
          </ul>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">{t("s3_s4_title")}</h3>
          <p className="mb-6 text-slate-700 leading-relaxed">
            {t("s3_s4_p1")}
          </p>

          <h3 className="text-lg font-medium text-slate-800 mt-6 mb-3">{t("s3_s5_title")}</h3>
          <p className="mb-6 text-slate-700 leading-relaxed">
            {t("s3_s5_p1")}
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4 border-b pb-2">{t("s4_title")}</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            {t("s4_p1")}<br />
            {t("s4_p2")}<br />
            {t("s4_p3")}<br />
            {t("s4_p4")}
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4 border-b pb-2">{t("s5_title")}</h2>
          <p className="mb-4 text-slate-700 leading-relaxed">
            {t("s5_p1")}<br />
            {t("s5_p2")}
          </p>
          <ul className="list-disc pl-5 mb-6 text-slate-700 space-y-2">
            <li>{t("s5_l1")}</li>
            <li>{t("s5_l2")}</li>
            <li>{t("s5_l3")}</li>
          </ul>
          <p className="mb-6 text-slate-700 leading-relaxed">
            {t("s5_p3")}
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4 border-b pb-2">{t("s6_title")}</h2>
          <p className="mb-6 text-slate-700 leading-relaxed">
            {t("s6_p1")}<br />
            {t("s6_p2")}<br />
            {t("s6_p3")}
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4 border-b pb-2">{t("s7_title")}</h2>
          <p className="mb-6 text-slate-700 leading-relaxed">
            {t("s7_p1")}<br />
            {t("s7_p2")}<br />
            {t("s7_p3")}
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4 border-b pb-2">{t("s8_title")}</h2>
          <p className="mb-6 text-slate-700 leading-relaxed">
            {t("s8_p1")}<br />
            {t("s8_p2")}
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4 border-b pb-2">{t("s9_title")}</h2>
          <p className="mb-6 text-slate-700 leading-relaxed">
            {t("s9_p1")}
          </p>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
            &larr; {t("back_to_home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
