import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";

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

    const { fileData, mediaType, isPdf } = await req.json();

    if (!fileData || !mediaType) {
      return NextResponse.json({ error: "No file data or media_type provided" }, { status: 400 });
    }

    const contentBlock: any = {
      type: isPdf ? "document" : "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: fileData
      }
    };

    // Call Claude 3.5 Sonnet to perform OCR and structure as JSON
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2500,
      system: `Tu es RiveHub Analytics, un auditeur financier et expert en intelligence artificielle pour les restaurants.
Ton travail consiste à analyser la facture fournie visuellement (image ou PDF) et à en extraire tous les "line items" (produits facturés) de manière extrêmement précise.

Tu dois retourner la réponse dans le format JSON strict suivant, SANS AUCUN markdown ni texte d'accompagnement :
{
  "supplier_name": "Nom du Fournisseur",
  "invoice_number": "Numéro de Facture (ou null)",
  "invoice_date": "YYYY-MM-DD",
  "total_amount": 120.50,
  "items": [
    {
      "raw_description": "Description telle qu'écrite (ex: TOMATES ROMA 25LB)",
      "quantity": 1.000,
      "unit": "LB (ou Caisse, KG, EA, etc.)",
      "unit_price": 25.50,
      "total_price": 25.50,
      "ai_confidence": 0.95
    }
  ]
}

Le champ "ai_confidence" (entre 0.00 et 1.00) doit refléter à quel point tu es sûr de ton extraction pour cette ligne. Baisse ce score si la ligne est floue, raturée, ou si les totaux (quantity * unit_price) ne correspondent pas au total_price exact.`,
      messages: [
        {
          role: "user",
          content: [
            contentBlock,
            {
              type: "text",
              text: "Extrait les données de cette facture dans le format JSON demandé."
            }
          ]
        }
      ]
    });

    const responseText = (message.content[0] as any).text;

    try {
      const extractedData = JSON.parse(responseText.trim());
      return NextResponse.json(extractedData);
    } catch (parseError) {
      console.error("Failed to parse Claude JSON response:", responseText);
      return NextResponse.json(
        { error: "AI response was not valid JSON", raw: responseText },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("OCR Extraction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process invoice via OCR" },
      { status: 500 }
    );
  }
}
