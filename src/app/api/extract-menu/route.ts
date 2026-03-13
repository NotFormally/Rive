import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import { MODEL_EXTRACT } from '@/lib/ai-models';
import { requireAuth, unauthorized } from '@/lib/auth';
import { checkRateLimit, tooManyRequests } from '@/lib/rate-limit';

const menuExtractionSchema = z.object({
  currency: z.string().optional().describe('Currency symbol detected (e.g. $, €, £). Default to $ if unclear.'),
  categories: z.array(z.object({
    name: z.string().describe('Category/section name as written on the menu (e.g. Entrées, Mains, Desserts, Drinks).'),
    items: z.array(z.object({
      name: z.string().describe('Dish name exactly as written on the menu.'),
      description: z.string().default('').describe('Description if present, otherwise empty string.'),
      price: z.number().describe('Price as a number (no currency symbol). Use 0 if not visible.'),
      allergens: z.array(z.string()).default([]).describe(
        'Allergens detected from the description or dish name. Use standard categories: ' +
        'Gluten, Dairy, Eggs, Fish, Shellfish, Tree Nuts, Peanuts, Soy, Sesame, Sulfites, Celery, Mustard, Lupin, Mollusks.'
      ),
      inferredIngredients: z.array(z.object({
        name: z.string().describe('Ingredient name (e.g. salmon, butter, flour).'),
        estimatedQuantity: z.string().optional().describe('Rough quantity if inferable (e.g. "200g", "2 fillets"). Omit if unknown.'),
        unit: z.string().optional().describe('Unit of measure (g, kg, L, ml, unit). Omit if unknown.'),
      })).default([]).describe('Infer 2-5 key ingredients per dish from the name and description. Focus on main proteins, starches, and notable ingredients.'),
      confidence: z.number().min(0).max(1).describe('Confidence in extraction accuracy: 1.0 = perfectly clear, 0.5 = partially readable, 0.0 = guessing.'),
    })),
  })),
});

export type MenuExtractionResult = z.infer<typeof menuExtractionSchema>;

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    const rateLimit = await checkRateLimit(auth.restaurantId, 'extract-menu');
    if (!rateLimit.allowed) return tooManyRequests();

    const { image } = await req.json();

    if (!image) {
      return new Response('Image data is required', { status: 400 });
    }

    let extractedMenu;
    try {
      const { object } = await generateObject({
        model: anthropic(MODEL_EXTRACT),
        schema: menuExtractionSchema,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Tu es un expert en extraction de menus de restaurant. Analyse cette image de menu et extrais TOUS les éléments avec une précision maximale.

Règles :
1. Identifie chaque section/catégorie du menu (Entrées, Plats, Desserts, Boissons, etc.)
2. Pour chaque plat : nom exact, description complète, prix
3. Détecte les allergènes à partir des descriptions (ex: "crème" → Dairy, "panure" → Gluten, "crevettes" → Shellfish)
4. Infère 2-5 ingrédients principaux par plat à partir du nom et de la description
5. Attribue un score de confiance (0-1) basé sur la lisibilité
6. Si le menu est bilingue, utilise la langue principale
7. Si le menu a plusieurs pages, extrais TOUT
8. Les prix doivent être des nombres (pas de symbole de devise)
9. Si une section n'a pas de nom clair, utilise "Autres" comme catégorie`,
              },
              { type: 'image', image },
            ],
          },
        ],
      });
      extractedMenu = object;
    } catch (aiError) {
      console.error('AI Menu extraction failed:', aiError);
      return new Response(JSON.stringify({
        error: 'menu_extraction_failed',
        message: 'Unable to extract menu data. Please try with a clearer image or PDF.'
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(extractedMenu), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error extracting menu:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
