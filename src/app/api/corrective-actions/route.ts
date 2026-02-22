import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { MODEL_CREATE } from '@/lib/ai-models';
import { requireAuth, unauthorized } from '@/lib/auth';
import { checkRateLimit, tooManyRequests } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // Auth check
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    // Rate limit check
    const rateLimit = await checkRateLimit(auth.restaurantId, 'corrective-actions');
    if (!rateLimit.allowed) return tooManyRequests();

    const { taskDescription, temperature } = await req.json();

    const prompt = `Tu es un expert en sécurité alimentaire (MAPAQ) au Québec. 
Un employé de restaurant vient de relever une température anormale lors de l'inspection suivante: "${taskDescription}".
La température mesurée est de ${temperature}°C, ce qui est hors norme.

Génère exactement 3 actions correctives courtes, concrètes et immédiates que l'employé devrait entreprendre ou cocher pour se conformer.
Formate UNIQUEMENT ta réponse avec ces 3 options séparées par des tirets (-), sans introduction ni conclusion.`;

    const { text } = await generateText({
      model: anthropic(MODEL_CREATE),
      prompt: prompt,
    });

    // Parse the 3 options
    const options = text
      .split('\n')
      .filter((line) => line.trim().startsWith('-'))
      .map((line) => line.replace(/^-\s*/, '').trim());

    return new Response(JSON.stringify({ options }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la génération des actions correctives" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
