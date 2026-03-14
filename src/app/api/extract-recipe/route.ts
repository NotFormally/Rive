import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { quickGuard } from '@/lib/security/prompt-guard';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "", // From Higgs config / RiveHub .env.local
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Authenticate user
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key not configured in .env.local" },
        { status: 500 }
      );
    }

    const { transcription } = await req.json();

    if (!transcription) {
      return NextResponse.json({ error: "No transcription text provided" }, { status: 400 });
    }

    const blocked = quickGuard(transcription, 'extract-recipe');
    if (blocked) return blocked;

    // Call Claude 3.5 Sonnet to map raw voice to structured JSON
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      system: `Tu es RiveHub Smart Prep AI, un expert culinaire et analyste HACCP. 
L'utilisateur te fournit une dictée vocale brute (transcrite par Whisper).
Ton travail est d'extraire la recette/préparation sous forme de JSON strict respectant ce schéma exact :
{
  "title": "Nom de la Recette (court et précis)",
  "language": "Langue détectée (ex: fr)",
  "ingredients": [
    {
      "name": "Nom de l'ingrédient",
      "quantity": "Quantité (ex: 200, 1.5, 'Une pincée')",
      "unit": "Unité (ex: kg, g, L, ml, unités) - Null si pas applicable",
      "isCCP": true/false (Set to true SEULEMENT SI c'est une viande crue, poisson, produit laitier, ou allergène majeur nécessitant contrôle de température/traçabilité HACCP)
    }
  ],
  "steps": [
    "Étape 1...",
    "Étape 2..."
  ]
}
Renvoie UNIQUEMENT le bloc JSON valide. N'ajoute aucun markdown, aucune introduction.`,
      messages: [
        {
          role: "user",
          content: transcription
        }
      ]
    });

    const responseText = (message.content[0] as any).text;

    try {
      // Parse the JSON string coming back from Claude
      const extractedData = JSON.parse(responseText.trim());
      return NextResponse.json(extractedData);
    } catch (parseError) {
      console.error("Failed to parse Claude JSON response:", responseText);
      return NextResponse.json(
        { error: "AI response was not valid JSON" },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract recipe data" },
      { status: 500 }
    );
  }
}
