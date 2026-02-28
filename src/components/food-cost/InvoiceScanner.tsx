"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export function InvoiceScanner({ onScanComplete }: { onScanComplete?: () => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [status, setStatus] = useState<'idle' | 'compressing' | 'uploading' | 'analyzing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compression helper
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 1600px
          const MAX_DIM = 1600;
          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // JPEG format, 0.7 quality to stay under 4MB limit
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
       setErrorMessage("Format non supporté. Veuillez uploader une image ou un PDF court.");
       setStatus('error');
       return;
    }
    setFile(selectedFile);
    setStatus('idle');
    setErrorMessage("");
    setScanResult(null);

    if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
    } else {
        setPreviewUrl(null); // It's a PDF
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    try {
      setStatus('compressing');
      
      let base64Data = "";
      
      // If it's an image, we compress it on the client
      if (file.type.startsWith('image/')) {
         base64Data = await compressImage(file);
      } else {
         // PDF Handling: for now we just convert to base64 directly
         // Note: robust implementations would use pdf.js to render first page to canvas, but we'll try direct
         setStatus('uploading');
         const reader = new FileReader();
         base64Data = await new Promise((resolve) => {
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
         });
      }

      setStatus('analyzing');
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du scan (Le fichier est peut-être trop lourd)');
      }

      const result = await response.json();
      setScanResult(result);
      setStatus('success');
      
      if (onScanComplete) onScanComplete();
      
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'Une erreur est survenue lors de l\'analyse.');
    }
  };

  const clearSelection = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStatus('idle');
    setScanResult(null);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          <FileText className="w-5 h-5 text-indigo-500" />
          Nouveau Scan de Facture
        </h2>
        <p className="text-sm text-zinc-500 mt-1">Glissez une photo de facture. L'IA mettra automatiquement à jour les prix de vos ingrédients.</p>
      </div>

      <div className="p-6">
        {!file ? (
          // Upload Zone
          <div 
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
              ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Cliquez ou Glissez un fichier ici</h3>
            <p className="text-sm text-zinc-500">Formats supportés : JPEG, PNG, WEBP, PDF.</p>
            <p className="text-xs text-zinc-400 mt-4">Astuce : Si vous êtes sur mobile, vous pouvez prendre une photo directement.</p>
            
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*,application/pdf" 
              className="hidden" 
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            />
          </div>
        ) : (
          // Preview & Analysis Zone
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Image/File Preview */}
            <div className="w-full md:w-1/2 relative group">
              <button 
                onClick={clearSelection}
                disabled={status === 'analyzing' || status === 'compressing'}
                className="absolute top-2 right-2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors disabled:opacity-0"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="aspect-[3/4] rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Facture" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-zinc-400">
                    <FileText className="w-12 h-12 mb-2" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions / Results */}
            <div className="w-full md:w-1/2 flex flex-col justify-center">
              {status === 'idle' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">Prêt pour l'extraction IA</h3>
                    <p className="text-sm text-zinc-500">Nous allons extraire le fournisseur, le total et mapper chaque ligne de produit avec votre inventaire local.</p>
                  </div>
                  <button 
                    onClick={handleAnalyze}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Sparkles className="w-5 h-5" />
                    Lancer la Lecture IA
                  </button>
                </div>
              )}

              {(status === 'compressing' || status === 'uploading' || status === 'analyzing') && (
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {status === 'compressing' ? 'Optimisation de l\'image...' : 
                       status === 'uploading' ? 'Envoi au Cerveau IA...' : 
                       'Déchiffrage du ticket (Claude Vision)...'}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">Veuillez patienter (cela peut prendre jusqu'à 15s)</p>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">{errorMessage}</p>
                  </div>
                  <button 
                    onClick={clearSelection}
                    className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
                  >
                    Essayer un autre fichier
                  </button>
                </div>
              )}

              {status === 'success' && scanResult && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                    <h3 className="font-bold text-lg">Extraction Réussie</h3>
                  </div>
                  
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Fournisseur</p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{scanResult.supplierName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Date</p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{scanResult.date}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Montant Total</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{scanResult.totalAmount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-lg">
                    <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium mb-2">Produits identifiés :</p>
                    <ul className="text-sm space-y-1 text-indigo-700 dark:text-indigo-400 list-disc list-inside">
                      {scanResult.topItems?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                      {(scanResult.items?.length > 3) && (
                        <li className="text-xs mt-1 text-indigo-500 italic">+ {scanResult.items.length - 3} autres articles ignorés/traités en fond</li>
                      )}
                    </ul>
                  </div>
                  
                  <button 
                    onClick={clearSelection}
                    className="w-full mt-2 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
                  >
                    Scanner une autre facture
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
