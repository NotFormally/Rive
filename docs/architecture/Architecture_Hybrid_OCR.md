# Architecture OCR Hybride de RiveHub : Déterministe + LLM Structuré

Pour répondre à l'ambition de bâtir une architecture de pointe d'extraction de données de bout en bout (exceptionnellement fluide et fiable), ce document décrit le modèle architectural "Hybrid OCR" de nouvelle génération, conçu spécifiquement pour le traitement des factures fournisseurs dans la restauration (documents froissés, maculés, écritures mixtes).

## L'Évolution du Traitement Documentaire (Document AI)
Le système ne doit se baser ni sur de vieux parseurs de *templates* (qui cassent dès qu'un fournisseur change la mise en page), ni purement sur des "Multimodal Vision-Language Models (VLM)" (comme Google Gemini 2.5 Pro ou Qwen-VL Max), car ces derniers, bien que très puissants, souffrent parfois de "hallucinations" – une hérésie fatale dans un contexte d'audit et de comptabilité. Il faut absolument se prémunir contre l'invention de données financières par l'IA.

La solution de pointe (utilisée par les FinTechs de nouvelle génération) est **L'Architecture Hybride Déterministe + Probabiliste (JSON Extraction Pattern)**.

---

## Les 5 Phases du Moteur RiveHub (Le PIPELINE)

### Phase 1 : Ingestion et Restauration d'Image (Preprocessing)
Les Sous-Chefs prennent des photos floues, de biais, sur des factures tachées de beurre.
1.  **Redressement & Contrast Enhacement :** Scripts rapides (ex. OpenCV) pour aplatir l'image, augmenter la netteté et transformer les fonds sales en fonds uniformes clairs.
2.  **Conversion :** Tout document PDF/Word hybride est rastérisé en image d'alta qualité.

### Phase 2 : Le Moteur OCR Déterministe (Le "Lecteur")
C'est ici que l'on extrait le "texte brut" spatialisé avec une absolue fiabilité géométrique, sans hallucination.
1.  **Technologie de Pointage :** **Google Cloud Document AI (Invoice Parser) - SÉLECTIONNÉ.**
    *   *Raison du choix (Lock-in effectif) :* Bien qu'AWS Textract soit très robuste géométriquement, Google Document AI offre une supériorité sémantique indéniable sur la reconnaissance d'entités métier complexes (grâce au Knowledge Graph de Google) et excelle sur les factures alimentaires multilingues. Son modèle "Invoice Parser" pré-entraîné justifie d'ancrer notre architecture sur la plateforme GCP pour la phase de vision par ordinateur.

### Phase 3 : L'Extraction Sémantique par Modèle de Langage (LLM - Le "Cerveau")
C'est le génie du système. Le texte brut et le mapping géométrique (JSON de la Phase 2) sont envoyés au LLM. Ce n'est pas le LLM qui lit l'image, c'est le LLM qui *comprend* le canevas de texte.
1.  **Le Prompt Système d'Extraction (Strict JSON-Schema Output) :** Le LLM (**Anthropic Claude 4.6 Sonnet**, reconnu pour sa supériorité absolue en respect de schémas JSON complexes et son raisonnement analytique) est configuré avec l'option "Structured JSON Outputs" strict.
2.  **La Consigne (Le Parsing) :** « En fonction du texte brut fourni, dresse la correspondance pour extraire les entités suivantes: Nom Fournisseur, Numéro de Facture, Date, [Vecteur d'Articles : {Description, Quantité, Unité de Mesure, Prix Unitaire, Prix Total}], Taxes, Total Général. »
    *   *(Note sur la base de données : RiveHub possède déjà des tables de base comme `invoices` et `food_cost` dans Supabase. Cependant, pour ingérer ce vecteur d'articles précis de façon normalisée, il faudra s'assurer que notre schéma relationnel inclut une table détaillée `invoice_line_items` parfaitement liée au catalogue maître d'ingrédients. Les prochaines migrations SQL devront blinder ce point).*
3.  **La Magie :** Si le petit fournisseur local écrit "Tom. Roma x25lb .... 45$", le LLM comprend, basé sur la proximité textuelle, que c'est un ingrédient Tomate, quantité 25, unité lbs, prix 45$. Aucun template pré-arrangé n'est nécessaire.

### Phase 4 : The "Challenger Pattern" & Validation (Le Garde-Fou)
La faille d'un LLM est qu'il "suppose" parfois. Pour garantir le Food Cost, Rive doit valider.
1.  **L'Intelligence Métier (Business Logic Rules) :** Un script déterministe valide ce que le LLM a renvoyé :
    *   Le "Total Général" correspond-il mathématiquement à *[Somme(Prix Total Ingénieurs) + Taxes + Frais]* ?
    *   Si OUI -> Phase 5.
    *   Si NON -> Le système passe au "Challenger Pattern".
2.  **Le Challenger Pattern :** C'est un processus en deux passes. L'alerte déclenche une deuxième requête (à un LLM différent, moins coûteux, ou avec un prompt différent) ou déclenche une revue "Human-in-the-Loop" (via le Dashboard utilisateur), en repassant l'anomalie en surbrillance rouge pour la faire approuver par le Chef du RiveHub. (Cela remplace les 24h de MarginEdge par 5 secondes de délai !).

### Phase 5 : Traitement Supabase (Le Pipeline d'Intelligence)
1.  **L'Ingestion Événementielle :** Le JSON parfait et validé est *pushed* (poussé) dans Supabase (votre backend). Les Data-Webhooks identifient si de nouveaux ingrédients ont été ajoutés, ou si le "Prix Unitaire" a dépassé de +5% la moyenne des 3 derniers mois (Alerte de Dérive de Prix).
2.  **Notification :** "Sonar" alerte le gestionnaire dans son application web en temps réel.

### Résumé de l'Avantage Technologique (Moat)
*   **Scalabilité :** Les modèles s'adaptent instantanément à l'écriture manuelle indienne, au fournisseur péruvien de piments et au géant Sysco sans paramétrage manuel d'onboarding de la part du client.
*   **Fiabilité Financière :** La couche déterministe (Phase 2 et 4) bloque les chimères créées par les LLMs.
*   **Vitesse :** L'image va du smartphone au calcul du Food Cost dans le Cloud en 4 secondes. MarginEdge et Restaurant365 prennent souvent des heures ou la nuit. Un avantage déloyal massif pour le "Trojan Horse".
