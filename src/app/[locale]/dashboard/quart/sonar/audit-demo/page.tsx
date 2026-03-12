"use client";

import { useState } from "react";
import { HACCPAuditRunner, HACCPTemplateSchema } from "@/components/haccp/HACCPAuditRunner";
import { useTranslations } from "next-intl";

export default function HACCPAuditDemoPage() {
  const t = useTranslations("SonarAuditDemo");
  const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);

  // Example schema coming from the `audit_templates` DB table
  const mockSchema: HACCPTemplateSchema = {
    fields: [
      {
        id: "temp_cœur",
        label: "Température à cœur (°C)",
        type: "number",
        required: true
      },
      {
        id: "etat_produit",
        label: "Produit sans avarie apparente ?",
        type: "boolean",
        required: true
      },
      {
        id: "observations",
        label: "Observations particulières",
        type: "text",
        required: false
      },
      {
        id: "photo_etiquette",
        label: "Photo de l'étiquette (Traçabilité)",
        type: "image",
        required: true
      }
    ]
  };

  const handleSubmit = (data: Record<string, any>) => {
    setSubmittedData(data);
  };

  return (
    <div className="pt-24 pb-12 px-6">
      
      {submittedData ? (
        <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4">
           <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 text-3xl">
                 ✓
              </div>
              <h2 className="text-2xl font-bold text-white font-outfit">{t("auditTransmitted")}</h2>
              <p className="text-white/70">{t("auditLogImmutable")}</p>
           </div>

           <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-plex-mono text-white/50 uppercase tracking-wider mb-4">{t("payloadLabel")}</h3>
              <pre className="bg-black/50 p-4 rounded-xl text-emerald-400 text-sm overflow-x-auto border border-white/5">
                {JSON.stringify(submittedData, null, 2)}
              </pre>
              <button 
                 onClick={() => setSubmittedData(null)}
                 className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors"
               >
                 {t("newControlBtn")}
              </button>
           </div>
        </div>
      ) : (
        <HACCPAuditRunner 
          templateName="Réception Marchandise : Poissons & Fruits de Mer" 
          schema={mockSchema} 
          onSubmit={handleSubmit} 
        />
      )}

    </div>
  );
}
