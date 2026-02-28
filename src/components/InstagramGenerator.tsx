"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { hasReachedQuota, FREE_QUOTAS } from "@/lib/quotas";
import { useTranslations } from "next-intl";

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
  const [connections, setConnections] = useState<any[]>([]);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const t = useTranslations('Instagram');
  const tCommon = useTranslations('Common');

  const { profile, subscription, usage, refreshSettings } = useAuth();
  const isTrial = subscription?.tier === 'trial';
  const instaQuotaReached = hasReachedQuota(usage, 'instagram_posts', isTrial);

  useEffect(() => {
    if (profile) {
      supabase.from('social_connections').select('id, platform, account_name').eq('restaurant_id', profile.id)
        .then(({data}) => setConnections(data || []));
    }
  }, [profile]);

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
      setError(t('error_conn'));
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

  const handlePublish = async (platform: string, connectionId: string) => {
    if (!post) return;
    setPublishing(platform);
    setPublishSuccess(null);
    try {
      const res = await fetch("/api/social/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          platform, 
          connectionId, 
          text: `${post.caption_fr}\n\n${post.hashtags.join(" ")}\n\n${post.cta}`,
          imageUrl: "" // MVP doesn't upload image yet, only text
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishSuccess(platform);
        setTimeout(() => setPublishSuccess(null), 3000);
      } else {
        alert(data.error || t('error_conn'));
      }
    } catch {
      alert(t('error_conn'));
    } finally {
      setPublishing(null);
    }
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
            <h3 className="font-semibold text-slate-900">{t('title')}</h3>
            <p className="text-xs text-slate-500">{menuItemName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        {/* Content */}
        <div className="p-5">
          {!post && !loading && (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">{t('desc')}</p>
              
              {instaQuotaReached ? (
                <div className="rounded-md bg-blue-50 dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-800 mb-4">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">{t('quota_reached')}</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    {t('quota_desc', { count: FREE_QUOTAS.instagram_posts })}
                  </p>
                </div>
              ) : (
                <>
                  <Button onClick={generatePost} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700">
                    {t('btn_generate')}
                  </Button>
                  {isTrial && <p className="text-xs text-slate-500 mt-3">{usage?.instagram_posts || 0} / {FREE_QUOTAS.instagram_posts} {t('btn_regenerate').toLowerCase().includes('pos') ? 'posts' : 'posts'}</p>}
                </>
              )}
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm text-slate-500">{t('btn_loading')}</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm mb-3">{error}</p>
              <Button variant="outline" onClick={generatePost}>{t('btn_retry')}</Button>
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
                <p className="text-xs font-semibold text-slate-500 mb-2">{t('eng_version')}</p>
                <p className="text-sm text-slate-700">{post.caption_en}</p>
              </div>

              {/* Suggested Time */}
              <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3">
                <span className="text-xs text-blue-700 font-medium">{t('best_time')}</span>
                <span className="text-xs text-blue-800 font-bold">{post.suggested_time}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={copyToClipboard} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300">
                  {copied ? t('btn_copied') : t('btn_copy')}
                </Button>
                <Button variant="outline" onClick={generatePost} className="flex-1">
                  {t('btn_regenerate')}
                </Button>
              </div>

              {/* Native Publishing Actions */}
              {connections.length > 0 && (
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Publier directement sur :</p>
                  {connections.map(c => (
                     <Button 
                       key={c.id} 
                       onClick={() => handlePublish(c.platform, c.id)}
                       disabled={publishing !== null}
                       className={`w-full justify-between shadow-sm ${c.platform === 'meta' ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white' : 'bg-black text-white hover:bg-zinc-800'}`}
                     >
                       <span>{c.account_name} ({c.platform})</span>
                       {publishing === c.platform ? (
                         <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                       ) : publishSuccess === c.platform ? (
                         <span>✅ Envoyé !</span>
                       ) : (
                         <span>Publier &rarr;</span>
                       )}
                     </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
