"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary Caught:", error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-[#F2F0E9] flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Une erreur critique est survenue (Root Layout)
          </h2>
          <div className="bg-red-50 text-red-800 p-4 rounded-lg text-left text-sm font-mono overflow-auto mb-6 max-h-64">
            <strong>Erreur :</strong> {error.message}
            <br /><br />
            <strong>Stack :</strong>
            <pre className="mt-2 text-xs opacity-80 whitespace-pre-wrap">{error.stack}</pre>
          </div>
          <button
            onClick={() => {
              try {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              } catch (e) {}
            }}
            className="bg-[#2E4036] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#1f2d25] transition-colors"
          >
            Effacer le cache distant et recharger
          </button>
        </div>
      </body>
    </html>
  );
}
