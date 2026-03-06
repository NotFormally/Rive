"use client";

import { useState, useEffect } from "react";
import { Mic, StopCircle, RefreshCw, Send, CheckCircle2, Sparkles, Wand2, Volume2, History, ChefHat, FileText, Settings, AlertTriangle } from "lucide-react";
import { useAudioRecorder } from "react-use-audio-recorder";

type RecordState = "idle" | "listening" | "processing" | "success" | "error";

interface ExtractedItem {
  name: string;
  quantity: string | number;
  unit: string | null;
  isCCP?: boolean;
}

interface ExtractedRecipe {
  title: string;
  language: string;
  ingredients: ExtractedItem[];
  steps: string[];
}

export function VoicePrepTerminal() {
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [transcript, setTranscript] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedRecipe | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    startRecording,
    stopRecording,
    recordingStatus,
    recordingTime,
  } = useAudioRecorder();

  const handleStartRecording = () => {
    setRecordState("listening");
    setTranscript("");
    setExtractedData(null);
    setErrorMessage("");
    startRecording();
  };

  const handleStopRecording = async () => {
    setRecordState("processing");

    // The react-use-audio-recorder v1 hook allows us to pass a callback to stopRecording
    // which gives us the final Blob directly.
    stopRecording(async (blob) => {
      if (!blob) {
        setErrorMessage("Erreur système: Fichier audio introuvable.");
        setRecordState("error");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", blob, "dictation.webm");

        // Step 1: Transcription via Whisper
        setTranscript("Envoi de l'audio à Whisper...");
        const responseWhisper = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!responseWhisper.ok) {
          const err = await responseWhisper.json();
          throw new Error(err.error || "Erreur lors de la transcription");
        }

        const transData = await responseWhisper.json();
        setTranscript(transData.text);

        // Step 2: Extraction Sémantique via Claude
        const responseClaude = await fetch("/api/extract-recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcription: transData.text })
        });

        if (!responseClaude.ok) {
          const err = await responseClaude.json();
          throw new Error(err.error || "Erreur lors de l'extraction IA");
        }

        const recipeData = await responseClaude.json();
        setExtractedData(recipeData);
        setRecordState("success");

      } catch (error: any) {
        console.error("Pipeline failure:", error);
        setErrorMessage(error.message);
        setRecordState("error");
      }
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Mic className="w-5 h-5 text-orange-400" />
            </div>
            <h1 className="text-3xl font-outfit font-bold text-white tracking-tight">Dictée Vocale IA</h1>
          </div>
          <p className="text-slate-400 font-jakarta max-w-xl">
            Dictez vos recettes ou votre liste de prep. L'IA RiveHub (Whisper + Claude 3.5 Sonnet) 
            transcrit votre voix et extrait les ingrédients, quantités et points critiques (CCP).
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm font-semibold transition-colors bg-white/5 text-slate-300 hover:text-white hover:bg-white/10">
            <History className="w-4 h-4" /> Historique
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm font-semibold transition-colors bg-white/5 text-slate-300 hover:text-white hover:bg-white/10">
            <Settings className="w-4 h-4" /> Config
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input / Recording Panel */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
          
          {/* Audio Wave Animation Background when listening */}
          {recordState === "listening" && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <div className="w-64 h-64 bg-orange-500 rounded-full blur-[100px] animate-pulse"></div>
            </div>
          )}

          <div className="text-center z-10 space-y-8 w-full max-w-md">
            
            {/* Status Text */}
            <div className="space-y-2">
              <h2 className="text-2xl font-outfit font-bold text-white">
                {recordState === "idle" && "Prêt à dicter"}
                {recordState === "listening" && "Écoute en cours..."}
                {recordState === "processing" && "Analyse IA RiveHub..."}
                {recordState === "success" && "Fiche Technique Générée"}
                {recordState === "error" && "Erreur du Pipeline"}
              </h2>
              <p className="font-plex-mono text-sm text-slate-400">
                {recordState === "listening" ? formatTime(recordingTime) : 
                 recordState === "processing" ? "Reconnaissance vocale & Extraction" : 
                 recordState === "success" ? "Pipeline terminé." :
                 recordState === "error" ? "Consultez le terminal" :
                 "Cliquer pour enregistrer"}
              </p>
            </div>

            {/* Error Message Display */}
            {recordState === "error" && (
               <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-400 text-sm font-jakarta flex items-center gap-3">
                 <AlertTriangle className="w-5 h-5 shrink-0" />
                 <p className="text-left">{errorMessage}</p>
               </div>
            )}

            {/* Huge Mic Button */}
            <button 
              onClick={recordState === "listening" ? handleStopRecording : handleStartRecording}
              disabled={recordState === "processing"}
              className={`relative mx-auto w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
                recordState === "idle" || recordState === "error" ? "bg-orange-500 hover:bg-orange-400 hover:scale-105 shadow-[0_0_30px_rgba(249,115,22,0.3)]" :
                recordState === "listening" ? "bg-red-500 animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.6)]" :
                recordState === "processing" ? "bg-indigo-500 opacity-80" :
                "bg-emerald-500 hover:bg-emerald-400 hover:scale-105 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              }`}
            >
              {(recordState === "idle" || recordState === "error") && <Mic className="w-12 h-12 text-white" />}
              {recordState === "listening" && <StopCircle className="w-12 h-12 text-white" />}
              {recordState === "processing" && <RefreshCw className="w-12 h-12 text-white animate-spin" />}
              {recordState === "success" && <RefreshCw className="w-12 h-12 text-white" />}
              
              {recordState === "processing" && (
                <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-indigo-300 animate-ping" />
              )}
            </button>

            {/* Live Transcript Box */}
            <div className={`w-full p-4 rounded-2xl bg-black/40 border border-white/5 transition-opacity duration-500 min-h-[120px] text-left ${recordState === "idle" ? "opacity-30" : "opacity-100"}`}>
              <p className="font-outfit text-slate-300 gap-2 text-lg leading-relaxed h-full break-words">
                {recordState === "listening" && <span className="inline-flex w-2.5 h-5 mr-2 bg-orange-400 animate-pulse"></span>}
                {transcript || (recordState === "idle" ? "La transcription vocale apparaîtra ici après l'enregistrement..." : "")}
              </p>
            </div>

          </div>
        </div>

        {/* Output Sémantique Panel */}
        <div className={`transition-all duration-1000 ${recordState === "success" && extractedData ? "opacity-100 translate-y-0" : "opacity-50 translate-y-4 pointer-events-none filter blur-[2px]"}`}>
          <div className="bg-[#1e1b4b]/40 backdrop-blur-sm border border-indigo-500/30 rounded-[2rem] p-8 h-full flex flex-col relative overflow-hidden">
            
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Wand2 className="w-32 h-32 text-indigo-400" />
            </div>

            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-outfit">{extractedData?.title || "Squelette Restructuré"}</h3>
                <p className="text-xs text-indigo-300 font-plex-mono uppercase tracking-widest mt-1">JSON Sémantique ({extractedData?.language})</p>
              </div>
            </div>

            {recordState === "success" && extractedData ? (
              <div className="space-y-6 relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Ingredients */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Ingrédients & Quantités</h4>
                  <div className="space-y-2">
                    {extractedData.ingredients.map((item, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border ${item.isCCP ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            {item.isCCP ? <ChefHat className="w-5 h-5 text-amber-400" /> : <div className="w-2 h-2 rounded-full bg-indigo-400 ml-1.5" />}
                            <span className={`font-semibold ${item.isCCP ? 'text-amber-200' : 'text-slate-200'}`}>{item.name}</span>
                          </div>
                          {item.isCCP && <span className="text-[10px] inline-block font-bold bg-amber-500 text-amber-950 px-2 py-0.5 mt-1 rounded-sm w-fit">POINT CRITIQUE (CCP)</span>}
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <span className="font-plex-mono font-bold text-lg text-white">{item.quantity}</span>
                          {item.unit && <span className="text-slate-400 text-sm ml-1">{item.unit === 'null' ? '' : item.unit}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Steps */}
                {extractedData.steps && extractedData.steps.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Étapes de Préparation</h4>
                    <div className="space-y-2">
                      {extractedData.steps.map((step, idx) => (
                        <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-xl text-slate-300 text-sm font-jakarta leading-relaxed">
                          <span className="text-indigo-400 font-bold mr-2">{idx + 1}.</span> {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-indigo-500/20 mt-auto sticky bottom-0 bg-[#1e1b4b]">
                   <button className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all">
                     <CheckCircle2 className="w-5 h-5" />
                     Enregistrer la Fiche Technique
                   </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <Volume2 className="w-12 h-12 text-indigo-300 mb-4" />
                <p className="text-indigo-200 font-jakarta max-w-xs">En attente de la dictée pour extraire la structure de la recette...</p>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}
