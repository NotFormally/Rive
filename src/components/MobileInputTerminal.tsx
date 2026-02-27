"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { Flame, Wrench, UtensilsCrossed, MessageSquare, Mic, Send, CheckCircle2, Eye, Clock } from "lucide-react";

type MessageStatus = "unseen" | "seen" | "resolved";

type TimelineMessage = {
  id: string;
  category: string;
  originalText: string;
  translatedText?: string;
  status: MessageStatus;
  time: string;
  author: string;
  reply?: string;
};

const MOCK_MESSAGES: TimelineMessage[] = [
  {
    id: "m1",
    category: "urgent",
    originalText: "The walk-in cooler in the basement is leaking water everywhere.",
    translatedText: "La chambre froide au sous-sol fuit de l'eau partout.",
    status: "resolved",
    time: "08:15 AM",
    author: "Alex (Prep)",
    reply: "Plumber arrived at 10 AM. Fixed."
  },
  {
    id: "m2",
    category: "kitchen",
    originalText: "Falta salmón para mañana por la noche.",
    translatedText: "Il manque du saumon pour demain soir.",
    status: "seen",
    time: "14:30 PM",
    author: "Carlos (Line Cook)"
  },
  {
    id: "m3",
    category: "equipment",
    originalText: "Blender #2 is making a weird grinding noise.",
    translatedText: "Le mixeur #2 fait un bruit de grincement bizarre.",
    status: "unseen",
    time: "16:45 PM",
    author: "Sarah (Bar)"
  }
];

export function MobileInputTerminal() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [inputLang, setInputLang] = useState<"EN" | "ES" | "FR">("EN");
  const [messages, setMessages] = useState<TimelineMessage[]>(MOCK_MESSAGES);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Entrance animations for the feed
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".message-card", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out"
      });
    }, feedRef);
    return () => ctx.revert();
  }, [messages.length]);

  const handleSubmit = () => {
    if (!activeCategory || !inputText.trim()) return;

    // Simulate submission and AI translation bounce
    const newMessage: TimelineMessage = {
      id: `m${Date.now()}`,
      category: activeCategory,
      originalText: inputText,
      // Mocking auto-translation for the demo
      translatedText: inputLang === "FR" ? undefined : 
                      inputLang === "ES" ? "[Traduit de l'espagnol]: " + inputText : 
                      "[Traduit de l'anglais]: " + inputText,
      status: "unseen",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: "Vous"
    };

    setMessages([newMessage, ...messages]);
    setInputText("");
    setActiveCategory(null);
  };

  const getCategoryTheme = (cat: string, isActive: boolean) => {
    switch (cat) {
      case "urgent":
        return isActive 
          ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] border-red-500 scale-95" 
          : "bg-card text-foreground border-border hover:border-red-500 hover:text-red-500 hover:bg-red-500/5";
      case "equipment":
        return isActive 
          ? "bg-[#CC5833] text-white shadow-[0_0_20px_rgba(204,88,51,0.4)] border-[#CC5833] scale-95" 
          : "bg-card text-foreground border-border hover:border-[#CC5833] hover:text-[#CC5833] hover:bg-[#CC5833]/5";
      case "kitchen":
        return isActive 
          ? "bg-[#2E4036] text-white shadow-[0_0_20px_rgba(46,64,54,0.4)] border-[#2E4036] scale-95" 
          : "bg-card text-foreground border-border hover:border-[#2E4036] hover:text-[#2E4036] hover:bg-[#2E4036]/5";
      case "general":
      default:
        return isActive 
          ? "bg-slate-700 text-white shadow-[0_0_20px_rgba(51,65,85,0.4)] border-slate-700 scale-95" 
          : "bg-card text-foreground border-border hover:border-slate-500 hover:text-slate-500 hover:bg-slate-500/5";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto md:max-w-md bg-card rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/10 border border-border/50 flex flex-col h-[650px] md:h-[800px] font-sans">
      
      {/* HEADER: Language Toggle */}
      <div className="bg-[#2E4036] text-[#F2F0E9] p-5 md:p-6 pb-6 md:pb-8 rounded-b-3xl md:rounded-b-[2rem] relative z-10 shadow-lg">
        <div className="flex justify-between items-center mb-5 md:mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#CC5833] rounded-full flex items-center justify-center font-jakarta font-bold text-lg shadow-inner">
               EM
             </div>
             <div>
               <p className="font-jakarta font-bold leading-tight text-sm md:text-base">Terminal Staff</p>
               <p className="font-plex-mono text-[9px] md:text-[10px] text-[#F2F0E9]/60 uppercase tracking-widest">Connecté</p>
             </div>
          </div>
          
          <div className="flex bg-black/20 rounded-full p-1 border border-white/10 backdrop-blur-md">
            {(["EN", "ES", "FR"] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setInputLang(lang)}
                className={`px-3 py-1 font-plex-mono text-xs font-bold rounded-full transition-colors duration-300 ${
                  inputLang === lang ? 'bg-[#CC5833] text-white shadow-md' : 'text-white/50 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* MASSIVE BUTTONS: Zero Friction Categorization */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <button 
            onClick={() => setActiveCategory('urgent')}
            className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl md:rounded-3xl border-2 transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] active:scale-95 ${getCategoryTheme('urgent', activeCategory === 'urgent')}`}
          >
            <Flame className="w-8 h-8 mb-2" />
            <span className="font-jakarta font-bold text-sm tracking-wide">URGENT</span>
          </button>
          
          <button 
            onClick={() => setActiveCategory('equipment')}
            className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl md:rounded-3xl border-2 transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] active:scale-95 ${getCategoryTheme('equipment', activeCategory === 'equipment')}`}
          >
            <Wrench className="w-8 h-8 mb-2" />
            <span className="font-jakarta font-bold text-sm tracking-wide">ÉQUIPEMENT</span>
          </button>
          
          <button 
            onClick={() => setActiveCategory('kitchen')}
            className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl md:rounded-3xl border-2 transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] active:scale-95 ${getCategoryTheme('kitchen', activeCategory === 'kitchen')}`}
          >
            <UtensilsCrossed className="w-8 h-8 mb-2" />
            <span className="font-jakarta font-bold text-sm tracking-wide">CUISINE</span>
          </button>
          
          <button 
            onClick={() => setActiveCategory('general')}
            className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl md:rounded-3xl border-2 transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] active:scale-95 ${getCategoryTheme('general', activeCategory === 'general')}`}
          >
            <MessageSquare className="w-8 h-8 mb-2" />
            <span className="font-jakarta font-bold text-sm tracking-wide">GÉNÉRAL</span>
          </button>
        </div>
      </div>

      {/* TEXT / VOICE INPUT */}
      <div className="p-4 md:p-6 bg-background relative z-0 -mt-4 pt-8 md:pt-10">
        <div className="relative">
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              inputLang === "ES" ? "Toca para escribir o dictar..." :
              inputLang === "EN" ? "Tap to type or dictate..." :
              "Tapez ou dictez un message..."
            }
            className="w-full bg-card border-none rounded-2xl md:rounded-3xl p-4 md:p-5 pr-14 min-h-[100px] md:min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-[#CC5833]/50 shadow-inner text-foreground font-outfit text-base md:text-lg leading-relaxed placeholder:text-muted-foreground/50"
          ></textarea>
          
          {/* Mock Voice Dictation */}
          <button 
            onClick={() => setIsRecording(!isRecording)}
            className={`absolute bottom-4 right-4 p-3 rounded-full transition-all duration-300 ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                : 'bg-muted text-muted-foreground hover:bg-[#CC5833]/10 hover:text-[#CC5833]'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        {/* MAGNETIC SUBMIT */}
        <button
          onClick={handleSubmit}
          disabled={!activeCategory || !inputText.trim()}
          className="mt-3 md:mt-4 w-full flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4 rounded-full font-bold text-xs md:text-sm tracking-wider transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] disabled:opacity-40 disabled:bg-muted disabled:text-muted-foreground bg-[#1A1A1A] text-[#F2F0E9] hover:bg-[#CC5833] hover:shadow-lg hover:shadow-[#CC5833]/30 active:scale-95 cursor-pointer touch-manipulation"
        >
          <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
          ENVOYER AU BUREAU
        </button>
      </div>

      {/* FEED (ACTION TAKEN LOOP) */}
      <div className="flex-1 bg-muted/30 p-4 md:p-6 overflow-y-auto border-t border-border/50" ref={feedRef}>
        <h3 className="font-plex-mono text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
          <Clock className="w-3 h-3" />
          Historique (Aujourd'hui)
        </h3>
        
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className="message-card bg-card border border-border p-5 rounded-[1.5rem] shadow-sm relative overflow-hidden">
               {/* Side Category Indicator */}
               <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                 msg.category === "urgent" ? "bg-red-500" :
                 msg.category === "equipment" ? "bg-[#CC5833]" :
                 msg.category === "kitchen" ? "bg-[#2E4036]" : "bg-slate-400"
               }`}></div>

               <div className="flex justify-between items-start mb-2 pl-2">
                 <span className="font-jakarta font-bold text-sm">{msg.author}</span>
                 <span className="font-plex-mono text-[10px] text-muted-foreground">{msg.time}</span>
               </div>
               
               <p className="font-outfit text-foreground/90 text-sm leading-relaxed mb-1 pl-2">{msg.originalText}</p>
               
               {/* Translation Bridge */}
               {msg.translatedText && (
                 <p className="font-outfit text-[11px] text-muted-foreground italic pl-2 border-l-2 border-border ml-2 mb-3">
                   {msg.translatedText}
                 </p>
               )}

               {/* Closing the Loop Indicators */}
               <div className="mt-4 pt-3 border-t border-border flex flex-col gap-2 pl-2">
                 {msg.status === "unseen" && (
                   <div className="flex items-center gap-2 text-slate-500 text-xs font-bold font-jakarta">
                     <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                     Envoyé (Non lu)
                   </div>
                 )}
                 
                 {msg.status === "seen" && (
                   <div className="flex items-center gap-2 text-amber-600 bg-amber-50 w-fit px-3 py-1.5 rounded-lg text-[11px] font-bold font-jakarta border border-amber-100">
                     <Eye className="w-3.5 h-3.5" />
                     Vu par la direction
                   </div>
                 )}
                 
                 {msg.status === "resolved" && (
                   <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-2 text-green-600 bg-green-50 w-fit px-3 py-1.5 rounded-lg text-[11px] font-bold font-jakarta border border-green-100">
                       <CheckCircle2 className="w-3.5 h-3.5" />
                       Action prise
                     </div>
                     {msg.reply && (
                       <div className="bg-muted p-3 rounded-xl rounded-tl-none ml-4 mt-1 border border-border/50">
                         <span className="block font-plex-mono text-[9px] text-[#CC5833] font-bold uppercase mb-1">Dernière note (Direction)</span>
                         <span className="font-outfit text-xs text-foreground/80">{msg.reply}</span>
                       </div>
                     )}
                   </div>
                 )}
               </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
