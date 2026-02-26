"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Check, AlertCircle, RefreshCw, Upload } from "lucide-react";

type MenuItem = {
  id: string;
  name: string;
  category: string;
};

type SaleRecord = {
  id?: string;
  menu_item_id: string;
  quantity_sold_weekly: number;
};

export default function SalesPage() {
  const { profile, settings } = useAuth();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sales, setSales] = useState<Record<string, SaleRecord>>({});
  const [editableSales, setEditableSales] = useState<Record<string, number>>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | boolean>(false);
  const [activeIntegrations, setActiveIntegrations] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch menu items
      const { data: menuData, error: menuErr } = await supabase
        .from("menu_items")
        .select("id, name, category")
        .eq("restaurant_id", profile!.id)
        .order("category")
        .order("name");
      if (menuErr) throw menuErr;

      // Fetch sales
      const { data: salesData, error: salesErr } = await supabase
        .from("pos_sales")
        .select("id, menu_item_id, quantity_sold_weekly")
        .eq("restaurant_id", profile!.id);
      if (salesErr) throw salesErr;

      const salesMap: Record<string, SaleRecord> = {};
      const editableMap: Record<string, number> = {};
      
      for (const s of salesData || []) {
        salesMap[s.menu_item_id] = s;
        editableMap[s.menu_item_id] = s.quantity_sold_weekly;
      }

      // Fetch active integrations
      const { data: integrationsData, error: intErr } = await supabase
        .from("restaurant_integrations")
        .select("provider")
        .eq("restaurant_id", profile!.id)
        .eq("is_active", true);
      if (intErr) throw intErr;
      const providers = (integrationsData || []).map(i => i.provider);

      setMenuItems(menuData || []);
      setSales(salesMap);
      setEditableSales(editableMap);
      setActiveIntegrations(providers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (menuItemId: string, value: string) => {
    const val = parseInt(value, 10);
    setEditableSales(prev => ({
      ...prev,
      [menuItemId]: isNaN(val) ? 0 : val
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const upsertData = [];
      
      for (const item of menuItems) {
        const qty = editableSales[item.id];
        // Only upsert if a value is provided (or if we want to reset to 0)
        if (qty !== undefined) {
          upsertData.push({
            // Since we don't have a unique constraint on (restaurant_id, menu_item_id),
            // we should probably do a bulk delete then insert, OR check existing IDs.
            // Oh wait, in migration_v10, we DID put a UNIQUE(restaurant_id, menu_item_id) if we followed good practices!
            // Wait, let's verify if we did. If not, delete/insert is safer.
            restaurant_id: profile!.id,
            menu_item_id: item.id,
            quantity_sold_weekly: Math.max(0, qty),
            recorded_at: new Date().toISOString()
          });
        }
      }

      if (upsertData.length > 0) {
        // Delete all for this restaurant then re-insert
        const { error: delErr } = await supabase
          .from("pos_sales")
          .delete()
          .eq("restaurant_id", profile!.id);
        if (delErr) throw delErr;

        const { error: insErr } = await supabase
          .from("pos_sales")
          .insert(upsertData);
        if (insErr) throw insErr;
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncPOS = async () => {
    if (activeIntegrations.length === 0) return;
    
    setSyncing(true);
    setError(null);
    setSuccess(false);

    try {
      let totalSynced = 0;
      let syncMessages = [];

      for (const provider of activeIntegrations) {
        const response = await fetch(`/api/integrations/${provider}/sync`, {
          method: 'POST',
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(`Erreur ${provider}: ${data.error || 'Erreur inconnue'}`);
        }
        
        totalSynced += (data.matchedItems || 0);
        syncMessages.push(data.message || `${data.matchedItems} items via ${provider}`);
      }

      setSuccess(`Synchronisation réussie. ${totalSynced} correspondances trouvées.`);
      setTimeout(() => setSuccess(false), 5000);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCsv(true);
    setError(null);
    setSuccess(false);

    try {
      const text = await file.text();
      
      const response = await fetch('/api/integrations/csv/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData: text }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du traitement du CSV');
      }

      setSuccess(data.message || `Import CSV réussi. ${data.matchedItems} plats mis à jour.`);
      setTimeout(() => setSuccess(false), 5000);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingCsv(false);
      // Reset input
      e.target.value = '';
    }
  };

  if (!settings?.module_menu_engineering) {
    return (
      <div className="p-8 text-center text-slate-500">
        Ce module est désactivé. Vous pouvez l'activer dans les Paramètres.
      </div>
    );
  }

  // Group items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 text-sm text-slate-500">
              <a href="/dashboard/engineering" className="hover:text-indigo-600">Carte Marine</a>
              <span>/</span>
              <span className="text-slate-900 font-medium">Ventes POS</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Saisie des volumes de vente</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                id="csv-upload"
                className="hidden"
                onChange={handleCsvUpload}
                disabled={uploadingCsv || loading || saving || syncing}
              />
              <label
                htmlFor="csv-upload"
                className={`flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer ${(uploadingCsv || loading || saving || syncing) ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Upload className={`w-4 h-4 ${uploadingCsv ? 'animate-bounce' : ''}`} />
                {uploadingCsv ? "Analyse IA..." : "Importer CSV"}
              </label>
            </div>
            
            {activeIntegrations.length > 0 && (
              <button
                onClick={handleSyncPOS}
                disabled={syncing || loading || saving}
                className="flex items-center gap-2 bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? "Synchro..." : "Synchroniser POS"}
              </button>
            )}
            <button
              onClick={handleSaveAll}
              disabled={saving || loading || syncing || uploadingCsv}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Sauvegarde..." : (
                <>
                  <Check className="w-4 h-4" />
                  Enregistrer les ventes
                </>
              )}
            </button>
          </div>
        </div>
        <div className="px-8 flex items-center gap-6 text-sm font-medium">
          <a href="/dashboard/engineering" className="py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors">Matrice</a>
          <a href="/dashboard/engineering/sales" className="py-3 border-b-2 border-indigo-600 text-indigo-600">Ventes POS</a>
        </div>
      </header>

      <div className="p-8 max-w-3xl">
        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              {typeof success === 'string' ? success : "Volumes de ventes mis à jour avec succès."}
            </p>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Chargement...</div>
          ) : menuItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p>Aucun plat trouvé dans le menu.</p>
              <p className="text-sm mt-2">Ajoutez des plats via l'éditeur de menu pour saisir leurs ventes.</p>
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="border-b border-slate-100 last:border-0">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{category}</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex-1">
                        <span className="text-slate-900 font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-500">Ventes hebdo:</label>
                        <input
                          type="number"
                          min="0"
                          value={editableSales[item.id] !== undefined ? editableSales[item.id] : ""}
                          onChange={(e) => handleValueChange(item.id, e.target.value)}
                          className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right font-medium"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
