"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TaskItem } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { hasReachedQuota, FREEMIUM_QUOTAS } from "@/lib/quotas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Sparkles, Loader2 } from "lucide-react";

export default function ChecklistExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [entries, setEntries] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // AI Suggestions State
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string[]>>({});
  const [isAiLoading, setIsAiLoading] = useState<Record<string, boolean>>({});
  const [correctiveActions, setCorrectiveActions] = useState<Record<string, string>>({});

  const { profile, subscription, usage, refreshSettings } = useAuth();
  const isFreemium = subscription?.tier === 'freemium';
  const caQuotaReached = hasReachedQuota(usage, 'corrective_actions', isFreemium);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSessionData();
  }, [unwrappedParams.id]);

  const fetchSessionData = async () => {
    // 1. Fetch Session and Template details + tasks
    const { data: sData } = await supabase
      .from('sessions')
      .select('*, templates(*, tasks(*))')
      .eq('id', unwrappedParams.id)
      .single();

    if (sData) {
      setSession(sData);
      setTemplate(sData.templates);
      
      // 2. Load existing entries if any
      const { data: entriesData } = await supabase
        .from('log_entries')
        .select('*')
        .eq('session_id', sData.id);

      if (entriesData) {
        const initialEntries: Record<string, any> = {};
        entriesData.forEach(e => {
          // For boolean, convert string to boolean. For text, keep text.
          initialEntries[e.task_id] = e.value === 'true' ? true : e.value === 'false' ? false : e.value;
        });
        setEntries(initialEntries);
      }
    }
  };

  const handleChange = (taskId: string, value: any, type: string, task: TaskItem) => {
    setEntries(prev => ({ ...prev, [taskId]: value }));
    
    // Validation for temperatures
    if (type === 'temperature') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && task.max_temp !== undefined && task.max_temp !== null && numValue > task.max_temp) {
        setErrors(prev => ({ ...prev, [taskId]: `Doit être ≤ ${task.max_temp}°C` }));
        
        // Auto-fetch AI Suggestions if not existing
        if (!aiSuggestions[taskId] && !isAiLoading[taskId] && !caQuotaReached) {
            fetchAiSuggestions(taskId, task.description, value);
        }
      } else {
        const newErrors = { ...errors };
        delete newErrors[taskId];
        setErrors(newErrors);
      }
    }
  };

  const fetchAiSuggestions = async (taskId: string, desc: string, temp: string) => {
    setIsAiLoading(prev => ({ ...prev, [taskId]: true }));
    try {
      const res = await fetch('/api/corrective-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskDescription: desc, temperature: temp })
      });
      const data = await res.json();
      if (data.options) {
        setAiSuggestions(prev => ({ ...prev, [taskId]: data.options }));
        if (profile) {
          await supabase.rpc('increment_usage', { restaurant_uuid: profile.id, metric_name: 'corrective_actions' });
          refreshSettings();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const selectCorrectiveAction = (taskId: string, action: string) => {
      setCorrectiveActions(prev => ({...prev, [taskId]: action}));
  };

  const isFormValid = () => {
    if (!template) return false;
    for (const task of template.tasks) {
      const val = entries[task.id];
      if (task.required) {
        if (task.type === 'boolean' && val !== true) return false;
        if (task.type === 'temperature' && (val === undefined || val === '' || errors[task.id])) return false;
        if (task.type === 'text' && (val === undefined || val.trim() === '')) return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (isFormValid() && session) {
      setIsSubmitting(true);
      
      const userStr = localStorage.getItem("currentUser");
      const userId = userStr ? JSON.parse(userStr).id : null;

      // 1. Update session
      await supabase
        .from('sessions')
        .update({ status: 'completed', completed_by: userId })
        .eq('id', session.id);
      
      // 2. Insert log entries
      const logsToInsert = Object.keys(entries).map(taskId => {
        const baseVal = entries[taskId];
        // Append corrective action to value if exists
        const safeValue = correctiveActions[taskId] ? `${baseVal} (Action IA: ${correctiveActions[taskId]})` : String(baseVal);
        return {
          session_id: session.id,
          task_id: taskId,
          value: safeValue
        }
      });

      // Nettoyer les anciens logs si on réécrit
      await supabase.from('log_entries').delete().eq('session_id', session.id);

      await supabase
        .from('log_entries')
        .insert(logsToInsert);

      router.push('/dashboard');
    }
  };

  if (!session || !template) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
          ← Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-tight">{template.title}</h1>
          <p className="text-xs text-slate-500">{template.tasks?.length} tâches</p>
        </div>
        {session.status === 'completed' && <Badge className="bg-green-500">Terminé</Badge>}
      </header>

      <main className="max-w-md mx-auto p-4 mt-2 space-y-6">
        {template.tasks?.map((task: TaskItem) => (
          <Card key={task.id} className={`overflow-hidden transition-colors ${entries[task.id] && !errors[task.id] ? 'bg-blue-50/30 border-blue-100' : ''}`}>
            <CardContent className="p-5 flex items-start gap-4">
              
              {task.type === 'boolean' && (
                <>
                  <div className="pt-1">
                    <Checkbox 
                      id={task.id} 
                      checked={entries[task.id] === true || entries[task.id] === 'true'}
                      onCheckedChange={(checked) => handleChange(task.id, checked, 'boolean', task)}
                      className="w-6 h-6 border-2 data-[state=checked]:bg-blue-600"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={task.id} className="text-base font-medium cursor-pointer leading-snug">
                      {task.description}
                    </Label>
                    {task.required && <p className="text-xs text-red-500 mt-1">* Requis</p>}
                  </div>
                </>
              )}

              {task.type === 'temperature' && (
                <div className="flex-1 space-y-3">
                  <Label htmlFor={task.id} className="text-base font-medium">
                    {task.description}
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      id={task.id}
                      type="number"
                      step="0.1"
                      placeholder="Ex: 3.5"
                      className="text-lg h-12 w-32 font-mono"
                      value={entries[task.id] || ''}
                      onChange={(e) => handleChange(task.id, e.target.value, 'temperature', task)}
                    />
                    <span className="text-slate-500 text-lg">°C</span>
                  </div>
                  {errors[task.id] && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-md text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors[task.id]}</span>
                      </div>
                      
                      {/* AI Assistant UI */}
                      <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                        <div className="flex items-center gap-2 mb-3 text-indigo-700">
                          <Sparkles className="h-4 w-4" />
                          <span className="text-sm font-semibold">Assistant Qualité</span>
                        </div>
                        
                        {isAiLoading[task.id] ? (
                            <div className="flex items-center gap-2 text-indigo-500 text-sm py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>L'IA génère les actions correctives...</span>
                            </div>
                        ) : aiSuggestions[task.id] ? (
                            <div className="space-y-2">
                                <p className="text-xs text-indigo-900/70 mb-2">Sélectionnez l'action entreprise :</p>
                                {aiSuggestions[task.id].map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => selectCorrectiveAction(task.id, action)}
                                        className={`w-full text-left text-sm p-3 rounded-lg transition-colors border ${correctiveActions[task.id] === action ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-indigo-100 hover:border-indigo-300'}`}
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        ) : caQuotaReached ? (
                            <div className="flex flex-col gap-2 p-2 bg-white/50 rounded-lg">
                                <p className="text-sm font-medium text-slate-700">Quota d'actions correctives IA atteint</p>
                                <p className="text-xs text-slate-500">Vous avez atteint votre limite de {FREEMIUM_QUOTAS.corrective_actions} suggestions gratuites.</p>
                            </div>
                        ) : null}
                      </div>

                    </div>
                  )}
                  {entries[task.id] && !errors[task.id] && task.required && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-md text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Température conforme</span>
                    </div>
                  )}
                </div>
              )}

              {task.type === 'text' && (
                <div className="flex-1 space-y-3">
                  <Label htmlFor={task.id} className="text-base font-medium">
                    {task.description}
                  </Label>
                  <Input 
                    id={task.id}
                    placeholder="Notes..."
                    className="h-12"
                    value={entries[task.id] || ''}
                    onChange={(e) => handleChange(task.id, e.target.value, 'text', task)}
                  />
                  {task.required && <p className="text-xs text-red-500 mt-1">* Requis</p>}
                </div>
              )}

            </CardContent>
          </Card>
        ))}
        
        <div className="pt-6 pb-4">
          <Button 
            className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500"
            disabled={!isFormValid() || session.status === 'completed' || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Sauvegarde...' : session.status === 'completed' ? 'Déjà Soumis' : 'Soumettre le rapport'}
          </Button>
        </div>
      </main>
    </div>
  );
}
