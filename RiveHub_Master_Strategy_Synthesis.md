# RiveHub : Master Strategy Synthesis & Go-To-Market Playbook
*Dernière mise à jour : Mars 2026*

Ce document synthétise l'ensemble des piliers stratégiques de RiveHub élaborés pour dominer le marché du B2B Restaurant-Tech, de l'acquisition du client (Le Bélier) à sa rétention profonde (Le Moat).

---

## 1. La Vision & Le Positionnement (Le "Wedge")
RiveHub ne se vend pas comme un simple "logiciel de gestion de restaurant" (Trop vaste, trop dur à vendre). Nous nous positionnons avec un angle d'attaque ultra-précis : **Résoudre la douleur financière et légale simultanément, sans ajouter de charge de travail au Chef.**

*   **Le Faux Problème :** Vendre un logiciel RH ou de planification d'horaires (Marché saturé par 7shifts, Push Operations. Faible barrière à l'entrée, forte friction utilisateur).
*   **Le Vrai Problème (Le Bélier) :** Le **Food Cost** (Marges écrasées par l'inflation) et la **Compliance Sanitaire** (Le risque d'amendes et de fermeture).
*   **La Solution Unifiée :** RiveHub fusionne la capture des coûts (Comptabilité) et la génération de logs HACCP (Hygiène) à partir d'une seule et unique action : **Scroller la facture de réception**.

---

## 2. L'Acquisition : Le Moteur OSINT (Le Hack GTM)
Au lieu de dépenser des milliers de dollars en publicités Facebook ou en appels à froid aléatoires, RiveHub utilise le Renseignement d'Origine Publique (OSINT) pour une acquisition *chirurgicale*.

### Le Pipeline "HACCP Vulnerability"
1.  **Extraction Quotidienne :** Un scraper RiveHub ("Le Bot") surveille les API et portails Ouverts des inspections sanitaires (MAPAQ, DineSafe Toronto, NYC DOHMH).
2.  **Scoring par Intelligence Artificielle :** Les notes brutes des inspecteurs pénètrent notre LLM qui leur attribue un "HACCP Vulnerability Score". RiveHub ne s'intéresse qu'aux restaurants ayant échoué sur des bases documentaires : *Manque de registre de température, défaut de traçabilité des lots, étiquetage DLUO inexistant*.
3.  **Enrichissement B2B & Déclenchement :** Le bot croise ces données avec Google Places et Apollo.io pour trouver l'email du propriétaire/chef. Il pousse le lead qualifié dans notre CRM (HubSpot/Attio).
4.  **Séquence Empathique Automatisée :** 24h après l'amende, le restaurateur reçoit un email ciblé proposant RiveHub comme solution instantanée pour ne plus jamais échouer sur la paperasse.

---

## 3. Le Workflow Initial : "One-Click Compliance"
C'est la démonstration cruciale ("The Aha! Moment") lors des démos clients.

*   **L'Événement :** Réception de la marchandise.
*   **L'Action (Zero Friction) :** Le sous-chef prend en photo (Batch scan) les factures (Sysco, Ferme, etc.) avec l'app**La Solution : Pipeline Hybride "Challenger"**
1.  **Réception :** Scanner l'image (PDF, PNG) via un canal (WhatsApp, Email, Photo Mobile).
2.  **Ancrage Spatial (Le Bâtisseur) :** **Google Cloud Document AI (Invoice Parser)** numérise l'image avec une précision spatiale absolue. Il extrait toutes les valeurs textuelles et leur position (Bounding Boxes). *Décision fixée : Google est préféré à AWS pour sa robustesse sémantique.*
3.  **L'Esprit (Le Cerveau) :** Le LLM (Anthropic Claude 4.6 Sonnet) en mode "Structured JSON Outputs" organise la facture (Fournisseur, Dates, Total, Lignes d'articles exactes) sans aucun besoin de *template* pré-configuré ou de paramétrage client.
*   **L'Extraction Tri-Directionnelle Automatisée :**
    1.  **Finances :** Inventaire ajusté, Food cost mis à jour, Alertes de dérive de prix envoyées au patron.
    2.  **Opérations :** RiveHub envoie une commande Web Bluetooth à l'imprimante thermique de la cuisine : les étiquettes de traçabilité et dates limites de consommation (DLUO) s'impriment toutes seules.
    3.  **Légal HACCP :** Un pop-up demande au commis la température de la viande reçue (connecté via sonde Bluetooth ou entrée clavier). Le log sanitaire est généré. *Le client est désormais conforme légalement juste en ayant scanné sa facture comptable.*

---

## 4. La Rétention & L'Usage Humain : "Smart Prep & NLP"
Pendant que l'OCR gère le back-office, la cuisine doit adopter l'outil au quotidien. C'est l'OS (Operating System) de la cuisine.

### A. La Fiche Technique Interactive (Création Multimodale)
*   **La Douleur :** Créer des fiches techniques prend des heures. Les Chefs détestent le faire.
*   **La Solution : Dictée et Reconnaissance Audio**
1.  Le cuisinier parle (« J'ai désossé deux poulets pour le plat du jour »).
2.  **Modèle Open-Source Whisper :** Le modèle Whisper (hébergé localement ou via une instance serverless privée sans clé API payante) transcrit la voix en texte brut, même avec des accents forts ou du bruit (hottes, casseroles).
3.  **NLP Claude 4.5 Sonnet :** Claude structure le texte brut en un JSON propre (Ingrédient: Poulet, Quantité: 2).iques (CCP) de température.

### B. Le "Babelfish" Inclusif (Profils Utilisateurs) et le Rendement Dynamique
*   **Les Profils Cuisiniers :** La fondation du système repose sur la création de *Profils Utilisateurs Individuels*. Chaque employé possède un profil où sa "Langue Préférée" est définie (ex: Espagnol, Tagalog, Français).
*   **Restitution pour le Cuisinier :** L'interface reconnaît l'utilisateur connecté. La recette (dictée à l'origine par le chef en français) est traduite sémantiquement et affichée instantanément dans la langue native du profil du commis (ex: en espagnol culinaire).
*   **Recalcul Instantané :** Si la portion cible passe de 20 à 60 couverts, RiveHub recalcule tous les grammages dynamiquement, éliminant l'erreur de calcul sous pression.

### C. La Gamification Mature (Accountability)
Finie la surveillance enfantine et punitive. RiveHub instaure l'**Empowerment Pédagogique**.
*   **Le Self-Audit de Fin de Quart :** Le cuisinier termine sa station. Au lieu de faire inspecter chaque bac, il prend sa station en photo ("Preuve Cryptographique" que les bacs sont propres et étiquetés) via l'app. C'est le transfert de fierté au travailleur.
*   **Le Passeport de Compétences :** Exécuter une recette 5 fois avec des inventaires parfaits et des audits visuels validés accorde une "Certification" algorithmique sur cette tâche. Le Chef peut utiliser cette donnée pour faire du mentorat et de la formation P2P (Peer-to-Peer).

### D. Le "No-Code" HACCP (Inspiré de SafetyCulture)
Les processus (Fermentation, Boucherie, Sous-Vide) sont complexes.
*   Le module "Smart Prep" utilise un constructeur d'interface dynamique (JSONB backend, React Flow frontend) qui permet aux chefs d'ajouter des blocs "Audits" logiques à la volée sur leurs recettes (Scanner un code-barre, prendre le PH, connecter la sonde de température), fusionnant la Recette et l'Audit ISO en un seul flux. Sans imposer un vieux template rigide.

---

## Conclusion : Le Piège à Marge (Moat)
L'intelligence de cette stratégie est que chaque fonctionnalité alimente les autres.
L'OCR alimente l'inventaire. L'inventaire alimente la "Smart Prep". La "Smart Prep" génère le rapport HACCP (Self-Audit). Le rapport HACCP justifie la non-amende (Le pitch initial du Bot OSINT).

**RiveHub n'est plus un outil logiciel ; c'est un ingénieur des procédés de cuisine en boîte.**
