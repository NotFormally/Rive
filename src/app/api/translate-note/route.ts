import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { MODEL_EXTRACT } from '@/lib/ai-models';
import { requireAuth, unauthorized } from '@/lib/auth';
import { checkRateLimit, tooManyRequests } from '@/lib/rate-limit';
import { quickGuardMultiple } from '@/lib/security/prompt-guard';

const TRANSLATION_SYSTEM_PROMPT = `Tu es l'expert en communication multilingue et traduction opérationnelle de RiveHub, un système IA de pointe dédié à la gestion de restaurants gastronomiques et commerciaux.

Ton rôle est de traduire les messages du personnel, les notes d'équipe, et les entrées du registre de bord avec une maîtrise linguistique de niveau C1 (CEC).

RÈGLES STRICTES DE TRADUCTION :
1. Excellence Linguistique (Niveau C1) : La grammaire, la syntaxe, et l'orthographe doivent être irréprochables. La traduction doit sembler native, fluide et idiomatique, jamais traduite littéralement.
2. Exactitude Dialectale : Si une variante régionale ou un dialecte est spécifié (ex: Arabe Khaleeji, Égyptien, Anglais Australien, Espagnol Mexicain, Kabyle, Tagalog), tu DOIS utiliser le vocabulaire, les expressions, et la terminologie spécifiques à cette région. Adapte le registre culturel.
3. Jargon de Restauration (BOH/FOH) : Tu maîtrises parfaitement le vocabulaire technique de cuisine (HACCP, prep-list, walk-in cooler, salamandre, 86'd, no-show, FIFO). Traduis ces termes par leurs équivalents locaux exacts dans l'industrie, ou conserve-les s'ils sont considérés comme la norme internationale (ex: "Food Cost").
4. Préservation du Ton : Conserve l'intention et le ton du message original (urgence absolue, note informative, ton familier entre équipiers, ou ton formel pour le management).
5. Format de Sortie : Tu ne dois répondre QUE par le texte traduit. Aucun préambule, aucune explication, aucune note de traduction. Juste le résultat direct.`;

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

    const blocked = quickGuardMultiple({ text, summary }, 'translate-note');
    if (blocked) return blocked;

    const langMap: Record<string, string> = {
      // Major
      en: 'English', fr: 'French', es: 'Spanish', it: 'Italian',
      de: 'German', pt: 'Portuguese (Brazilian)', ru: 'Russian',
      pl: 'Polish', tr: 'Turkish', da: 'Danish', sv: 'Swedish',
      // MENA
      ar: 'Arabic (Modern Standard)', 'ar-AE': 'Arabic (UAE Khaleeji dialect)',
      'ar-LB': 'Arabic (Lebanese Levantine dialect)', 'ar-EG': 'Arabic (Egyptian dialect)',
      kab: 'Kabyle (Taqbaylit)',
      // Asia
      hi: 'Hindi', ur: 'Urdu', pa: 'Punjabi', ta: 'Tamil', bn: 'Bengali',
      'zh-CN': 'Simplified Chinese', 'zh-HK': 'Traditional Chinese (Cantonese)',
      nan: 'Min Nan Chinese (Taiwanese Hokkien)', ja: 'Japanese', ko: 'Korean',
      // Indo-Oceania
      id: 'Indonesian', ms: 'Malay', jv: 'Javanese', th: 'Thai',
      vi: 'Vietnamese', tl: 'Tagalog / Filipino',
      // Africa
      sw: 'Swahili', am: 'Amharic', yo: 'Yoruba', ha: 'Hausa',
      zu: 'Zulu (isiZulu)', om: 'Oromo',
      // ANZ
      'en-AU': 'English (Australian)', 'en-NZ': 'English (New Zealand)',
      // Celtic
      br: 'Breton', cy: 'Welsh', gd: 'Scottish Gaelic', ga: 'Irish (Gaeilge)',
      // Romance/Isolates
      eu: 'Basque (Euskara)', co: 'Corsican',
      // Germanic Regional
      nl: 'Dutch', 'nl-BE': 'Flemish (Belgian Dutch)',
      nds: 'Low German (Plattdeutsch)', gsw: 'Swiss German (Alemannic)',
      'frk-mos': 'Moselle Franconian',
      // Others/Creoles
      hsb: 'Upper Sorbian', rom: 'Romani', ht: 'Haitian Creole',
    };
    const langName = langMap[targetLanguage] || targetLanguage;

    try {
      const { text: translatedText } = await generateText({
        model: anthropic(MODEL_EXTRACT),
        system: TRANSLATION_SYSTEM_PROMPT,
        prompt: `Translate the following restaurant shift note into ${langName}. Return ONLY the direct translation.\n\nSource Note: "${text}"`,
      });

      let translatedSummary;
      if (summary) {
        const { text: tSum } = await generateText({
          model: anthropic(MODEL_EXTRACT),
          system: TRANSLATION_SYSTEM_PROMPT,
          prompt: `Translate the following situation summary into ${langName}. Return ONLY the direct translation.\n\nSource Summary: "${summary}"`,
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
