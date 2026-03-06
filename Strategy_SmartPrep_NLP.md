# Conceptualisation : Le Module "Smart Prep & NLP" de RiveHub

Ce document détaille la vision mature et "Empowering" du pôle RH/Opérationnel de RiveHub, visant à résoudre la friction linguistique et technique en cuisine sans infantiliser les employés. L'objectif est de créer un environnement de travail harmonieux et responsable.

## 1. La Philosophie : "L'Empowerment Silencieux"
Les logiciels RH traditionnels traitent souvent les employés de cuisine (plongeurs, commis, préposés à la préparation) comme des ressources à traquer (punch-in/punch-out). RiveHub les traite comme des artisans qui ont besoin des bons outils pour exceller, indépendamment de leur langue maternelle ou de leur timidité à poser des questions.

La prémisse : **Une erreur d'exécution (ex: une brunoise trop grosse, une sauce trop salée) n'est presque jamais malveillante ; c'est un déficit de communication ou de standardisation.**

## 2. Spécification Fonctionnelle : Les Fiches Techniques "Smart Prep"
La fiche technique classique (Excel, tachée, collée sur un mur, écrite en français technique) est morte. Voici le fonctionnement de la nouvelle génération.

### A. L'Expérience Créateur (Interface Chef / Sous-Chef)
L'objectif est de réduire le temps de création d'une fiche de 30 minutes à 3 minutes.
*   **Création Multimodale Sans Friction :** Le Chef n'a pas besoin de taper sur un clavier. Il utilise l'application mobile RiveHub en mode "Création" :
    *   **Dictée Vidéo/Audio :** Il filme ses mains en train de lever un filet de bar et dicte : *"Tu lèves le filet, tu gardes la peau, portion de 160 grammes. La parure va au bouillon. Température à cœur cible 48°C."*
*   **Structuration Magique par l'IA (LLM Parseur) :** Le modèle d'IA natif de RiveHub traite l'audio et la vidéo instantanément et génère une fiche structurée :
    *   *Faisabilité Technique :* Le flux audio est transcrit par un modèle Speech-to-Text ultra-rapide (ex: **OpenAI Whisper API** ou Deepgram). Le texte brut (et quelques frames de la vidéo) est envoyé à **Claude 4.6 Sonnet** ou **GPT-4o** avec un prompt d'extraction JSON strict pour mapper les ingrédients et les étapes.
    1.  **Ingrédients & Rendement :** "Bar (Loup de mer), Portion cible: 160g, Température cible: 48°C". Le système lie automatiquement "Bar" à l'inventaire existant pour décrémenter le stock.
    2.  **Étapes Séquentielles :** Le discours est nettoyé des hésitations et formaté en étapes claires "Étape 1 : Lever... Étape 2 : Portionner...".
    3.  **Extraction des Points Critiques (CCP) :** L'IA détecte "48°C" comme un Point de Contrôle Critique et crée automatiquement un champ de validation HACCP dans la fiche.

### B. L'Expérience Exécuteur (Interface Commis / Cuisinier)
Le cuisinier arrive à sa station. Il utilise une tablette fixée au mur ou son propre smartphone.
*   **Traduction Inclusive Immédiate (Le "Babelfish" Culinaire) :** L'interface reconnaît le profil réseau de "Jose" (préférence : Espagnol, niveau de lecture : visuel). Toute la fiche dictée par le chef francophone apparaît dans un espagnol culinaire impeccable. Les termes techniques régionaux (ex: "Mirepoix") sont expliqués via des infobulles ou le GIF généré depuis la vidéo originale du Chef.
*   **Le Calculateur de Rendement Dynamique :** Aujourd'hui, on ne fait pas 20 portions, mais 65. Le commis entre "65" dans le champ cible de la fiche. RiveHub recalcule instantanément tous les grammages nécessaires de la recette de base (fini la règle de trois mentale erronée qui ruine 10kg de marchandise).
*   **Navigation "Mains Sales" :** Le mode exécution utilise des boutons géants (Zone de frappe "Fat Finger") ou la commande vocale ("Rive, étape suivante") pour éviter de graisser l'écran de la tablette.

---

## 3. Élaboration : La Gamification Sociale et Mature (L'Accountability)
Il ne s'agit *surtout pas* de donner des "Badges Étoile d'Or" enfantins ou des classements punitifs. L'approche RiveHub est celle du **Mérite Silencieux** et de la responsabilisation professionnelle. 

### A. La Validation Virtuelle (Self-Audit & Transfert de Fierté)
La micro-gestion (le Chef qui scrute chaque bac) détruit la confiance. RiveHub remplace la surveillance par la "Documentation de la Fierté".
*   **Le Concept de Fin de Quart (The Check-Out) :** À la fin de la préparation de sa "Mise en Place", plutôt que d'attendre l'approbation du Chef, le cuisinier coche les dernières étapes de sa Fiche Technique RiveHub sur la tablette.
*   **La Preuve Cryptographique (Self-Audit) :** L'application lui demande de *prendre une photo finale* de sa station ou de la chambre froide (les bacs bien alignés, propres, avec les étiquettes DLUO visibles).
*   **La Validation asynchrone :** Cette photo, horodatée, est loggée dans le "Station Report" du cuisinier. Le Chef n'a plus à être là à 16h00. Il peut vérifier ce rapport sur son "Sonar Dashboard" à distance. Cela transfère la fierté de la réalisation à l'employé ("J'ai dominé ma station, voici la preuve").

### B. Le Passeport de Compétences (Skills Matrix) et le Mentorat
L'application mesure indirectement la maîtrise, transformant une contrainte opérationnelle en un **levier de rétention RH puissant**.
*   **Certification Interne :** Si Maria exécute la fiche "Sauce Hollandaise" sans aucune divergence d'inventaire rapportée et avec 5 audits visuels (photos) consécutifs parfaits, le système lui accorde le statut algorithmique de "Certified" pour cette tâche.
*   **L'Empowerment Pédagogique :** Le système suggère alors au Chef : *"Pour la prochaine intégration d'un nouveau, Maria est la plus qualifiée pour former sur la station Sauce."* La gamification se traduit ici par du prestige interne, du respect, et un argument concret pour négocier son salaire (Données probantes).
---

## 4. Ce que RiveHub apprend de la concurrence : Intégration UX
L'analyse de **SafetyCulture** (spécialiste QA ISO) et de **Squadle** (automatisation des franchises) révèle la direction exacte que doit prendre notre Interface Utilisateur (UX) par rapport aux vieux logiciels.

### A. La leçon de SafetyCulture : L'Audit Dynamique (No-Code Form Builder)
*   **Le Constat :** SafetyCulture est brillant car ils ne forcent pas les clients dans une boîte. Ils offrent un constructeur de formulaires no-code extrêmement puissant.
*   **Implémentation RiveHub (La Stratégie de Création) :** Les cuisines modernes ont des processus ultra-personnalisés (Fermentation sous-vide, affinage de viandes sur 40 jours). RiveHub ne doit pas avoir un "Module HACCP statique". L'outil de création de fiches doit permettre au Chef d'ajouter des blocs "Log Temperature", "Upload Ph Level Photo", "Scan Barcode" d'un simple glisser-déposer. 
    *   *Faisabilité Technique :* Le front-end utilisera une librairie comme **React Flow** ou un constructeur JSON propriétaire (ex: basé sur `react-hook-form` dynamique). Le back-end stockera la structure de ces formulaires personnalisés dans des colonnes `JSONB` ultra-flexibles sur Supabase, évitant de casser le schéma SQL à chaque nouveau type d'audit inventé par un Chef. La Fiche Technique *devient* l'Audit de Qualité. On fusionne la Recette et la Compliance en un seul écran.

### B. La leçon de Squadle : L'Automatisation "ZeroTouch"
*   **Le Constat :** L'outil de Squadle est génial car le cuisinier n'a (presque) pas besoin de toucher l'écran pour être conforme. Moins l'employé tape de données, plus la donnée est intègre.
*   **Implémentation RiveHub (Hardware Agnostic Bluetooth) :** 
    1.  **L'Étiquetage Invisible :** *Le bouton "J'ai fini la préparation" à la fin de la Fiche Technique doit être la SEULE action requise pour générer la conformité.* Dès le clic, RiveHub calcule la Date Limite d'Utilisation Optimale (DLUO) selon les standards locaux et envoie l'ordre d'impression direct par Wifi/Bluetooth à la petite imprimante thermique de la cuisine. Le cuisinier colle, il ne réfléchit pas.
        *   *Faisabilité Technique :* Utilisation de l'API **Web Bluetooth** (si l'app est PWA) ou d'un pont réseau local pour envoyer des commandes **ESC/POS** standardisées directement aux imprimantes thermiques populaires (Epson, Star Micronics, Zebra) sans passer par des clics sur des boîtes de dialogue du système d'exploitation.
    2.  **Sonde de Température Connectée :** Lors des refroidissements rapides (Blast Chiller records), RiveHub s'intègre via l'API des thermomètres Bluetooth standards (ex: ThermoWorks BlueTherm). La tablette affiche *"Validez le refroidissement à < 4°C"*, le cuisinier pique le produit, et la valeur s'écrit toute seule dans l'app, validant le point critique HACCP.

### En Conclusion
L'objectif de RiveHub n'est pas de fliquer le personnel. C'est de fournir un OS de cuisine tellement fluide, clair et aidant que *ne pas* l'utiliser semble archaïque. C'est l'anti-friction absolue, permettant au Chef de redevenir un Leader Culinaire garantissant ses standards de n'importe où sur Terre.
