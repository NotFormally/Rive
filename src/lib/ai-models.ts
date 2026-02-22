// Rive — Centralized AI Model Configuration
// "Haiku pour extraire, Sonnet pour rédiger"

// Extraction / mécanique → Haiku 3.5 (rapide, $0.80/MTok in, $4.00/MTok out)
// Routes: analyze-note, translate-note, scan-receipt
export const MODEL_EXTRACT = 'claude-3-5-haiku-latest';

// Rédaction créative / raisonnement stratégique → Sonnet 4 ($3.00/MTok in, $15.00/MTok out)
// Routes: corrective-actions, generate-instagram, menu-engineering
export const MODEL_CREATE = 'claude-sonnet-4-20250514';
