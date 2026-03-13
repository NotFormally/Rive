"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Camera, Upload, CheckCircle2, AlertTriangle, FileText, Download, Printer, ChevronRight, Zap } from "lucide-react";
import Image from "next/image";

// Types
type ProcessStatus = "scanning" | "processing" | "success" | "error" | "waiting";

interface InvoiceProcessing {
  id: string;
  filename: string;
  status: ProcessStatus;
  thumbnail: string;
  supplier?: string;
  total?: number;
  itemsCount?: number;
  date?: string;
  confidence?: number;
}

const MOCK_INVOICES: InvoiceProcessing[] = [
  {
    id: "inv_1",
    filename: "sysco_delivery_march7.pdf",
    status: "success",
    thumbnail: "https://images.unsplash.com/photo-1620325867502-221ddb5faa5f?q=80&w=200&auto=format&fit=crop",
    supplier: "Sysco Rive-Sud",
    total: 1450.25,
    itemsCount: 42,
    date: "2026-03-07",
    confidence: 99
  },
  {
    id: "inv_2",
    filename: "IMG_FERME_LOCALE.jpg",
    status: "processing",
    thumbnail: "https://images.unsplash.com/photo-1596162954151-cdcb4c0f70a8?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "inv_3",
    filename: "facture_viande.pdf",
    status: "error",
    thumbnail: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=200&auto=format&fit=crop",
  }
];

export function OneClickComplianceDashboard() {
  const t = useTranslations('OneClickCompliance');
  const [invoices, setInvoices] = useState<InvoiceProcessing[]>(MOCK_INVOICES);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    // Basic validation
    if (!file.type.match('image.*') && file.type !== 'application/pdf') {
      toast.error("Format non supporté (image ou pdf uniquement)");
      return;
    }

    const newInvoice: InvoiceProcessing = {
      id: "inv_" + Date.now(),
      filename: file.name,
      status: "processing",
      thumbnail: "https://images.unsplash.com/photo-1596162954151-cdcb4c0f70a8?q=80&w=200&auto=format&fit=crop", // placeholder
    };

    setInvoices(prev => [newInvoice, ...prev]);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // remove data:image/jpeg;base64, prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/extract-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          mediaType: file.type,
          isPdf: file.type === 'application/pdf'
        })
      });

      if (!response.ok) {
        throw new Error('API Error');
      }

      const data = await response.json();

      setInvoices(prev => prev.map(inv => 
        inv.id === newInvoice.id 
          ? { 
              ...inv, 
              status: "success", 
              supplier: data.supplier_name || "Fournisseur Inconnu",
              total: data.total_amount || 0,
              itemsCount: data.items?.length || 0,
              confidence: data.items && data.items.length > 0 ? Math.round((data.items[0].ai_confidence || 0.95) * 100) : 95
            } 
          : inv
      ));

    } catch (error) {
      console.error("Upload error:", error);
      setInvoices(prev => prev.map(inv => 
        inv.id === newInvoice.id ? { ...inv, status: "error" } : inv
      ));
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-3xl font-outfit font-bold text-white tracking-tight">Réception & Conformité</h1>
          </div>
          <p className="text-slate-400 font-jakarta max-w-xl">
            Prenez en photo vos bons de livraison. L'IA extrait les articles, met à jour l'inventaire 
            et génère les étiquettes DLUO automatiquement (One-Click Compliance).
          </p>
        </div>
        
        {/* KPI Cards Mini */}
        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex flex-col items-center">
            <span className="text-2xl font-plex-mono font-bold text-emerald-400">14</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{t('invoicesProcessed')}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex flex-col items-center shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <span className="text-2xl font-plex-mono font-bold text-purple-400">{/* i18n-ignore */}82h</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{t('timeSavedMonth')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Dropzone & Live Camera Area */}
        <div className="lg:col-span-8 space-y-6">
          <div 
            className={`w-full h-64 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 cursor-pointer relative overflow-hidden ${
              isDragActive ? "border-purple-500 bg-purple-500/10 scale-[1.02]" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            }`}
            onDragEnter={() => setIsDragActive(true)}
            onDragLeave={() => setIsDragActive(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragActive(false);
              const file = e.dataTransfer.files[0];
              if (file) handleUpload(file);
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-xl">
              <Upload className="w-8 h-8 text-purple-400" />
            </div>
            
            <div className="text-center space-y-1 z-10">
              <h3 className="text-lg font-outfit font-bold text-white">{t('dropzoneTitle')}</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Vous pouvez aussi utiliser l'application mobile RiveHub pour prendre en photo un bon de réception directement sur le quai de déchargement.
              </p>
            </div>
            
            <div className="flex gap-4 mt-2 z-10">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-6 py-2 rounded-xl bg-purple-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all"
              >
                Parcourir
              </button>
            </div>
          </div>

          {/* Active Processing List */}
          <div className="space-y-4">
            <h3 className="text-lg font-outfit font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Flux de Traitement Actif
            </h3>
            
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/10 transition-all hover:bg-slate-800/80">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-white/10 relative">
                    <Image src={inv.thumbnail} alt={inv.filename} fill className="object-cover opacity-60" />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 space-y-1 w-full">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-200 truncate pr-4">{inv.filename}</h4>
                      
                      {/* Status Badge */}
                      {inv.status === "processing" && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Extraction OCR...
                        </span>
                      )}
                      {inv.status === "success" && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Traitée ({inv.confidence}%)
                        </span>
                      )}
                      {inv.status === "error" && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5" /> Fichier Illisible
                        </span>
                      )}
                    </div>
                    
                    {inv.status === "success" && (
                      <div className="flex items-center gap-4 text-xs font-jakarta text-slate-400">
                        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {inv.supplier}</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {inv.itemsCount} lignes</span>
                        <strong className="text-white">${inv.total?.toFixed(2)}</strong>
                      </div>
                    )}
                    
                    {inv.status === "processing" && (
                      <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 w-2/3 animate-pulse" />
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  {inv.status === "success" && (
                    <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto shrink-0">
                      <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-colors text-xs font-bold">
                        <Printer className="w-4 h-4" /> DLUO
                      </button>
                      <button className="flex-1 sm:flex-none flex items-center justify-center p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info & Bluetooth Connection Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
            <h3 className="font-outfit font-bold text-lg text-white mb-4">{t('bluetoothConnections')}</h3>
            
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <p className="text-sm font-bold text-emerald-100">{/* i18n-ignore */}Imprimante DLUO Cuisine</p>
                    <p className="text-xs text-emerald-400/70 font-plex-mono">{/* i18n-ignore */}Connectée • Prête à imprimer</p>
                  </div>
                </div>
                <Printer className="w-5 h-5 text-emerald-400" />
              </div>
              
              <div className="p-3 rounded-xl border border-white/5 bg-black/40 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-300">{/* i18n-ignore */}Balance Connectée (Réception)</p>
                    <p className="text-xs text-slate-500 font-plex-mono">{t('disconnected')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6">
            <h3 className="font-outfit font-bold text-sm text-indigo-400 flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4" /> La Magie RiveHub
            </h3>
            <p className="text-sm text-indigo-200/90 font-jakarta leading-relaxed">
              Lorsqu'une facture est scannée avec succès, RiveHub analyse les ingrédients reçus (ex: Poissons, Viandes). 
              Le système envoie alors automatiquement les ordres d'impression à l'imprimante Bluetooth de la cuisine pour générer 
              les étiquettes de traçabilité (DLUO) avec les durées de conservation légales.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
