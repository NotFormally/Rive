# ==============================================================================
# RiveHub OSINT Engine - AI Lead Scorer (Operational)
# Description: Prend les notes brutes d'une inspection sanitaire et utilise
# Claude 3 Haiku via REST API pour attribuer un score de vulnérabilité 
# "HACCP" (1-10) afin de qualifier les leads B2B les plus prometteurs.
# ==============================================================================

import os
import json
import logging
import requests
from typing import Dict, Any
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le .env.local de RiveHub
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

# Configure Logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("RiveHub_AI_Scorer")

class HACCPLeadScorer:
    """
    Le Cerveau du Bot d'Acquisition : Filtre le bruit pour ne garder que les restaurants
    ayant désespérément besoin d'un logiciel de traçabilité/température.
    """
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY non trouvée dans .env.local")
        
        self.api_url = "https://api.anthropic.com/v1/messages"

    def analyze_infraction(self, restaurant_name: str, inspection_notes: str) -> Dict[str, Any]:
        """
        Analyse sémantiquement les notes de l'inspecteur d'hygiène avec Claude.
        """
        logger.info(f"Analyse AI du rapport d'hygiène pour: {restaurant_name}")
        
        system_prompt = """
        Tu es un analyste stratégique B2B pour RiveHub, un logiciel de conformité HACCP (Digitalisation des logs de température et étiquettes de péremption).
        Analyse les notes d'inspection sanitaire suivantes.
        Attribue un score de vulnérabilité HACCP de 1 à 10.
        Si l'infraction concerne la température (cuisson, refroidissement), le stockage (DLUO, traçabilité des lots) ou l'absence de registres papier, donne un score > 8.
        Si l'infraction concerne des éléments structurels (tuiles cassées, peinture, vermine), donne un score < 4.
        Retourne UNIQUEMENT un objet JSON valide avec ce format exact, sans aucun blabla avant ou ou après:
        {
            "score": 9,
            "reason": "Absence de registres de refroidissement rapide constatée",
            "qualified_lead": true
        }
        """

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

        payload = {
            "model": "claude-3-haiku-20240307",
            "max_tokens": 256,
            "temperature": 0.0,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": f"Restaurant: {restaurant_name}\nNotes de l'inspecteur: {inspection_notes}"}
            ]
        }

        try:
            response = requests.post(self.api_url, headers=headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            response_text = data["content"][0]["text"].strip()
            
            # Nettoyer d'éventuels marqueurs markdown code si Haiku en renvoie
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
                
            result_json = json.loads(response_text)
            score = result_json.get("score", 0)
            reason = result_json.get("reason", "")
            
            # Garantir que qualified_lead est un booléen et basé sur notre regle
            result_json["qualified_lead"] = int(score) >= 7

            if result_json["qualified_lead"]:
                logger.info(f"LEAD QUALIFIÉ -> Score: {score}/10 | Raison: {reason}")
            else:
                logger.info(f"Lead Rejeté (Hors ICP). Score: {score}/10")

            return result_json
            
        except Exception as e:
            logger.error(f"Erreur avec l'API Anthropic : {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Détails: {e.response.text}")
            return {
                "score": 0,
                "reason": f"Erreur système: {str(e)}",
                "qualified_lead": False
            }

if __name__ == "__main__":
    scorer = HACCPLeadScorer()
    
    print("--- Test 1 (Lead RiveHub Parfait avec Claude) ---")
    res1 = scorer.analyze_infraction(
        restaurant_name="Bistro Parisien", 
        inspection_notes="L'établissement ne maintient aucun registre écrit de refroidissement de ses soupes. Le thermomètre du walk-in 2 est mal calibré."
    )
    print(json.dumps(res1, indent=2, ensure_ascii=False))
    
    print("\n--- Test 2 (Bruit / Lead Rejeté avec Claude) ---")
    res2 = scorer.analyze_infraction(
        restaurant_name="Pizzeria Rapido", 
        inspection_notes="Plinthe décollée dans le corridor menant à la salle de bains. Présence de mouches près des poubelles arrière."
    )
    print(json.dumps(res2, indent=2, ensure_ascii=False))
