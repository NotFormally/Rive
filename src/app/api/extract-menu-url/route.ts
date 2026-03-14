import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import { MODEL_EXTRACT } from '@/lib/ai-models';
import { requireAuth, unauthorized } from '@/lib/auth';
import { checkRateLimit, tooManyRequests } from '@/lib/rate-limit';
import { quickGuard } from '@/lib/security/prompt-guard';

const menuFromUrlSchema = z.object({
  currency: z.string().optional(),
  categories: z.array(z.object({
    name: z.string(),
    items: z.array(z.object({
      name: z.string(),
      description: z.string().default(''),
      price: z.number(),
      allergens: z.array(z.string()).default([]),
      ingredients: z.array(z.object({
        name: z.string(),
        estimatedQuantity: z.string().optional(),
        unit: z.string().optional(),
      })).default([]),
      confidence: z.number().min(0).max(1),
    })),
  })),
});

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const rateLimit = await checkRateLimit(auth.restaurantId, 'extract-menu-url');
    if (!rateLimit.allowed) return tooManyRequests();

    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const blocked = quickGuard(url, 'extract-menu-url');
    if (blocked) return blocked;

    // Validate it looks like an UberEats or delivery platform URL
    const validDomains = ['ubereats.com', 'doordash.com', 'deliveroo.com', 'grubhub.com', 'skipthedishes.com'];
    const urlObj = new URL(url);
    const isValid = validDomains.some(d => urlObj.hostname.includes(d));

    if (!isValid) {
      return new Response(JSON.stringify({
        error: 'invalid_url',
        message: 'Please provide a URL from a supported delivery platform (UberEats, DoorDash, Deliveroo, Grubhub, SkipTheDishes).'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Fetch the page content
    let pageContent: string;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RiveHub/1.0; menu-import)',
          'Accept': 'text/html',
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      pageContent = await response.text();
    } catch (fetchErr: any) {
      return new Response(JSON.stringify({
        error: 'fetch_failed',
        message: `Could not fetch the page. The URL may be invalid or the site may be blocking access.`
      }), { status: 422, headers: { 'Content-Type': 'application/json' } });
    }

    // Try to extract JSON-LD structured data first (most reliable)
    const jsonLdMatch = pageContent.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    let structuredData = '';
    if (jsonLdMatch) {
      structuredData = jsonLdMatch
        .map(m => m.replace(/<\/?script[^>]*>/gi, '').trim())
        .join('\n');
    }

    // Extract visible text (strip HTML tags) — limit to avoid token overflow
    const textContent = pageContent
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 15000); // limit to ~15k chars

    // Use Claude to extract menu from the page content
    let extractedMenu;
    try {
      const { object } = await generateObject({
        model: anthropic(MODEL_EXTRACT),
        schema: menuFromUrlSchema,
        messages: [
          {
            role: 'user',
            content: `Tu es un expert en extraction de menus de restaurant à partir de pages web de livraison (UberEats, DoorDash, Deliveroo, etc.).

Extrais le menu complet du restaurant à partir du contenu de cette page.

${structuredData ? `DONNÉES STRUCTURÉES (JSON-LD) :\n${structuredData}\n\n` : ''}CONTENU TEXTE DE LA PAGE :\n${textContent}

Règles :
1. Identifie les catégories/sections du menu
2. Extrais chaque plat avec nom, description, prix
3. Détecte les allergènes si mentionnés
4. Extrais les ingrédients UNIQUEMENT s'ils sont explicitement listés. Ne devine PAS les ingrédients. Liste vide si non mentionnés.
5. Prix en nombre (sans symbole de devise)
6. Score de confiance basé sur la clarté des données`,
          },
        ],
      });
      extractedMenu = object;
    } catch (aiError) {
      console.error('AI URL menu extraction failed:', aiError);
      return new Response(JSON.stringify({
        error: 'extraction_failed',
        message: 'Could not extract menu from this page. The page structure may not be supported.'
      }), { status: 422, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(extractedMenu), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error extracting menu from URL:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
