declare module 'wink-sentiment' {
  interface SentimentOutput {
    score: number;
    normalizedScore: number;
    tokenizedPhrase: string[];
    sentiment?: {
      positive: string[];
      negative: string[];
    };
  }
  function sentiment(phrase: string): SentimentOutput;
  export = sentiment;
}
