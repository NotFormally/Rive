"use client";

import { useState } from "react";
import { Radar, Play, DownloadCloud, AlertTriangle, Building2, ExternalLink, Sparkles, Mail, CheckCircle2, ChevronRight, MapPin, DollarSign, Activity, Clock } from "lucide-react";

type LeadStatus = "NEW" | "OUTREACH_SENT" | "DEMO_BOOKED" | "CLOSED";
type LeadPriority = "HIGH" | "MEDIUM" | "LOW";

interface OsintLead {
  id: string;
  businessName: string;
  location: string;
  triggerEvent: string;
  details: string;
  fineAmount?: number;
  priority: LeadPriority;
  status: LeadStatus;
  date: string;
}

const MOCK_LEADS: OsintLead[] = [
  {
    id: "lead-1",
    businessName: "Bistro L'Émeraude",
    location: "Plateau Mont-Royal, QC",
    triggerEvent: "Infraction MAPAQ (Chaîne du Froid)",
    details: "Température de la chambre froide mesurée à 8°C (vs 4°C max). Registres de températures papier manquants ou incomplets.",
    fineAmount: 1250,
    priority: "HIGH",
    status: "NEW",
    date: "Aujourd'hui, 09:14"
  },
  {
    id: "lead-2",
    businessName: "Sushi Cascade",
    location: "Laval, QC",
    triggerEvent: "Note Inspecteur Rétrogradée",
    details: "Mauvaise traçabilité des produits de la mer (DLUO expirées trouvées dans les frigos de préparation).",
    fineAmount: 2500,
    priority: "HIGH",
    status: "OUTREACH_SENT",
    date: "Hier, 14:30"
  },
  {
    id: "lead-3",
    businessName: "Café Maritime",
    location: "Vieux-Port, QC",
    triggerEvent: "Nouveau Permis de Restauration",
    details: "Nouvelle ouverture. Pas d'infraction, mais besoin de mise en place d'un plan PMS/HACCP dès le jour 1.",
    priority: "MEDIUM",
    status: "NEW",
    date: "Hier, 10:05"
  }
];

export function OsintDashboard() {
  const [isScraping, setIsScraping] = useState(false);
  const [leads, setLeads] = useState<OsintLead[]>(MOCK_LEADS);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [generatingPitch, setGeneratingPitch] = useState(false);

  const activeLead = leads.find(l => l.id === selectedLead);

  const startScraping = () => {
    setIsScraping(true);
    setTimeout(() => {
      setIsScraping(false);
      const newLead: OsintLead = {
        id: "lead-" + Date.now(),
        businessName: "Brasserie Le Fût",
        location: "Quartier DIX30, Brossard",
        triggerEvent: "Infraction Entretien (Lave-Vaisselle)",
        details: "Température de rinçage terminal insuffisante. Absence de thermomètre étalonné pour vérification.",
        fineAmount: 800,
        priority: "MEDIUM",
        status: "NEW",
        date: "À l'instant"
      };
      setLeads([newLead, ...leads]);
    }, 3500);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "MEDIUM": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "LOW": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      default: return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "NEW": return <span className="px-2 py-1 text-[10px] uppercase font-bold text-blue-400 bg-blue-400/10 rounded-sm">Nouveau</span>;
      case "OUTREACH_SENT": return <span className="px-2 py-1 text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 rounded-sm">Pitch Envoyé</span>;
      case "DEMO_BOOKED": return <span className="px-2 py-1 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-400/10 rounded-sm">Démo Bookée</span>;
      default: return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0B1120]/50 p-6 md:p-8 rounded-[2rem] border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.05)] backdrop-blur-md relative overflow-hidden">
        {/* Radar Effect Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
              <Radar className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-outfit font-bold text-white tracking-tight drop-shadow-sm">La Vigie (OSINT)</h1>
          </div>
          <p className="text-slate-400 font-jakarta max-w-xl text-sm leading-relaxed">
            Machine de génération de leads automatisée. Scrape les données ouvertes (MAPAQ, Inspections) 
            et génère des argumentaires de vente hyper-personnalisés basés sur le « Point de Douleur » des restaurants.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="flex flex-col bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-right">
             <span className="text-xs text-slate-500 font-plex-mono uppercase tracking-widest">Base de Données</span>
             <span className="text-white font-bold font-outfit">{leads.length} Leads Actifs</span>
          </div>

          <button 
            onClick={startScraping}
            disabled={isScraping}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold font-outfit transition-all duration-300 shadow-lg ${
              isScraping 
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 cursor-wait shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                : "bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
            }`}
          >
            {isScraping ? (
              <>
                <Radar className="w-5 h-5 animate-spin" />
                Scan des Registres en cours...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Lancer les Spiders RiveHub
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Left List */}
        <div className="lg:col-span-1 bg-black/30 border border-white/10 rounded-3xl overflow-hidden flex flex-col h-full backdrop-blur-sm">
          <div className="p-4 border-b border-white/10 bg-white/5 font-outfit font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Flux de Prospection
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
             {leads.map(lead => (
               <div 
                 key={lead.id}
                 onClick={() => setSelectedLead(lead.id)}
                 className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                   selectedLead === lead.id 
                     ? "bg-cyan-500/10 border-cyan-500/30 shadow-inner" 
                     : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10"
                 }`}
               >
                 <div className="flex justify-between items-start mb-2">
                   {getStatusBadge(lead.status)}
                   <span className="text-[10px] text-slate-500 font-plex-mono">{lead.date}</span>
                 </div>
                 <h3 className="font-bold text-white font-outfit tracking-wide">{lead.businessName}</h3>
                 <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
                   <AlertTriangle className={`w-3 h-3 ${getPriorityColor(lead.priority).split(' ')[0]}`} />
                   {lead.triggerEvent}
                 </p>
               </div>
             ))}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/10 rounded-3xl h-full flex flex-col backdrop-blur-sm p-6 relative overflow-hidden">
           
           {!activeLead ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
               <Radar className="w-16 h-16 text-cyan-500 mb-6 opacity-40 animate-pulse" />
               <p className="font-outfit text-white text-lg">Sélectionnez un signal OSINT</p>
               <p className="text-sm text-slate-400 mt-2 max-w-sm">
                 Cliquez sur un prospect dans le flux de gauche pour analyser son infraction et générer un e-mail de vente RiveHub.
               </p>
             </div>
           ) : (
             <div className="flex-1 flex flex-col animate-in fade-in duration-300">
               
               {/* Prospect Header */}
               <div className="flex items-start justify-between border-b border-white/10 pb-6 mb-6">
                 <div>
                   <div className="flex items-center gap-3 mb-2">
                     <h2 className="text-3xl font-bold font-outfit text-white">{activeLead.businessName}</h2>
                     <a href="#" className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                       <ExternalLink className="w-4 h-4" />
                     </a>
                   </div>
                   <p className="flex items-center gap-1.5 text-sm text-slate-400 font-jakarta">
                     <MapPin className="w-4 h-4 text-cyan-500/70" /> {activeLead.location}
                   </p>
                 </div>
                 <div className={`px-4 py-2 border rounded-xl flex items-center gap-2 ${getPriorityColor(activeLead.priority)}`}>
                   <Activity className="w-4 h-4" />
                   <span className="text-xs font-bold font-plex-mono uppercase tracking-widest">Priorité : {activeLead.priority}</span>
                 </div>
               </div>

               {/* Infraction Details */}
               <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 mb-6 shadow-inner relative overflow-hidden">
                 <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                 <h3 className="flex items-center gap-2 font-bold text-red-400 mb-4 font-outfit">
                   <AlertTriangle className="w-5 h-5" /> Signal OSINT Détecté (Douleur Client)
                 </h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <span className="text-[10px] uppercase font-plex-mono text-slate-500 font-bold tracking-widest">Type D'événement</span>
                     <p className="text-white text-sm font-jakarta">{activeLead.triggerEvent}</p>
                   </div>
                   {activeLead.fineAmount && (
                     <div className="space-y-1">
                       <span className="text-[10px] uppercase font-plex-mono text-slate-500 font-bold tracking-widest">Amende Potentielle</span>
                       <p className="text-red-300 text-sm font-jakarta font-bold flex items-center">
                         <DollarSign className="w-4 h-4" /> {activeLead.fineAmount.toLocaleString('fr-CA')} CAD
                       </p>
                     </div>
                   )}
                   <div className="col-span-2 space-y-1 mt-2">
                     <span className="text-[10px] uppercase font-plex-mono text-slate-500 font-bold tracking-widest">Note d'inspection / Contexte</span>
                     <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                       <p className="text-slate-300 text-sm italic">"{activeLead.details}"</p>
                     </div>
                   </div>
                 </div>
               </div>

               {/* AI Pitch Generation Area */}
               <div className="flex-1 flex flex-col bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 shadow-inner relative">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="flex items-center gap-2 font-bold text-indigo-400 font-outfit">
                     <Sparkles className="w-5 h-5" /> Hyper-Personnalisation Claude (Pitch)
                   </h3>
                   {!generatingPitch && (
                     <button 
                       onClick={() => {
                         setGeneratingPitch(true);
                         setTimeout(() => setGeneratingPitch(false), 2000);
                       }}
                       className="text-xs bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-colors"
                     >
                       <RefreshCw className="w-3 h-3" /> Régénérer
                     </button>
                   )}
                 </div>

                 {generatingPitch ? (
                   <div className="flex-1 flex flex-col items-center justify-center text-center">
                     <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                     <p className="text-sm font-plex-mono text-indigo-300">Analyse de l'infraction et construction de l'empathie commerciale...</p>
                   </div>
                 ) : (
                   <div className="flex-1 flex flex-col">
                     <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 overflow-y-auto mb-4 custom-scrollbar">
                       <p className="text-slate-300 text-sm whitespace-pre-line font-jakarta leading-relaxed">
                         Objet : Registres de température et sérénité (Inspection récente)
                         {"\n\n"}
                         Bonjour l'équipe de {activeLead.businessName},
                         {"\n\n"}
                         J'ai remarqué une mention concernant {activeLead.triggerEvent.toLowerCase()} récemment. Ne vous inquiétez pas, gérer les registres papier dans l'intensité du service est un cauchemar pour tous les restaurateurs.
                         {"\n\n"}
                         Chez RiveHub, nous avons créé un "Dynamic HACCP Builder" et des alertes connectées qui remplacent le papier. Si vous avez eu un avertissement concernant la chambre froide, notre système peut vous prévenir *avant* la prochaine inspection et surtout, automatiser le registre de conformité en un clic.
                         {"\n\n"}
                         Peut-on prévoir 5 minutes pour que je vous montre comment éliminer ce risque d'amende ({activeLead.fineAmount ? activeLead.fineAmount + '$ ' : ''}en moyenne) pour toujours ?
                         {"\n\n"}
                         Bien à vous,
                         Nassim - RiveHub
                       </p>
                     </div>
                     <button className="w-full flex justify-center items-center gap-2 bg-white hover:bg-slate-200 text-black font-bold font-outfit rounded-xl py-3 transition-colors shadow-lg shadow-white/10">
                       <Mail className="w-5 h-5" /> Envoyer la Séquence Email
                     </button>
                   </div>
                 )}
               </div>

             </div>
           )}
        </div>
      </div>
    </div>
  );
}

// Just importing an icon I missed
import { RefreshCw } from "lucide-react";
