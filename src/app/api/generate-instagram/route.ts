import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { loadMenuFromSupabase } from '@/lib/menu-store';
import { MODEL_CREATE } from '@/lib/ai-models';
import { requireAuth, unauthorized } from '@/lib/auth';
import { checkRateLimit, tooManyRequests } from '@/lib/rate-limit';
import { supabase } from '@/lib/supabase';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // Auth check
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    // Rate limit check
    const rateLimit = await checkRateLimit(auth.restaurantId, 'generate-instagram');
    if (!rateLimit.allowed) return tooManyRequests();

    const { menuItemId } = await req.json();

    if (!menuItemId) {
      return new Response(JSON.stringify({ error: "menuItemId requis" }), { status: 400 });
    }

    // Load menu to find the item
    const menu = await loadMenuFromSupabase();
    const targetItemRaw = menu.items.find((i) => i.id === menuItemId);

    if (!targetItemRaw) {
      return new Response(JSON.stringify({ error: "Plat introuvable" }), { status: 404 });
    }

    const categoryName = menu.categories.find((c) => c.id === targetItemRaw.categoryId)?.name || "Menu";
    const targetItem = { ...targetItemRaw, categoryName };

    // Fetch BCG classification for this item
    let bcgCategory = "inconnu";
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const engRes = await fetch(`${siteUrl}/api/menu-engineering`);
      const engData = await engRes.json();
      const engItem = engData.items?.find((i: any) => i.menuItemId === menuItemId);
      if (engItem) bcgCategory = engItem.category;
    } catch { /* ignore */ }

    // Map BCG to tone
    const toneMap: Record<string, string> = {
      phare: "Enthousiasmant et fier. Ce plat est notre vedette, mettez-le en avant avec confiance.",
      ancre: "Chaleureux et populaire. Ce plat est un classique adoré, célébrez-le.",
      derive: "Curiosité et découverte. Ce plat est un trésor caché, incitez à l'essayer.",
      ecueil: "Ne pas générer de post. Suggérez plutôt de retirer le plat ou de le reformuler.",
    };

    // Fetch restaurant profile to get social media context
    const { data: profile } = await supabase
      .from("restaurant_profiles")
      .select("social_media_context")
      .eq("id", auth.restaurantId)
      .single();

    const socialMediaContext = profile?.social_media_context 
      ? `\nDirectives de la marque :\n${profile.social_media_context}\n\nAssure-toi de respecter scrupuleusement ces directives pour le ton, le style et les mots-clés.`
      : "";

    const prompt = `Tu es un community manager expert pour un restaurant. Génère un post Instagram professionnel pour le plat suivant :

Plat : ${targetItem.name}
Description : ${targetItem.description}
Prix : ${targetItem.price}$
Catégorie : ${targetItem.categoryName}
Allergènes : ${targetItem.allergens?.join(", ") || "Aucun"}
Classification Rive : ${bcgCategory} (${toneMap[bcgCategory] || "Ton neutre."})${socialMediaContext}

Génère UNIQUEMENT un objet JSON avec cette structure exacte :
{
  "caption_fr": "Le texte du post en français (2-3 phrases engageantes + emojis)",
  "caption_en": "English version of the post",
  "hashtags": ["#tag1", "#tag2", "..."],
  "cta": "Un call-to-action court (ex: Réservez maintenant !)",
  "suggested_time": "Le meilleur moment pour poster (ex: Mercredi 18h)"
}`;

    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback without AI
      return new Response(JSON.stringify({
        caption_fr: `✨ Découvrez notre ${targetItem.name} — ${targetItem.description} Seulement ${targetItem.price}$ 🍽️`,
        caption_en: `✨ Discover our ${targetItem.name} — Only $${targetItem.price} 🍽️`,
        hashtags: ["#Restaurant", "#Foodie", "#MontrealFood", "#GastronomieQuébécoise", "#FoodPhotography"],
        cta: "Réservez votre table dès aujourd'hui !",
        suggested_time: "Mercredi 18h",
        item: targetItem,
        bcg: bcgCategory,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const { text } = await generateText({
      model: anthropic(MODEL_CREATE),
      prompt,
      temperature: 0.7,
    });

    const jsonStr = text.replace(/```json\n|```/g, '');
    const result = JSON.parse(jsonStr);

    return new Response(JSON.stringify({
      ...result,
      item: targetItem,
      bcg: bcgCategory,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Erreur génération Instagram:", error);
    return new Response(JSON.stringify({ error: "Erreur lors de la génération" }), { status: 500 });
  }
}
