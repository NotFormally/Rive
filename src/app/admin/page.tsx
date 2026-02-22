"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.role !== 'admin') {
        router.push("/dashboard");
      } else {
        setUser(u);
        fetchAdminData();
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  const fetchAdminData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('sessions')
      .select('*, templates(*), log_entries(*)')
      .eq('date', today);
    if(data) {
        setSessions(data);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/login");
  };


  if (!user) return <div className="p-8 text-center">Chargement...</div>;

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const pendingSessions = sessions.filter(s => s.status !== 'completed');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold">Vue Gérant</h1>
            <p className="text-sm text-slate-400">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-slate-300 hover:text-white hover:bg-slate-800">
            Quitter
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-6 space-y-8">
        
        {/* Résumé des indicateurs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Tâches totales du jour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{sessions.length}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Complétées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completedSessions.length}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">En attente / Retard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{pendingSessions.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Liste détaillée */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center gap-2">
            Status des Checklists
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => {
              const template = session.templates;
              if (!template) return null;
              
              const isCompleted = session.status === 'completed';
              
              return (
                <Card key={session.id} className={`${isCompleted ? 'bg-slate-50/50' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-md">{template.title}</CardTitle>
                        <CardDescription className="text-xs">{template.description}</CardDescription>
                      </div>
                      <Badge variant={isCompleted ? 'default' : 'outline'} className={isCompleted ? 'bg-green-500' : 'text-orange-600 border-orange-200 bg-orange-50'}>
                        {isCompleted ? (
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Terminé</span>
                        ) : (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> À faire</span>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isCompleted ? (
                      <div className="text-sm text-slate-600 mt-2 space-y-1">
                        <p><strong>{session.log_entries?.length || 0}</strong> points vérifiés.</p>
                        {session.log_entries && session.log_entries.length > 0 && (
                            <p className="text-xs text-slate-400">Dernière entrée à {new Date(session.log_entries[0].timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        En attente du personnel
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
