"use client";

import { useState } from "react";
import { 
  Radar, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  UserCircle2, 
  Flame, 
  ShieldCheck, 
  Award 
} from "lucide-react";

// Types for Mock Data
type AuditLog = {
  id: string;
  templateName: string;
  user: string;
  timestamp: string;
  status: "conforme" | "warning" | "non-conforme";
  timeAgo: string;
};

type BrigadeMember = {
  id: string;
  name: string;
  role: string;
  skills: {
    stationId: string;
    level: 0 | 1 | 2 | 3; // 0: Untrained, 1: Beginner, 2: Independent, 3: Expert (Can train others)
  }[];
};

export function SonarDashboard() {
  const [activeTab, setActiveTab] = useState<"radar" | "matrix">("radar");

  // Mock Data: Recent Audits
  const recentAudits: AuditLog[] = [
    { id: "1", templateName: "Réception Poissons", user: "Julien M.", timestamp: "2026-03-06T06:30", status: "conforme", timeAgo: "Il y a 10 min" },
    { id: "2", templateName: "Refroidissement Bouillon", user: "Sarah L.", timestamp: "2026-03-06T05:45", status: "warning", timeAgo: "Il y a 55 min" },
    { id: "3", templateName: "Fermeture Plonge", user: "Marc D.", timestamp: "2026-03-05T23:30", status: "conforme", timeAgo: "Hier soir" },
    { id: "4", templateName: "Températures Frigo (Matin)", user: "Chef", timestamp: "2026-03-06T08:00", status: "non-conforme", timeAgo: "Il y a 6 h" }, // Simulated historical data
  ];

  // Mock Data: Skills Matrix (Gamified but professional)
  const stations = [
    { id: "s1", name: "Garde-Manger", icon: ShieldCheck },
    { id: "s2", name: "Saucier", icon: Flame },
    { id: "s3", name: "Pâtisserie", icon: Award },
    { id: "s4", name: "HACCP & Réception", icon: CheckCircle2 }
  ];

  const brigade: BrigadeMember[] = [
    { id: "u1", name: "Julien M.", role: "Chef de Partie", skills: [{ stationId: "s1", level: 3 }, { stationId: "s2", level: 1 }, { stationId: "s3", level: 0 }, { stationId: "s4", level: 3 }] },
    { id: "u2", name: "Sarah L.", role: "Demi-Chef", skills: [{ stationId: "s1", level: 2 }, { stationId: "s2", level: 2 }, { stationId: "s3", level: 1 }, { stationId: "s4", level: 2 }] },
    { id: "u3", name: "Marc D.", role: "Commis", skills: [{ stationId: "s1", level: 1 }, { stationId: "s2", level: 0 }, { stationId: "s3", level: 0 }, { stationId: "s4", level: 1 }] },
    { id: "u4", name: "Léa T.", role: "Apprentie", skills: [{ stationId: "s1", level: 0 }, { stationId: "s2", level: 0 }, { stationId: "s3", level: 2 }, { stationId: "s4", level: 0 }] },
  ];

  const getStatusColor = (status: AuditLog["status"]) => {
    switch (status) {
      case "conforme": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "warning": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "non-conforme": return "text-red-400 bg-red-500/10 border-red-500/20";
    }
  };

  const getStatusIcon = (status: AuditLog["status"]) => {
    switch (status) {
      case "conforme": return <CheckCircle2 className="w-4 h-4" />;
      case "warning": return <AlertTriangle className="w-4 h-4" />;
      case "non-conforme": return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSkillColor = (level: number) => {
    switch (level) {
      case 3: return "bg-blue-500 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"; // Expert
      case 2: return "bg-emerald-500/80 border-emerald-400/80"; // Independent
      case 1: return "bg-amber-500/60 border-amber-400/60"; // Beginner
      case 0: default: return "bg-white/5 border-white/10"; // Untrained
    }
  };

  const getSkillLabel = (level: number) => {
    switch (level) {
      case 3: return "Top Gun";
      case 2: return "Autonome";
      case 1: return "En formation";
      case 0: default: return "Non assigné";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl relative">
              <Radar className="w-6 h-6 text-blue-400 animate-[spin_4s_linear_infinite]" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
            </div>
            <h1 className="text-3xl font-outfit font-bold text-white tracking-tight">Sonar Dashboard</h1>
          </div>
          <p className="text-white/60 text-sm max-w-2xl leading-relaxed">
            Vue tactique de la production. Surveillez la conformité HACCP en temps réel et anticipez les goulots 
            d'étranglement de votre brigade via la cartographie des compétences.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-[#1A1A1A] border border-white/5 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setActiveTab("radar")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "radar" 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <Activity className="w-4 h-4" />
            Audit Radar
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "matrix" 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <UserCircle2 className="w-4 h-4" />
            Skills Matrix
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        
        {/* TAB 1: RADAR (Recent Audits) */}
        {activeTab === "radar" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Quick Stats Panel */}
               <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-lg">
                  <span className="text-5xl font-outfit font-bold text-emerald-400 mb-2 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">98%</span>
                  <span className="text-sm font-medium text-white/80">Conformité Globale (7j)</span>
                  <span className="text-xs text-white/40 mt-1 font-plex-mono">45 audits complétés</span>
               </div>
               <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
                  <span className="text-3xl font-outfit font-bold text-amber-400 mb-2 relative z-10">2</span>
                  <span className="text-sm font-medium text-white/80 relative z-10">Alertes DLUO</span>
                  <span className="text-xs text-white/40 mt-1 font-plex-mono relative z-10">À vérifier aujourd'hui</span>
               </div>
               <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/20 border border-blue-500/20 rounded-2xl p-6 flex flex-col justify-center items-start shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                     <span className="text-xs font-plex-mono text-blue-300 uppercase tracking-widest">IA Insight</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed italic">
                    "Les audits de réception poisson sont souvent retardés le jeudi matin. Un renfort au Garde-Manger fluidifierait l'opération."
                  </p>
               </div>
            </div>

            {/* Event Feed */}
            <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-semibold text-white/90">Derniers Contrôles (Live Feed)</h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {recentAudits.map((audit) => (
                  <div key={audit.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 uppercase font-outfit font-bold text-white/80 shadow-inner">
                        {audit.user.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium text-white/90">{audit.templateName}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs font-plex-mono">
                           <span className="text-white/50">{audit.user}</span>
                           <span className="text-white/20">•</span>
                           <span className="text-white/40 flex items-center gap-1"><Clock className="w-3 h-3"/> {audit.timeAgo}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 shrink-0 ${getStatusColor(audit.status)}`}>
                      {getStatusIcon(audit.status)}
                      <span className="capitalize">{audit.status.replace("-", " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SKILLS MATRIX */}
        {activeTab === "matrix" && (
          <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
               <div>
                 <h3 className="font-semibold text-white/90 text-lg">Matrice de Vitesse & Compétences</h3>
                 <p className="text-xs text-white/50 mt-1">Identifiez les manques de polyvalence avant qu'ils ne bloquent la production.</p>
               </div>
               <div className="flex items-center gap-4 text-xs font-medium bg-black/40 px-4 py-2 rounded-xl border border-white/5 overflow-x-auto whitespace-nowrap">
                  <div className="flex items-center gap-2 text-white/50"><div className="w-2.5 h-2.5 rounded-full bg-white/10" /> Non Assigné</div>
                  <div className="flex items-center gap-2 text-amber-400"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> En formation</div>
                  <div className="flex items-center gap-2 text-emerald-400"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Autonome</div>
                  <div className="flex items-center gap-2 text-blue-400"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" /> Top Gun</div>
               </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-black/20 text-xs uppercase tracking-wider font-plex-mono text-white/40">
                    <th className="p-4 font-medium border-b border-white/5 w-[200px]">Membre de l'Équipe</th>
                    {stations.map(station => (
                      <th key={station.id} className="p-4 font-medium border-b border-white/5 text-center min-w-[120px]">
                         <div className="flex flex-col items-center gap-2">
                            <station.icon className="w-4 h-4 text-white/30" />
                            {station.name}
                         </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {brigade.map(member => (
                     <tr key={member.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="p-4 border-r border-white/5 bg-white/[0.01]">
                          <div className="font-medium text-white/90">{member.name}</div>
                          <div className="text-xs text-white/50 mt-0.5">{member.role}</div>
                        </td>
                        {stations.map(station => {
                          const skill = member.skills.find(s => s.stationId === station.id);
                          const level = skill?.level || 0;
                          return (
                            <td key={`${member.id}-${station.id}`} className="p-4 text-center">
                              <div className="flex flex-col items-center justify-center gap-1.5 cursor-help group/tooltip relative">
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${getSkillColor(level)}`}>
                                   {level === 3 && <span className="text-[10px] font-bold text-white drop-shadow-md">★</span>}
                                </div>
                                <div className="absolute -top-10 scale-0 group-hover/tooltip:scale-100 transition-transform origin-bottom bg-black text-white text-[10px] py-1 px-2 rounded font-plex-mono border border-white/10 whitespace-nowrap z-20 pointer-events-none shadow-xl">
                                   {getSkillLabel(level)}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Warning Footer */}
            <div className="p-5 bg-amber-500/5 border-t border-amber-500/10 flex items-start gap-4">
               <div className="p-2 bg-amber-500/10 rounded-lg">
                 <AlertTriangle className="w-5 h-5 text-amber-500" />
               </div>
               <div>
                  <h4 className="text-sm font-semibold text-amber-500 mb-1">Vulnérabilité Opérationnelle</h4>
                  <p className="text-sm text-amber-500/80 leading-relaxed">
                    Léa T. est la seule personne formée en Pâtisserie (Autonome/Top Gun) pour le service du soir. 
                    Croisement de compétences recommandé urgemment pour **Marc D.**
                  </p>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
