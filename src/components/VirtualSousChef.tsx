"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Sparkles, ChefHat } from "lucide-react";

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function VirtualSousChef() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour Chef. Comment puis-je vous aider avec le service d\'aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error('Erreur API Assistant');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Désolé Chef, je n\'arrive pas à me connecter aux serveurs pour l\'instant.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 group"
        >
          <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
          <span className="font-semibold text-sm mr-1 hidden sm:block">Sous-Chef IA</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3 text-white">
              <div className="bg-white/20 p-2 rounded-full">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Virtual Sous-Chef</h3>
                <p className="text-xs text-indigo-100/80">Support Opérationnel Rive</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-slate-900 text-white rounded-tr-sm' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                  }`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {/* Suggested Prompts (only show if few messages) */}
            {messages.length === 1 && !isLoading && (
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-200/60">
                <p className="text-xs font-semibold text-slate-500 px-1 uppercase tracking-wider">Demandes rapides</p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setInput("Fais-moi un récapitulatif des alertes Food Cost en cours.")}
                    className="text-left bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 text-xs p-2.5 rounded-xl transition-colors shadow-sm"
                  >
                    <span className="text-indigo-600 mr-2">💰</span> Analyse mon Food Cost du jour
                  </button>
                  <button 
                    onClick={() => setInput("Fais un point sur les quantités générées par l'IA pour la Prep List d'aujourd'hui.")}
                    className="text-left bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 text-xs p-2.5 rounded-xl transition-colors shadow-sm"
                  >
                    <span className="text-indigo-600 mr-2">📋</span> Vérifier ma Prep List et les suggestions
                  </button>
                  <button 
                    onClick={() => setInput("Quel a été le chiffre d'affaires des derniers jours et quelle est la tendance ?")}
                    className="text-left bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 text-xs p-2.5 rounded-xl transition-colors shadow-sm"
                  >
                    <span className="text-indigo-600 mr-2">📈</span> Résume mes récentes ventes
                  </button>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 rounded-tl-sm shadow-sm flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question sur le service..."
              className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 text-sm px-4 py-2.5 rounded-full outline-none transition-all shadow-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
