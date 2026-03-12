"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { ArrowRight, X } from "lucide-react";
import { useTranslations } from "next-intl";

export function StickyCTA() {
  const t = useTranslations("LandingPage");
  const tc = useTranslations("Common");
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handleScroll() {
      // Show after scrolling past the hero (roughly 600px)
      setVisible(window.scrollY > 600);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (dismissed || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-[#1A1A1A]/95 backdrop-blur-md border-t border-white/10 px-4 py-3 flex items-center gap-3">
        <Link
          href="/signup"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#CC5833] px-4 py-2.5 font-jakarta text-sm font-semibold text-white transition-colors hover:bg-[#CC5833]/90"
        >
          {t("sticky_cta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-2 text-white/40 hover:text-white/70 transition-colors"
          aria-label={tc("aria_dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
