import { useState, useCallback } from 'react';

type UseAITranslationResult = {
  translate: (text: string, targetLanguage: string) => Promise<string | null>;
  isTranslating: boolean;
  error: string | null;
  translationsCache: Record<string, Record<string, string>>; // srcText -> { lgCode: translated }
};

export function useAITranslation(): UseAITranslationResult {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Basic memory cache to prevent re-translating the same string in the same session
  const [translationsCache, setTranslationsCache] = useState<Record<string, Record<string, string>>>({});

  const translate = useCallback(async (text: string, targetLanguage: string): Promise<string | null> => {
    if (!text || !targetLanguage) return null;

    // Check cache first
    if (translationsCache[text]?.[targetLanguage]) {
      return translationsCache[text][targetLanguage];
    }

    setIsTranslating(true);
    setError(null);

    try {
      const response = await fetch('/api/translate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          targetLanguage 
        }),
      });

      if (!response.ok) {
        throw new Error('Translation request failed');
      }

      const data = await response.json();
      const translatedText = data.translation;

      // Save to cache
      setTranslationsCache(prev => ({
        ...prev,
        [text]: {
          ...(prev[text] || {}),
          [targetLanguage]: translatedText
        }
      }));

      return translatedText;
    } catch (err: any) {
      console.error("AI Translation Error:", err);
      setError(err.message || 'Error occurred during translation');
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, [translationsCache]);

  return { translate, isTranslating, error, translationsCache };
}
