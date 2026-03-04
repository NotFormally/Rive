import os
import json
import asyncio
from supabase import create_client, Client
import fitz  # PyMuPDF
from typing import List, Dict, Any

from dotenv import load_dotenv
from google import genai

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

gemini_client = genai.Client()


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from the recipe PDF."""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    return text
def insert_recipe_to_supabase(recipe_data: Dict[str, Any]) -> tuple[bool, str]:
    """Insert the structured recipe into Supabase. Returns (success, error_msg)."""
    try:
        # We use the service role key, which bypasses RLS, so no user_id is strictly required here for the backend script
        result = supabase.table('recipes').insert(recipe_data).execute()
        return True, ""
    except Exception as e:
        error_msg = str(e)
        return False, error_msg

async def process_recipe_with_feedback(chunk: str, max_retries: int = 3) -> bool:
    """Boucle d'apprentissage : tente d'extraire et d'insérer, puis renvoie l'erreur à Gemini si échec."""
    error_feedback = ""
    
    with open('/tmp/prompt.txt', 'r') as f:
        base_prompt = f.read()
        
    for attempt in range(max_retries):
        print(f"Tentative {attempt + 1}/{max_retries}...")
        
        if error_feedback:
            prompt = f"{base_prompt}\n\nATTENTION, LA TENTATIVE PRÉCÉDENTE A ÉCHOUÉ AVEC L'ERREUR SUIVANTE :\n{error_feedback}\nCorrige l'erreur et adapte la structure de ton JSON pour qu'il soit accepté par la base de données ou le parseur."
        else:
            prompt = base_prompt
            
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"{prompt}\n\nTEXTE BRUT DE LA RECETTE A EXTRAIRE:\n{chunk}",
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        
        try:
            recipe_data = json.loads(response.text)
            
            print("--- RECETTE GÉNÉRÉE PAR L'IA ---")
            print(json.dumps(recipe_data, indent=2, ensure_ascii=False))
            print("--------------------------------")
            
            success, err_msg = insert_recipe_to_supabase(recipe_data)
            if success:
                print("✅ Insertion réussie dans Supabase !")
                return True
            else:
                print(f"❌ Échec de l'insertion (Angle mort détecté). Erreur DB : {err_msg}\nFeedback renvoyé à l'IA...")
                error_feedback = f"Erreur d'insertion dans la base de données : {err_msg}"
                
        except json.JSONDecodeError as e:
            print(f"❌ Erreur de parsing JSON. L'IA a fourni un format invalide.")
            error_feedback = f"Erreur de parsing JSON : {e}. Le format n'était pas un JSON valide."
            
    print("❌ Boucle d'apprentissage terminée : nombre maximal de tentatives atteint sans succès.")
    return False

async def main():
    pdf_path = "/Users/nassim/livre_de_recette.pdf"
    print("1. Extraction du texte brut (Parsing du PDF)...")
    raw_text = extract_text_from_pdf(pdf_path)
    
    # We take a chunk to test the extraction of the first recipe (Soupe aux lentilles)
    start_idx = raw_text.find("SOUPE AUX LENTILLES")
    if start_idx == -1:
        print("❌ Recette de test non trouvée dans le texte.")
        return
        
    chunk = raw_text[start_idx:start_idx+2000]
    print(f"2. Démarrage de la boucle d'apprentissage IA avec filet de sécurité...")
    await process_recipe_with_feedback(chunk)

if __name__ == "__main__":
    asyncio.run(main())
