import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "", // Vercel env variable
  baseURL: "https://api.groq.com/openai/v1", // Groq's OpenAI-compatible endpoint
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Authenticate user before using API resources
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Groq Key check
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key not configured in .env.local" },
        { status: 500 }
      );
    }

    // Parse the FormData directly (Next.js App Router Native)
    const formData = await req.formData();
    const audioFile = formData.get("file") as Blob | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Convert standard Blob to a File object for the OpenAI SDK
    const file = new File(
      [audioFile], 
      "recording.wav", 
      { type: audioFile.type || "audio/wav" }
    );

    // Call Groq Whisper API (OpenAI compatible)
    // We use whisper-large-v3-turbo for high accuracy, ultra-fast STT
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      language: "fr", // Defaulting to French for RiveHub dictation
      response_format: "json",
      prompt: "Ingrédients, Cuisine, Recette, Quantité, Préparation, Cuisson, Réfrigération", // Context keywords
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
