"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { InvoiceScanner } from "@/components/food-cost/InvoiceScanner";
import { Receipt, Calendar, Store, ArrowRight } from "lucide-react";

export default function InvoicesPage() {
  const { settings, user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // We actually need to fetch via API route since Supabase client in useAuth is not directly exposed 
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/food-cost/invoices');
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  if (!settings?.module_food_cost) {
    return (
      <div className="p-8 text-center text-slate-500">
        Ce module est désactivé. Vous pouvez l'activer dans les Paramètres.
      </div>
    );
  }

  return (
    <>
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="px-8 py-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-500" />
            Scans OCR & Factures
          </h1>
          <p className="text-sm text-zinc-500">Numérisez vos factures pour alimenter le Food Cost Dynamique</p>
        </div>
        <div className="px-8 flex items-center gap-6 text-sm font-medium border-t border-zinc-100 dark:border-zinc-800">
          <a href="/dashboard/food-cost" className="py-3 border-b-2 border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Vue Globale</a>
          <a href="/dashboard/food-cost/ingredients" className="py-3 border-b-2 border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Ingrédients</a>
          <a href="/dashboard/food-cost/recipes" className="py-3 border-b-2 border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Recettes</a>
          <a href="/dashboard/food-cost/invoices" className="py-3 border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400">Factures Scannées</a>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Upload Scanner Component */}
        <InvoiceScanner onScanComplete={fetchInvoices} />

        {/* History / Recent Invoices list */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Historique des numérisations</h2>
            <div className="text-sm text-zinc-500 flex items-center gap-1">
              {invoices.length} factures enregistrées
            </div>
          </div>
          
          <div className="p-0">
             {loading ? (
                <div className="p-10 text-center text-zinc-500">Chargement de l'historique...</div>
             ) : invoices.length === 0 ? (
                <div className="p-10 text-center text-zinc-500">
                   Aucune facture n'a encore été scannée par RiveFood AI.
                </div>
             ) : (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                   {invoices.map(invoice => (
                      <div key={invoice.id} className="p-4 sm:p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                         <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <Store className="w-4 h-4 text-zinc-400" />
                               <span className="font-semibold text-zinc-900 dark:text-zinc-100">{invoice.supplier_name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-zinc-500">
                               <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {invoice.date}</span>
                               <span className="hidden sm:inline">•</span>
                               <span className="text-zinc-600 dark:text-zinc-400">{invoice.invoice_items?.[0]?.count || 0} articles détectés</span>
                            </div>
                         </div>
                         
                         <div className="flex flex-col sm:items-end gap-1 w-full sm:w-auto">
                            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{invoice.total_amount}</div>
                            {invoice.top_items && invoice.top_items.length > 0 && (
                               <div className="text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-xs">
                                  Inclus: {invoice.top_items.slice(0, 2).join(', ')}...
                               </div>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>

      </div>
    </>
  );
}
