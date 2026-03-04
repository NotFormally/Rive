import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { Metadata } from "next";

/** Convert markdown bold/italic in legal text to HTML (safe — content is ours, not user input) */
function md(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function P({ children, className }: { children: string; className?: string }) {
  return <p className={className} dangerouslySetInnerHTML={{ __html: md(children) }} />;
}

function Li({ children }: { children: string }) {
  return <li dangerouslySetInnerHTML={{ __html: md(children) }} />;
}

/** Definition list item: bold term + description */
function Def({ term, def }: { term: string; def: string }) {
  return (
    <li>
      <span dangerouslySetInnerHTML={{ __html: md(term) }} className="font-semibold text-slate-800" />
      {" — "}
      <span dangerouslySetInnerHTML={{ __html: md(def) }} />
    </li>
  );
}

// Reusable style constants
const h2 = "text-xl font-semibold text-slate-800 mt-8 mb-4 border-b pb-2";
const h3 = "text-lg font-medium text-slate-800 mt-6 mb-3";
const p = "mb-4 text-slate-700 leading-relaxed";
const pLast = "mb-6 text-slate-700 leading-relaxed";
const ul = "list-disc pl-5 mb-6 text-slate-700 space-y-2";

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

          {/* ============================================================= */}
          {/* 1. Objet du Service                                           */}
          {/* ============================================================= */}
          <h2 className={h2}>{t("s1_title")}</h2>
          <P className={p}>{t("s1_p1")}</P>
          <P className={p}>{t("s1_p2")}</P>
          <ul className={ul}>
            <Li>{t("s1_l1")}</Li>
            <Li>{t("s1_l2")}</Li>
            <Li>{t("s1_l3")}</Li>
            <Li>{t("s1_l4")}</Li>
            <Li>{t("s1_l5")}</Li>
            <Li>{t("s1_l6")}</Li>
            <Li>{t("s1_l7")}</Li>
            <Li>{t("s1_l8")}</Li>
            <Li>{t("s1_l9")}</Li>
            <Li>{t("s1_l10")}</Li>
            <Li>{t("s1_l11")}</Li>
            <Li>{t("s1_l12")}</Li>
            <Li>{t("s1_l13")}</Li>
          </ul>
          <P className={pLast}>{t("s1_p3")}</P>

          {/* ============================================================= */}
          {/* 2. Définitions                                                */}
          {/* ============================================================= */}
          <h2 className={h2}>{t("s2_title")}</h2>
          <P className={p}>{t("s2_p1")}</P>
          <ul className={`${ul} space-y-3`}>
            <Def term={t("s2_d1_term")} def={t("s2_d1_def")} />
            <Def term={t("s2_d2_term")} def={t("s2_d2_def")} />
            <Def term={t("s2_d3_term")} def={t("s2_d3_def")} />
            <Def term={t("s2_d4_term")} def={t("s2_d4_def")} />
            <Def term={t("s2_d5_term")} def={t("s2_d5_def")} />
            <Def term={t("s2_d6_term")} def={t("s2_d6_def")} />
            <Def term={t("s2_d7_term")} def={t("s2_d7_def")} />
            <Def term={t("s2_d8_term")} def={t("s2_d8_def")} />
          </ul>

          {/* ============================================================= */}
          {/* 3. Accès, Inscription et Gestion d'Équipe                     */}
          {/* ============================================================= */}
          <h2 className={h2}>{t("s3_title")}</h2>

          <h3 className={h3}>{t("s3_s1_title")}</h3>
          <P className={pLast}>{t("s3_s1_p1")}</P>

          <h3 className={h3}>{t("s3_s2_title")}</h3>
          <P className={pLast}>{t("s3_s2_p1")}</P>

          <h3 className={h3}>{t("s3_s3_title")}</h3>
          <P className={p}>{t("s3_s3_p1")}</P>
          <ul className={ul}>
            <Li>{t("s3_s3_l1")}</Li>
            <Li>{t("s3_s3_l2")}</Li>
            <Li>{t("s3_s3_l3")}</Li>
          </ul>
          <P className={pLast}>{t("s3_s3_p2")}</P>

          <h3 className={h3}>{t("s3_s4_title")}</h3>
          <P className={pLast}>{t("s3_s4_p1")}</P>

          {/* ============================================================= */}
          {/* 4. Intégrations Tierces                                       */}
          {/* ============================================================= */}
          <h2 className={h2}>{t("s4_title")}</h2>
          <P className={p}>{t("s4_p1")}</P>

          <h3 className={h3}>{t("s4_s1_title")}</h3>
          <P className={p}>{t("s4_s1_p1")}</P>
          <ul className={ul}>
            <Li>{t("s4_s1_l1")}</Li>
            <Li>{t("s4_s1_l2")}</Li>
            <Li>{t("s4_s1_l3")}</Li>
            <Li>{t("s4_s1_l4")}</Li>
            <Li>{t("s4_s1_l5")}</Li>
            <Li>{t("s4_s1_l6")}</Li>
            <Li>{t("s4_s1_l7")}</Li>
          </ul>
          <P className={pLast}>{t("s4_s1_p2")}</P>

          <h3 className={h3}>{t("s4_s2_title")}</h3>
          <P className={p}>{t("s4_s2_p1")}</P>
          <ul className={ul}>
            <Li>{t("s4_s2_l1")}</Li>
            <Li>{t("s4_s2_l2")}</Li>
            <Li>{t("s4_s2_l3")}</Li>
          </ul>
          <P className={pLast}>{t("s4_s2_p2")}</P>

          <h3 className={h3}>{t("s4_s3_title")}</h3>
          <P className={p}>{t("s4_s3_p1")}</P>
          <ul className={ul}>
            <Li>{t("s4_s3_l1")}</Li>
            <Li>{t("s4_s3_l2")}</Li>
          </ul>
          <P className={pLast}>{t("s4_s3_p2")}</P>

          <h3 className={h3}>{t("s4_s4_title")}</h3>
          <P className={pLast}>{t("s4_s4_p1")}</P>

          {/* ============================================================= */}
          {/* 5. Intelligence Artificielle et Responsabilité                */}
          {/* ============================================================= */}
          <h2 className={h2}>{t("s5_title")}</h2>

          <h3 className={h3}>{t("s5_s1_title")}</h3>
          <P className={p}>{t("s5_s1_p1")}</P>
          <ul className={ul}>
            <Li>{t("s5_s1_l1")}</Li>
            <Li>{t("s5_s1_l2")}</Li>
            <Li>{t("s5_s1_l3")}</Li>
            <Li>{t("s5_s1_l4")}</Li>
            <Li>{t("s5_s1_l5")}</Li>
            <Li>{t("s5_s1_l6")}</Li>
            <Li>{t("s5_s1_l7")}</Li>
            <Li>{t("s5_s1_l8")}</Li>
            <Li>{t("s5_s1_l9")}</Li>
          </ul>

          <h3 className={h3}>{t("s5_s2_title")}</h3>
          <P className="mb-4 text-slate-900 font-medium leading-relaxed">{t("s5_s2_p1")}</P>
          <ul className={ul}>
            <Li>{t("s5_s2_l1")}</Li>
            <Li>{t("s5_s2_l2")}</Li>
            <Li>{t("s5_s2_l3")}</Li>
            <Li>{t("s5_s2_l4")}</Li>
            <Li>{t("s5_s2_l5")}</Li>
          </ul>

          <h3 className={h3}>{t("s5_s3_title")}</h3>
          <P className={p}>{t("s5_s3_p1")}</P>
          <ul className={ul}>
            <Li>{t("s5_s3_l1")}</Li>
            <Li>{t("s5_s3_l2")}</Li>
            <Li>{t("s5_s3_l3")}</Li>
            <Li>{t("s5_s3_l4")}</Li>
          </ul>

          <h3 className={h3}>{t("s5_s4_title")}</h3>
          <P className={pLast}>{t("s5_s4_p1")}</P>

          <h3 className={h3}>{t("s5_s5_title")}</h3>
          <P className={pLast}>{t("s5_s5_p1")}</P>

          <h3 className={h3}>{t("s5_s6_title")}</h3>
          <P className={pLast}>{t("s5_s6_p1")}</P>

          <h3 className={h3}>{t("s5_s7_title")}</h3>
          <P className={p}>{t("s5_s7_p1")}</P>
          <ul className={ul}>
            <Li>{t("s5_s7_l1")}</Li>
            <Li>{t("s5_s7_l2")}</Li>
            <Li>{t("s5_s7_l3")}</Li>
            <Li>{t("s5_s7_l4")}</Li>
          </ul>
          <P className={pLast}>{t("s5_s7_p2")}</P>

          <h3 className={h3}>{t("s5_s8_title")}</h3>
          <P className={pLast}>{t("s5_s8_p1")}</P>

          {/* ============================================================= */}
          {/* 6. Protection des Données et Vie Privée                       */}
          {/* ============================================================= */}
          <h2 className={h2}>{t("s6_title")}</h2>

          <h3 className={h3}>{t("s6_s1_title")}</h3>
          <P className={pLast}>{t("s6_s1_p1")}</P>

          <h3 className={h3}>{t("s6_s2_title")}</h3>
          <P className={p}>{t("s6_s2_p1")}</P>
          <ul className={ul}>
            <Li>{t("s6_s2_l1")}</Li>
            <Li>{t("s6_s2_l2")}</Li>
            <Li>{t("s6_s2_l3")}</Li>
            <Li>{t("s6_s2_l4")}</Li>
            <Li>{t("s6_s2_l5")}</Li>
            <Li>{t("s6_s2_l6")}</Li>
            <Li>{t("s6_s2_l7")}</Li>
            <Li>{t("s6_s2_l8")}</Li>
            <Li>{t("s6_s2_l9")}</Li>
          </ul>

          <h3 className={h3}>{t("s6_s3_title")}</h3>
          <P className={pLast}>{t("s6_s3_p1")}</P>

          <h3 className={h3}>{t("s6_s4_title")}</h3>
          <P className={pLast}>{t("s6_s4_p1")}</P>

          <h3 className={h3}>{t("s6_s5_title")}</h3>
          <P className={pLast}>{t("s6_s5_p1")}</P>

          <h3 className={h3}>{t("s6_s6_title")}</h3>
          <P className={p}>{t("s6_s6_p1")}</P>
          <ul className={ul}>
            <Li>{t("s6_s6_l1")}</Li>
            <Li>{t("s6_s6_l2")}</Li>
            <Li>{t("s6_s6_l3")}</Li>
            <Li>{t("s6_s6_l4")}</Li>
            <Li>{t("s6_s6_l5")}</Li>
            <Li>{t("s6_s6_l6")}</Li>
          </ul>
          <P className={pLast}>{t("s6_s6_p2")}</P>

          <h3 className={h3}>{t("s6_s7_title")}</h3>
          <P className={pLast}>{t("s6_s7_p1")}</P>

          <h3 className={h3}>{t("s6_s8_title")}</h3>
          <P className={pLast}>{t("s6_s8_p1")}</P>

          {/* ============================================================= */}
          {/* 7. Propriété Intellectuelle                                   */}
          {/* ============================================================= */}
          <h2 className={h2}>{t("s7_title")}</h2>

          <h3 className={h3}>{t("s7_s1_title")}</h3>
          <P className={pLast}>{t("s7_s1_p1")}</P>

          <h3 className={h3}>{t("s7_s2_title")}</h3>
          <P className={pLast}>{t("s7_s2_p1")}</P>

          <h3 className={h3}>{t("s7_s3_title")}</h3>
          <P className={pLast}>{t("s7_s3_p1")}</P>

          {/* ============================================================= */}
          {/* 8. Abonnement, Facturation et Niveaux de Service              */}
          {/* ============================================================= */}
          <h2 className={h2}>{t("s8_title")}</h2>

          <h3 className={h3}>{t("s8_s1_title")}</h3>
          <P className={p}>{t("s8_s1_p1")}</P>
          <ul className={ul}>
            <Li>{t("s8_s1_l1")}</Li>
            <Li>{t("s8_s1_l2")}</Li>
            <Li>{t("s8_s1_l3")}</Li>
            <Li>{t("s8_s1_l4")}</Li>
            <Li>{t("s8_s1_l5")}</Li>
          </ul>
          <P className={pLast}>{t("s8_s1_p2")}</P>

          <h3 className={h3}>{t("s8_s2_title")}</h3>
          <P className={pLast}>{t("s8_s2_p1")}</P>

          <h3 className={h3}>{t("s8_s3_title")}</h3>
          <P className={pLast}>{t("s8_s3_p1")}</P>

          <h3 className={h3}>{t("s8_s4_title")}</h3>
          <P className={pLast}>{t("s8_s4_p1")}</P>

          {/* ============================================================= */}
          {/* 9. Limitation de Responsabilité                               */}
          {/* ============================================================= */}
          <h2 className={h2}>{t("s9_title")}</h2>

          <h3 className={h3}>{t("s9_s1_title")}</h3>
          <P className={pLast}>{t("s9_s1_p1")}</P>

          <h3 className={h3}>{t("s9_s2_title")}</h3>
          <P className={p}>{t("s9_s2_p1")}</P>
          <ul className={ul}>
            <Li>{t("s9_s2_l1")}</Li>
            <Li>{t("s9_s2_l2")}</Li>
            <Li>{t("s9_s2_l3")}</Li>
            <Li>{t("s9_s2_l4")}</Li>
            <Li>{t("s9_s2_l5")}</Li>
            <Li>{t("s9_s2_l6")}</Li>
          </ul>

          <h3 className={h3}>{t("s9_s3_title")}</h3>
          <P className={pLast}>{t("s9_s3_p1")}</P>

          <h3 className={h3}>{t("s9_s4_title")}</h3>
          <P className={pLast}>{t("s9_s4_p1")}</P>

          {/* ============================================================= */}
          {/* 10. Résiliation et Portabilité des Données                    */}
          {/* ============================================================= */}
          <h2 className={h2}>{t("s10_title")}</h2>

          <h3 className={h3}>{t("s10_s1_title")}</h3>
          <P className={pLast}>{t("s10_s1_p1")}</P>

          <h3 className={h3}>{t("s10_s2_title")}</h3>
          <P className={pLast}>{t("s10_s2_p1")}</P>

          <h3 className={h3}>{t("s10_s3_title")}</h3>
          <P className={pLast}>{t("s10_s3_p1")}</P>

          <h3 className={h3}>{t("s10_s4_title")}</h3>
          <P className={pLast}>{t("s10_s4_p1")}</P>

          {/* ============================================================= */}
          {/* 11. Modifications des Conditions                              */}
          {/* ============================================================= */}
          <h2 className={h2}>{t("s11_title")}</h2>
          <P className={p}>{t("s11_p1")}</P>
          <P className={p}>{t("s11_p2")}</P>
          <P className={pLast}>{t("s11_p3")}</P>

          {/* ============================================================= */}
          {/* 12. Droit Applicable et Juridiction                           */}
          {/* ============================================================= */}
          <h2 className={h2}>{t("s12_title")}</h2>
          <P className={p}>{t("s12_p1")}</P>
          <P className={p}>{t("s12_p2")}</P>
          <P className={pLast}>{t("s12_p3")}</P>

          {/* ============================================================= */}
          {/* 13. Contact                                                   */}
          {/* ============================================================= */}
          <h2 className={h2}>{t("s13_title")}</h2>
          <P className={pLast}>{t("s13_p1")}</P>
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
