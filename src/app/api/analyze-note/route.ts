import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import { MODEL_EXTRACT } from '@/lib/ai-models';
import { requireAuth, unauthorized } from '@/lib/auth';
import { checkRateLimit, tooManyRequests } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // Auth check
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    // Rate limit check
    const rateLimit = await checkRateLimit(auth.restaurantId, 'analyze-note');
    if (!rateLimit.allowed) return tooManyRequests();

    const { note } = await req.json();

    if (!note) {
      return new Response('Note text is required', { status: 400 });
    }

    try {
      const { object } = await generateObject({
        model: anthropic(MODEL_EXTRACT),
        schema: z.object({
          tags: z.array(z.string()).describe('2-4 tags courts décrivant le sujet (ex: "Urgent", "Équipement", "Hygiène", "Personnel")'),
          sentiment: z.enum(['Positive', 'Neutral', 'Negative']).describe('Sentiment global de la note'),
          detectedLanguage: z.string().describe('Code langue détectée (fr, en, es)'),
          summary: z.string().describe('Résumé de la note en 1-2 phrases courtes et factuelles'),
          isUrgent: z.boolean().describe('true si la note mentionne un problème nécessitant une action immédiate'),
        }),
        prompt: `Tu es un assistant IA pour la gestion de restaurant. Analyse cette note de quart de travail et extrais les informations structurées demandées.\n\nNote: "${note}"`,
      });

      return new Response(JSON.stringify(object), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (aiError) {
      console.error('AI analysis failed, using fallback:', aiError);
      // Fallback response
      const fallback = {
        tags: ["Note"],
        sentiment: "Neutral",
        detectedLanguage: "fr",
        summary: note.substring(0, 100) + (note.length > 100 ? '...' : ''),
        isUrgent: false,
      };
      return new Response(JSON.stringify(fallback), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error analyzing note:', error);
    return new Response('Error processing request', { status: 500 });
  }
}
