# Stratégie GTM RiveHub : Le Pipeline OSINT (Open Source Intelligence)

Ce document détaille l'approche agressive d'acquisition B2B pour RiveHub, validée comme le pilier de croissance principal. L'objectif est d'utiliser les données publiques des inspections sanitaires pour cibler les restaurants au moment exact où leur niveau de stress opérationnel (et leur besoin de conformité) est au maximum.

## 1. Le Concept : Le "Timely Trigger" (Déclencheur Opportun)
Le meilleur moment pour vendre un logiciel SaaS B2B n'est pas quand le client va bien, c'est immédiatement après un "événement déclencheur" (Trigger Event) douloureux.
*   **La Douleur :** Un restaurant vient d'obtenir une mauvaise note (ex: C à NYC) ou une amende du MAPAQ (Québec) suite à une inspection surprise. Le propriétaire est furieux, le Chef est stressé. Le risque de fermeture ou de perte de clientèle (si l'Avis de non-conformité est public) est réel.
*   **La Solution RiveHub :** À cet instant précis, ils reçoivent une offre ciblée de RiveHub : "Ne ratez plus jamais une inspection à cause de paperasse manquante. Digitalisez vos logs HACCP, la traçabilité de vos lots et vos plannings de nettoyage en un clic avec Rive."

## 2. Architecture Technique du Bot OSINT RiveHub (Le Moteur d'Acquisition)

Pour que cette stratégie soit un avantage déloyal (Moat), elle ne peut pas consister en un simple script d'alerte. RiveHub doit construire un véritable **Pipeline Data + IA** qui qualifie le lead.

### A. Phase 1 : Extraction (Le Scraper Distribué)
Le bot (développé idéalement en Python) cible quotidiennement les bases de données gouvernementales.
*   **Sources "Propres" (API) :** Requêtes `GET` sur *NYC Open Data* (Socrata API), *Toronto DineSafe API*, ou le portail Ouvert de Montréal.
*   **Sources "Sales" (Web Scraping & PDF) :** Certaines villes (ou le MAPAQ) publient parfois des listes de condamnations en PDF ou sur des pages web statiques. Le bot utilise **Playwright** (pour naviguer/contourner les protections) et **pdfplumber** pour extraire le texte des jugements.

### B. Phase 2 : Le "HACCP Vulnerability Score" (Analyse LLM)
C'est ici que RiveHub déploie un effort cognitif maximal. Toutes les infractions ne se valent pas pour nous. Une amende pour "Tuile de plancher cassée" n'est pas un *trigger* pertinent pour vendre notre app. Une amende pour "Absence de registre de refroidissement" l'est à 100%.
*   **Le Processus :** Le texte brut de l'infraction (ex: les notes de l'inspecteur) est envoyé à notre LLM (ex: Claude 3.5 Sonnet ou GPT-4o mini) via l'API.
*   **Le Prompt de Classification :** *"Analyse ce rapport d'inspection. Attribue un score de vulnérabilité documentaire (HACCP/Traçabilité) de 1 à 10. Si l'infraction mentionne 'température', 'dluo', 'étiquetage', 'provenance', ou 'registre', le score doit être > 8."*
*   **Résultat :** Le bot filtre instantanément et ne garde que les restaurants ayant un score de vulnérabilité HACCP élevé.

### C. Phase 3 : L'Enrichissement B2B (Trouver la Cible)
Avoir le nom légal (ex: *9384-2938 Québec Inc.*) ne sert à rien pour vendre. Il faut le nom du restaurant et le contact du décideur.
1.  **Réconciliation d'Identité :** Le script croise l'adresse physique de l'infraction avec **Google Places API** pour obtenir le vrai nom commercial (ex: *Le Petit Couteau*), le site web, et le niveau de standing (prix, avis).
2.  **Chasse au Décideur :** Le domaine web est envoyé à des API d'enrichissement B2B comme **Apollo.io**, **Hunter.io** ou **Clearbit**. Le but : Trouver l'email LinkedIn du Propriétaire (Owner), du Chef Exécutif, ou du Directeur des Opérations (COO).

### D. Phase 4 : Déclenchement (Le Webhook CRM)
Dès qu'un lead passe les filtres (Score HACCP élevé + Email du propriétaire trouvé), le bot pousse un payload JSON structuré via **Webhook** directement dans notre CRM (HubSpot ou Attio).
*   **Exemple de Payload JSON :**
    *   `restaurant_name`: "Le Petit Couteau"
    *   `decision_maker`: "Jean Dupont (Owner)"
    *   `email`: "jean@lepetitcouteau.com"
    *   `trigger_event`: "Amende MAPAQ 1500$ - Défaut de traçabilité des lots de viandes"
    *   `inspection_date`: "2026-10-24"

### C. La Campagne de "Cold Emailing" Automatisée
Dès l'entrée dans le CRM, une séquence d'emails (Seq) est déclenchée. Le ton ne doit pas être accusateur, mais empathique et orienté solution.

*   **Sujet (Exemple) :** *Simplifier les inspections sanitaires au [Nom du Restaurant]*
*   **Corps du message :** "Bonjour [Prénom], J'ai remarqué que le maintien des registres de conformité devient un défi de plus en plus chronophage dans l'industrie, surtout face aux récentes mises à jour des standards sanitaires à [Ville]. Chez Rive, nous avons vu des cuisines perdre des heures à chercher des factures de traçabilité lors d'inspections. Notre outil transforme vos factures papier en logs de traçabilité HACCP en un simple clic (OCR). Les inspecteurs adorent. Seriez-vous ouvert à une démo de 10 min cette semaine ?"

## 3. L'Avantage Concurrentiel (Le Moat)
La plupart des logiciels de gestion de restaurants (MarginEdge, 7shifts) utilisent des stratégies de marketing de contenu (Inbound) ou de la publicité payante (Ads) extrêmement coûteuses.
*   En combinant un produit très spécifique (Compliance HACCP + OCR) avec un canal d'acquisition chirurgical (OSINT Trigger), le Coût d'Acquisition Client (CAC) de RiveHub sera dramatiquement inférieur à la moyenne de l'industrie. C'est l'essence même d'une stratégie de "Guérilla Marketing" B2B hyper-intelligente.
