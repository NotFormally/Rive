import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { MODEL_EXTRACT } from '@/lib/ai-models';
import { requireAuth, unauthorized } from '@/lib/auth';
import { checkRateLimit, tooManyRequests } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // Auth check
    const auth = await requireAuth(req);
    if (!auth) return unauthorized();

    // Rate limit check
    const rateLimit = await checkRateLimit(auth.restaurantId, 'translate-note');
    if (!rateLimit.allowed) return tooManyRequests();

    const { text, targetLanguage, summary } = await req.json();

    if (!text || !targetLanguage) {
      return new Response('Text and target language are required', { status: 400 });
    }

    const langMap: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French' };
    const langName = langMap[targetLanguage] || targetLanguage;

    try {
      const { text: translatedText } = await generateText({
        model: anthropic(MODEL_EXTRACT),
        prompt: `Translate the following restaurant shift note into ${langName}. Maintain the original tone and context. Return ONLY the translation, no explanation.\n\nNote: "${text}"`,
      });

      let translatedSummary;
      if (summary) {
        const { text: tSum } = await generateText({
          model: anthropic(MODEL_EXTRACT),
          prompt: `Translate the following summary into ${langName}. Return ONLY the translation.\n\nSummary: "${summary}"`,
        });
        translatedSummary = tSum;
      }

      return new Response(JSON.stringify({ translation: translatedText, summaryTranslation: translatedSummary }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (aiError) {
      console.error('AI Translation failed, using fallback:', aiError);

      // Fallback mock
      return new Response(JSON.stringify({
        translation: `[Traduction ${langName}] ${text}`,
        summaryTranslation: summary ? `[Résumé ${langName}] ${summary}` : undefined,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error translating note:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
