# ==============================================================================
# RiveHub OSINT Engine - Core Scraper (Operational)
# Description: Extrait les données d'inspections sanitaires depuis les portails 
# Open Data (NYC DOHMH Restaurant Inspection Results).
# API: https://data.cityofnewyork.us/resource/43nn-pn8j.json
# ==============================================================================

import os
import json
import logging
import requests
from datetime import datetime, timedelta
from typing import List, Dict

# Configure Logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("RiveHub_OSINT")

class NYCDOHMHScraper:
    """
    Extrait les données de condamnation/historique depuis l'API Open Data de NYC.
    C'est un proxy fiable et toujours stable pour notre concept B2B d'acquisition.
    """
    def __init__(self):
        # Utilisation de l'API Socrata de NYC (Très stable)
        self.api_url = "https://data.cityofnewyork.us/resource/43nn-pn8j.json"

    def fetch_recent_infractions(self, limit: int = 15) -> List[Dict]:
        """
        Récupère les inspections récentes contenant une violation.
        """
        logger.info(f"OSINT Extraction: Recherche des infractions récentes sur NYC DOHMH...")
        
        try:
            # Requete Socrata (SoQL)
            # On cherche les inspections récentes avec une violation critique
            params = {
                "$limit": limit,
                "$order": "inspection_date DESC",
                "$where": "critical_flag = 'Critical'"
            }
            
            response = requests.get(self.api_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            # Formater les leads bruts
            raw_leads = []
            for record in data:
                lead = {
                    "restaurant_name": record.get("dba", "Inconnu"),
                    "address": f"{record.get('building', '')} {record.get('street', '')}, {record.get('boro', '')}",
                    "status": "Critical Violation",
                    "inspection_date": record.get("inspection_date", "")[:10],
                    "infractions": record.get("violation_description", "Non spécifié")
                }
                raw_leads.append(lead)
            
            logger.info(f"Scraping Terminé : {len(raw_leads)} cibles potentielles identifiées.")
            return raw_leads
            
        except Exception as e:
            logger.error(f"Erreur lors du scraping de l'API NYC DOHMH : {e}")
            return []

if __name__ == "__main__":
    # Test local
    scraper = NYCDOHMHScraper()
    leads = scraper.fetch_recent_infractions(limit=5)
    print(json.dumps(leads, indent=2, ensure_ascii=False))
