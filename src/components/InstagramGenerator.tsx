"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { hasReachedQuota, FREE_QUOTAS } from "@/lib/quotas";

type InstagramPost = {
  caption_fr: string;
  caption_en: string;
  hashtags: string[];
  cta: string;
  suggested_time: string;
  item: { name: string; description: string; price: number; categoryName: string };
  bcg: string;
};

const BCG_COLORS: Record<string, string> = {
  phare: "from-yellow-400 to-amber-500",
  ancre: "from-blue-400 to-cyan-500",
  derive: "from-purple-400 to-indigo-500",
  ecueil: "from-red-400 to-rose-500",
};

const BCG_ICONS: Record<string, string> = {
  phare: "🏮",
  ancre: "⚓",
  derive: "🧭",
  ecueil: "🪸",
};

export function InstagramGenerator({
  menuItemId,
  menuItemName,
  onClose,
}: {
  menuItemId: string;
  menuItemName: string;
  onClose: () => void;
}) {
  const [post, setPost] = useState<InstagramPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const { profile, subscription, usage, refreshSettings } = useAuth();
  const isTrial = subscription?.tier === 'trial';
  const instaQuotaReached = hasReachedQuota(usage, 'instagram_posts', isTrial);

  const generatePost = async () => {
    if (instaQuotaReached) return;
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPost(data);
        if (profile) {
          await supabase.rpc('increment_usage', { restaurant_uuid: profile.id, metric_name: 'instagram_posts' });
          refreshSettings();
        }
      }
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!post) return;
    const fullText = `${post.caption_fr}\n\n${post.hashtags.join(" ")}\n\n${post.cta}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gradientClass = post ? BCG_COLORS[post.bcg] || "from-slate-400 to-slate-500" : "from-slate-400 to-slate-500";
  const icon = post ? BCG_ICONS[post.bcg] || "📸" : "📸";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">📸 Générateur Instagram</h3>
            <p className="text-xs text-slate-500">{menuItemName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        {/* Content */}
        <div className="p-5">
          {!post && !loading && (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">Rive va générer un post Instagram complet avec caption, hashtags et call-to-action, adapté à la classificationvotre plat.</p>
              
              {instaQuotaReached ? (
                <div className="rounded-md bg-blue-50 dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-800 mb-4">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Quota atteint</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    Vous avez généré vos {FREE_QUOTAS.instagram_posts} posts gratuits. Passez au forfait Performance pour des posts illimités.
                  </p>
                </div>
              ) : (
                <>
                  <Button onClick={generatePost} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700">
                    🚀 Générer le post
                  </Button>
                  {isTrial && <p className="text-xs text-slate-500 mt-3">{usage?.instagram_posts || 0} / {FREE_QUOTAS.instagram_posts} posts générés</p>}
                </>
              )}
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm text-slate-500">L&apos;IA compose votre post...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm mb-3">{error}</p>
              <Button variant="outline" onClick={generatePost}>Réessayer</Button>
            </div>
          )}

          {post && (
            <div className="space-y-5">
              {/* Instagram Preview Card */}
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                {/* Visual Header */}
                <div className={`bg-gradient-to-br ${gradientClass} p-8 text-center text-white`}>
                  <span className="text-5xl block mb-3">{icon}</span>
                  <h4 className="text-2xl font-bold tracking-tight">{post.item.name}</h4>
                  <p className="text-white/80 text-sm mt-1">{post.item.categoryName} • {post.item.price}$</p>
                </div>
                {/* Caption */}
                <div className="p-4 bg-white">
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{post.caption_fr}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {post.hashtags.map((tag, i) => (
                      <span key={i} className="text-xs text-blue-600 font-medium">{tag}</span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-600">{post.cta}</p>
                </div>
              </div>

              {/* English Version */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">🇬🇧 Version anglaise</p>
                <p className="text-sm text-slate-700">{post.caption_en}</p>
              </div>

              {/* Suggested Time */}
              <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3">
                <span className="text-xs text-blue-700 font-medium">⏰ Meilleur moment pour poster :</span>
                <span className="text-xs text-blue-800 font-bold">{post.suggested_time}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={copyToClipboard} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  {copied ? "✅ Copié !" : "📋 Copier le texte"}
                </Button>
                <Button variant="outline" onClick={generatePost} className="flex-1">
                  🔄 Régénérer
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
