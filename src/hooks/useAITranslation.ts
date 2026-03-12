import { useState, useCallback, useRef } from 'react';

/**
 * Result object returned by the `useAITranslation` hook.
 */
type UseAITranslationResult = {
  /** Asynchronously translates text to a target language. Returns the translated string or null on failure. */
  translate: (text: string, targetLanguage: string) => Promise<string | null>;
  /** Indicates whether a translation request is currently in flight. */
  isTranslating: boolean;
  /** Contains the error message if the translation request failed, or null if successful. */
  error: string | null;
  /** In-memory cache mapping source text to a dictionary of language codes and their translated text. */
  translationsCache: Record<string, Record<string, string>>; // srcText -> { lgCode: translated }
};

/**
 * A custom React hook for handling asynchronous AI translations via the `/api/translate-note` endpoint.
 * Includes an internal state memory cache to prevent duplicate external API calls during a single session.
 *
 * @returns {UseAITranslationResult} An object containing the `translate` function, loading state, error state, and the cache.
 */
export function useAITranslation(): UseAITranslationResult {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic memory cache to prevent re-translating the same string in the same session
  const [translationsCache, setTranslationsCache] = useState<Record<string, Record<string, string>>>({});
  // Use a ref to access cache in the callback without it being a dependency
  const cacheRef = useRef(translationsCache);
  cacheRef.current = translationsCache;

  const translate = useCallback(async (text: string, targetLanguage: string): Promise<string | null> => {
    if (!text || !targetLanguage) return null;

    // Check cache first (via ref to avoid dependency instability)
    if (cacheRef.current[text]?.[targetLanguage]) {
      return cacheRef.current[text][targetLanguage];
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
    } catch (err) {
      console.error("AI Translation Error:", err);
      setError((err as Error).message || 'Error occurred during translation');
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []); // Stable callback — cache is accessed via ref

  return { translate, isTranslating, error, translationsCache };
}
