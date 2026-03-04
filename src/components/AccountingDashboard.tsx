"use client";

import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  LineChart, 
  Banknote, 
  Flame, 
  Zap, 
  Droplets,
  PiggyBank,
  Sparkles,
  ArrowRight
} from "lucide-react";

export function AccountingDashboard() {
  const [timeframe, setTimeframe] = useState("month"); // 'week', 'month', 'year'

  // Mock data
  const kpis = {
    revenue: 42500,
    cogs: 12400, // Cost of Goods Sold
    labor: 15200,
    energy: 1100, // Electricity + Water, etc.
    netProfit: 13800,
  };

  const revenueChange = "+8.4%";
  const profitMargin = ((kpis.netProfit / kpis.revenue) * 100).toFixed(1);

  return (
    <div className="space-y-8 md:space-y-10">
      
      {/* AI Summary Banner */}
      <section className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1">
            <h2 className="text-xs font-plex-mono font-bold uppercase tracking-[0.2em] text-primary mb-2">
              Résumé Intelligent des Flux
            </h2>
            <p className="text-foreground/90 font-outfit text-lg leading-relaxed">
              Vos opérations génèrent un flux de trésorerie net positif ce mois-ci. 
              Le coût matière (COGS) est maîtrisé à <strong className="text-primary font-bold bg-primary/10 px-1 rounded">29.1%</strong>, 
              mais vos coûts d'énergie ont augmenté de <strong className="text-amber-400 font-bold bg-amber-400/10 px-1 rounded">5.2%</strong> par rapport au mois précédent. 
              Marge bénéficiaire actuelle estimée à <strong className="text-emerald-400 font-bold bg-emerald-400/10 px-1 rounded">{profitMargin}%</strong>.
            </p>
          </div>
          
          <div className="shrink-0 flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
            <span className="text-xs font-plex-mono uppercase text-emerald-400">Flux Positif</span>
          </div>
        </div>
      </section>

      {/* KPIs Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Revenue */}
        <div className="bg-card backdrop-blur-xl rounded-[2rem] border border-border/50 p-6 flex flex-col justify-between group hover:border-primary/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-shadow">
              <Wallet className="w-5 h-5 text-primary opacity-80" />
            </div>
            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg text-xs font-bold">
              <TrendingUp className="w-3 h-3" />
              {revenueChange}
            </div>
          </div>
          <div>
            <div className="text-sm font-outfit text-muted-foreground mb-1">Entrées (Revenus)</div>
            <div className="text-3xl font-jakarta font-bold text-foreground">
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(kpis.revenue)}
            </div>
          </div>
        </div>

        {/* COGS */}
        <div className="bg-card backdrop-blur-xl rounded-[2rem] border border-border/50 p-6 flex flex-col justify-between group hover:border-pink-500/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:shadow-[0_0_15px_rgba(255,0,122,0.2)] transition-shadow">
              <Banknote className="w-5 h-5 text-pink-400 opacity-80" />
            </div>
            <div className="text-xs font-plex-mono text-muted-foreground opacity-70">
              Coût Marchandises
            </div>
          </div>
          <div>
            <div className="text-sm font-outfit text-muted-foreground mb-1">Sorties: Matière</div>
            <div className="text-3xl font-jakarta font-bold text-foreground">
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(kpis.cogs)}
            </div>
          </div>
        </div>

        {/* Energy & OpEx */}
        <div className="bg-card backdrop-blur-xl rounded-[2rem] border border-border/50 p-6 flex flex-col justify-between group hover:border-amber-400/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:shadow-[0_0_15px_rgba(251,191,36,0.2)] transition-shadow">
               <Zap className="w-5 h-5 text-amber-400 opacity-80" />
            </div>
            <div className="flex items-center gap-1 text-red-400 bg-red-400/10 px-2 py-1 rounded-lg text-xs font-bold">
              <TrendingUp className="w-3 h-3" />
              +5.2%
            </div>
          </div>
          <div>
            <div className="text-sm font-outfit text-muted-foreground mb-1">Sorties: Utilités</div>
            <div className="text-3xl font-jakarta font-bold text-foreground">
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(kpis.energy)}
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-gradient-to-br from-[#0B131E] to-[#121F33] relative overflow-hidden backdrop-blur-xl rounded-[2rem] border border-primary/20 shadow-[0_0_30px_rgba(0,229,255,0.1)] p-6 flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <PiggyBank className="w-5 h-5 text-primary" />
            </div>
            <div className="text-xs font-plex-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
              Marge: {profitMargin}%
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-sm font-outfit text-primary/80 mb-1">Bénéfice Net (Est.)</div>
            <div className="text-4xl font-jakarta font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(kpis.netProfit)}
            </div>
          </div>
        </div>

      </section>

      {/* Cash Flow Chart & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Main Chart */}
        <section className="lg:col-span-2 bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 relative">
          <div className="flex justify-between items-center mb-8">
             <div>
               <h3 className="text-lg font-outfit font-medium text-foreground">Dynamique de Cash Flow</h3>
               <p className="text-xs font-plex-mono text-muted-foreground opacity-60 uppercase tracking-widest mt-1">Revenus vs Dépenses</p>
             </div>
             
             <div className="flex items-center gap-1 bg-black/40 rounded-xl p-1 border border-white/5">
                {["Semaine", "Mois", "Année"].map((tf, i) => (
                  <button key={i} className={`px-3 py-1.5 rounded-lg text-xs font-outfit transition-all ${i === 1 ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white/80'}`}>
                    {tf}
                  </button>
                ))}
             </div>
          </div>

          <div className="relative h-[250px] w-full flex items-end gap-2 mt-4">
             {/* Chart Background Grid */}
             <div className="absolute inset-0 flex flex-col justify-between z-0">
               {[1, 2, 3, 4, 5].map((_, i) => (
                 <div key={i} className="w-full h-px bg-white/5 border-dashed border-t border-white/5"></div>
               ))}
             </div>

             {/* Mocked Chart Bars */}
             {["S1", "S2", "S3", "S4"].map((week, i) => {
               // Pseudo-random data for mockup
               const vals = [
                 { in: 60, out: 40 },
                 { in: 80, out: 50 },
                 { in: 75, out: 45 },
                 { in: 95, out: 60 },
               ];
               const val = vals[i];
               
               return (
                 <div key={i} className="flex-1 flex flex-col items-center justify-end h-full z-10 group relative pb-6">
                    {/* Tooltip */}
                    <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-black/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-lg text-[10px] whitespace-nowrap z-20 shadow-xl pointer-events-none">
                       <span className="text-emerald-400 font-bold block">In: {val.in}k$</span>
                       <span className="text-pink-400 font-bold block">Out: {val.out}k$</span>
                    </div>

                    <div className="flex items-end gap-1 w-full justify-center max-w-[40px]">
                      {/* Expenses Bar (Pink) */}
                      <div 
                        className="w-1/2 bg-gradient-to-t from-pink-600 to-pink-400 rounded-t-sm shadow-[0_0_15px_rgba(255,0,122,0.3)] transition-all group-hover:opacity-100 opacity-90"
                        style={{ height: `${val.out}%` }}
                      ></div>
                      {/* Revenue Bar (Cyan) */}
                      <div 
                        className="w-1/2 bg-gradient-to-t from-[#00E5FF] to-cyan-300 rounded-t-sm shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all group-hover:opacity-100 opacity-90"
                        style={{ height: `${val.in}%` }}
                      ></div>
                    </div>
                    
                    <span className="absolute bottom-0 text-xs font-plex-mono text-muted-foreground opacity-60 uppercase">{week}</span>
                 </div>
               )
             })}
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-8">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.8)]"></div>
               <span className="text-xs font-outfit text-muted-foreground text-white/80">Flux Entrants (Revenus)</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(255,0,122,0.8)]"></div>
               <span className="text-xs font-outfit text-muted-foreground text-white/80">Flux Sortants (Coûts)</span>
             </div>
          </div>
        </section>

        {/* Breakdown Panel */}
        <section className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-6 relative flex flex-col">
          <h3 className="text-lg font-outfit font-medium text-foreground mb-6">Répartition Dépenses</h3>
          
          <div className="flex-1 flex flex-col justify-center">
            {/* Donut Chart Mockup */}
            <div className="relative w-40 h-40 mx-auto mb-8">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                
                {/* Labor (Blue) - ~45% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="138" className="drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
                
                {/* COGS (Pink) - ~35% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ec4899" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="163" style={{ transformOrigin: '50% 50%', transform: 'rotate(162deg)' }} className="drop-shadow-[0_0_4px_rgba(236,72,153,0.5)]" />
                
                {/* Energy (Amber) - ~10% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#fbbf24" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="226" style={{ transformOrigin: '50% 50%', transform: 'rotate(288deg)' }} className="drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" />
                
                {/* Other (Slate) - ~10% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#64748b" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="226" style={{ transformOrigin: '50% 50%', transform: 'rotate(324deg)' }} />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-2xl font-jakarta font-bold text-white drop-shadow-md">33.5k</span>
                 <span className="text-[9px] font-plex-mono text-muted-foreground uppercase">Sorties</span>
              </div>
            </div>

            <div className="space-y-4">
               {[
                 { label: "Main d'œuvre", value: "45%", color: "bg-blue-500", shadow: "shadow-[0_0_8px_rgba(59,130,246,0.6)]" },
                 { label: "Coût Matière", value: "35%", color: "bg-pink-500", shadow: "shadow-[0_0_8px_rgba(236,72,153,0.6)]" },
                 { label: "Énergies & Eau", value: "10%", color: "bg-amber-400", shadow: "shadow-[0_0_8px_rgba(251,191,36,0.6)]" },
                 { label: "Autres Charges", value: "10%", color: "bg-slate-500", shadow: "" },
               ].map((item, i) => (
                 <div key={i} className="flex justify-between items-center text-sm font-outfit">
                   <div className="flex items-center gap-2">
                     <div className={`w-3 h-3 rounded-full ${item.color} ${item.shadow}`}></div>
                     <span className="text-foreground/80">{item.label}</span>
                   </div>
                   <span className="font-bold text-white/90">{item.value}</span>
                 </div>
               ))}
            </div>
          </div>
          
        </section>
      </div>

    </div>
  );
}
