"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Target,
  Search,
  Bug,
  Mail,
  MapPin,
  Star,
  TrendingDown,
  Sparkles,
  ChevronRight,
  Send,
  Building2,
  Users
} from "lucide-react";

type Lead = {
  id: string;
  name: string;
  type: string;
  location: string;
  rating: number;
  reviewCount: number;
  identifiedPain: string;
  decisionMaker: string;
  status: "new" | "contacted" | "nurturing";
};

const MOCK_LEADS: Lead[] = [
  {
    id: "l1",
    name: "La Brasserie du Port",
    type: "Bistrot Français",
    location: "Vieux-Port, Montréal",
    rating: 3.8,
    reviewCount: 452,
    identifiedPain: "Temps d'attente trop long selon 45 avis récents. Problème de cadence en cuisine.",
    decisionMaker: "Marc T. (Propriétaire)",
    status: "new"
  },
  {
    id: "l2",
    name: "Sushi Kenta",
    type: "Japonais",
    location: "Plateau Mont-Royal",
    rating: 4.2,
    reviewCount: 890,
    identifiedPain: "Ruptures de stock fréquentes mentionnées en ligne (poisson frais). Gestion d'inventaire défaillante.",
    decisionMaker: "Kenji S. (Chef Exécutif)",
    status: "new"
  },
  {
    id: "l3",
    name: "Osteria Roma",
    type: "Italien Haut de Gamme",
    location: "Laval",
    rating: 4.6,
    reviewCount: 120,
    identifiedPain: "Plaintes sur l'inconstance des plats. Besoin de standardisation et recettes interactives.",
    decisionMaker: "Elena C. (Gérante)",
    status: "nurturing"
  }
];

export function OSINTDashboard() {
  const t = useTranslations('OSINTPanel');
  const [isScanning, setIsScanning] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleLaunchSpiders = () => {
    setIsScanning(true);
    // Simulate API call to /api/osint
    setTimeout(() => {
      setIsScanning(false);
      // In a real app, we would append new leads here.
    }, 3000);
  };

  const handleGenerateMessage = (lead: Lead) => {
    setIsGenerating(true);
    // Simulate LLM prompt generating a non-intrusive sales message
    setTimeout(() => {
      const msg = `Bonjour ${lead.decisionMaker.split(' ')[0]},\n\nJ'ai récemment analysé l'empreinte de ${lead.name} et j'ai remarqué votre excellente réputation (${lead.rating}⭐).\n\nCependant, j'ai noté que certains de vos clients mentionnent régulièrement : "${lead.identifiedPain.split('.')[0].toLowerCase()}". \n\nNotre outil (RiveHub) aide justement les brigades à résoudre ce goulot d'étranglement précis sans changer vos recettes, via un système de "Smart Prep". Je serais ravi d'échanger 10 minutes avec vous si c'est un sujet d'actualité pour vous.\n\nBien à vous,\nL'équipe RiveHub`;
      setGeneratedMessage(msg);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <Target className="w-6 h-6 text-orange-400" />
            </div>
            <h1 className="text-3xl font-outfit font-bold text-white tracking-tight">{t('title')}</h1>
          </div>
          <p className="text-white/60 text-sm max-w-2xl leading-relaxed">
            Centre de ciblage automatisé. Les "Spiders" analysent les registres gouvernementaux et les avis en ligne 
            pour identifier les faiblesses opérationnelles de vos prospects et générer des approches ultra-personnalisées.
          </p>
        </div>

        <button
          onClick={handleLaunchSpiders}
          disabled={isScanning}
          className="flex items-center gap-3 px-6 py-3 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] shrink-0"
        >
          {isScanning ? (
            <>
              <Bug className="w-5 h-5 animate-bounce" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Lancer les Spiders
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CRM Table */}
        <div className="lg:col-span-7 bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[600px]">
          <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-white/90">{t('prospectsTitle')}</h3>
            <span className="text-xs font-plex-mono text-orange-400 bg-orange-400/10 px-2 py-1 rounded">
              {leads.length} Cibles Actives
            </span>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {leads.map(lead => (
              <div 
                key={lead.id}
                onClick={() => {
                  setSelectedLead(lead);
                  setGeneratedMessage("");
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedLead?.id === lead.id 
                    ? "bg-orange-500/10 border-orange-500/30" 
                    : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-white text-lg">{lead.name}</h4>
                    <p className="text-xs text-white/50 flex items-center gap-1.5 mt-1">
                      <Building2 className="w-3 h-3" /> {lead.type} • <MapPin className="w-3 h-3" /> {lead.location}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="flex items-center gap-1 text-amber-400 font-bold text-sm bg-amber-400/10 px-2 py-0.5 rounded">
                      {lead.rating} <Star className="w-3 h-3 fill-amber-400" />
                    </span>
                    <span className="text-[10px] text-white/40 mt-1">{lead.reviewCount} avis</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 rounded-lg bg-black/40 border border-red-500/10">
                  <p className="text-xs text-red-400 flex items-start gap-2">
                    <TrendingDown className="w-4 h-4 shrink-0" />
                    <span className="leading-relaxed">{lead.identifiedPain}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action & Message Pane */}
        <div className="lg:col-span-5 flex flex-col h-[600px]">
          {selectedLead ? (
            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl flex flex-col h-full shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="p-6 border-b border-indigo-500/20 shrink-0">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-plex-mono uppercase tracking-wider mb-2">
                  <Users className="w-4 h-4" /> Décideur Identifié
                </div>
                <h3 className="text-xl font-bold text-white">{selectedLead.decisionMaker}</h3>
                <p className="text-sm text-white/60">{selectedLead.name}</p>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <button
                  onClick={() => handleGenerateMessage(selectedLead)}
                  disabled={isGenerating}
                  className="w-full py-4 rounded-xl border border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-medium transition-colors flex items-center justify-center gap-2 group"
                >
                  {isGenerating ? (
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  )}
                  Générer Approche Non-Intrusive
                </button>

                {generatedMessage && (
                  <div className="mt-6 flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2">
                    <label className="text-xs text-white/40 uppercase tracking-wider font-plex-mono mb-2">{t('draftMessage')}</label>
                    <textarea 
                      className="w-full flex-1 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white/80 font-inter resize-none focus:outline-none focus:border-indigo-500/50 leading-relaxed"
                      value={generatedMessage}
                      onChange={(e) => setGeneratedMessage(e.target.value)}
                    />
                    <div className="flex gap-3 mt-4">
                      <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors">
                        Copier
                      </button>
                      <button className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-bold transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2">
                        <Send className="w-4 h-4" /> Envoyer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl flex-1 flex flex-col items-center justify-center text-center p-8 border-dashed">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-white/60 font-medium">{t('selectTarget')}</h3>
              <p className="text-sm text-white/40 mt-2 max-w-xs">
                Cliquez sur un prospect dans la liste pour générer une approche commerciale personnalisée basée sur ses faiblesses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
