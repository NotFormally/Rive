// Rive — Centralized AI Model Configuration
// "Haiku pour extraire, Sonnet pour rédiger"

// Extraction / mécanique → Haiku 4.5 (rapide, économique)
// Routes: analyze-note, translate-note, scan-receipt
export const MODEL_EXTRACT = 'claude-haiku-4-5-20251001';

// Rédaction créative / raisonnement stratégique → Sonnet 4 ($3.00/MTok in, $15.00/MTok out)
// Routes: corrective-actions, generate-instagram, menu-engineering
export const MODEL_CREATE = 'claude-sonnet-4-20250514';
