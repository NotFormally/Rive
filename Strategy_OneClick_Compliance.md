# Le "One-Click Compliance" Workflow : Automatisation HACCP par RiveHub

Ce document formalise la fonctionnalité clé (« *Bingo c'est là que je veux creuser mon créneau* ») qui positionnera RiveHub comme le cheval de Troie indispensable dans les cuisines modernes.

L'objectif est d'éliminer la fragmentation stupide entre la gestion comptable (Food Cost) et la conformité sanitaire (HACCP).

## 1. Le Problème Historique
Aujourd'hui, quand une livraison de saumon arrive dans un restaurant :
1.  Le cuisinier vérifie la température et la note sur un registre HACCP papier (ou dans une app comme *Jolt*).
2.  Le cuisinier range le saumon.
3.  Le manager prend la facture papier, y jette un coup d'œil, et la met dans un bac "À Comptabiliser".
4.  À la fin de la semaine, le propriétaire ou un comptable prend la facture et la tape manuellement à la main (ou via MarginEdge) pour ajuster son inventaire ou son Food Cost.
5.  *Pendant une inspection* : L'inspecteur voit un filet de saumon dans le frigo et demande : "D'où vient ce lot spécifique et quand a-t-il été reçu ?". Panique. Le Chef cherche le registre papier, puis fouille dans le classeur des factures pour prouver la chaîne de froid du fournisseur.

## 2. La Spécification Produit : Le "One-Click Compliance" Workflow

RiveHub fusionne l'étape financière (Payer la facture) et l'étape sanitaire (Prouver la salubrité) dès la première seconde : **The Point of Receiving**. 

L'Action Initiale Numéro 1 en restauration n'est pas de cuisiner, c'est de *recevoir* la marchandise. C'est là que RiveHub s'insère.

### Le Pipeline UX/Tech Fluiide (Étape par Étape)

#### ÉTAPE A : Le Déclencheur Hyper-Rapide (Au quai de déchargement)
*   **Action :** Le camion Sysco/Gordon arrive à 6h00 du matin. Le sous-chef reçoit une pile de 5 factures froissées. Il ouvre l'application mobile RiveHub, clique sur le gros bouton central **"Scan & Receive"**. Il prend en photo les 5 factures à la suite (Batch Scanning).
*   **Friction :** Nulle. Ça prend 15 secondes.
*   **Tech en arrière-plan :** Le moteur *Hybrid OCR* (Déterministe Cloud AI + LLM Structuré) s'active. Le JSON est généré en moins de 5 secondes par facture.

#### ÉTAPE B : L'Extraction Tri-Directionnelle (La Magie RiveHub)
Dès que le JSON est validé, RiveHub ventile la donnée dans trois cerveaux distincts, sans aucune action humaine requise :

1.  **Le Cerveau Financier (AP & Food Cost) :** 
    *   RiveHub identifie : Fournisseur = Ferme Saint-Vincent. Total = 450$. Article 1 = Bœuf Haché (10kg à 8$/kg). Article 2 = Poulet (5kg à 10$/kg).
    *   *Action automatisée :* L'inventaire théorique est incrémenté. S'il y a une variation de prix (Le bœuf est passé de 7.50$ à 8.00$), une notification push (Alerte Dérive des Coûts) est préparée pour le "Daily Briefing" du propriétaire.

2.  **Le Cerveau Opérationnel (DLUO & Traçabilité IN) :** 
    *   Le système sait (via son ontologie IA) que le "Poulet Frais" a une durée de vie légale stricte (ex: 3 jours après réception). 
    *   *Action automatisée "ZeroTouch" :* L'application téléphone envoie instantanément une requête Bluetooth à l'imprimante thermique de la zone de réception. **ZZZZIP**. 2 étiquettes sortent toutes seules : "Poulet Frais - Reçu: 26 Oct - DLUO: 29 Oct - Lot: S-1029". Le commis les colle sur les bacs. *La traçabilité entrante est faite.*

3.  **Le Cerveau Légal (Log HACCP Actif) :** 
    *   L'intelligence identifie un produit à "Contrôle de Température Obligatoire" (Viandes/Poissons).
    *   *Action UX :* Avant de fermer l'écran "Scan & Receive", un Pop-up "Audit Rapide" bloquant apparaît sur le téléphone du commis : 
        *   *"Poulet Frais détecté (Sysco). Température de réception ?"*
    *   *Hardware :* Si le commis a sa sonde Bluetooth (ex: Testo), il pique le poulet, clique sur le thermomètre, et "3.2°C" s'inscrit seul. Sinon, il tape "3". Il valide. *Le Log de Réception HACCP est rempli et horodaté avec la signature numérique du commis.*

### 3. Le "Mode Panique" Récréatif : L'Inspection Sanitaire
La plus grande valeur d'un logiciel se démontre quand le stress de l'utilisateur est à 100%. L'inspecteur (MAPAQ, DOH) arrive à l'improviste un vendredi à 18h30.

*   **L'Épreuve :** L'inspecteur ouvre le frigo de la station "Grill". Il trouve un bac de *Poulet Mariné*.
*   **Inspecteur :** "Prouvez-moi la chaîne de froid et la provenance de ce poulet." (Historiquement : 30 minutes de recherches frénétiques dans des classeurs pendant le coup de feu).
*   **La Scène RiveHub :** 
    1.  Le Chef sort sa tablette ou son téléphone. Il va dans le module **Sonar Compliance**.
    2.  Il tape "Poulet Mariné" ou il scanne simplement le QR code/code-barres sur l'étiquette RiveHub du bac.
    3.  L'écran affiche "L'Hologramme de Traçabilité" (L'arbre généalogique du poulet) :
        *   -> **Aujourd'hui 14h00 :** Préparé par "Jose" (Photo de self-audit de sa station propre). Recette : Fiche Technique #45.
        *   -> **Hier 19h00 :** Sorti du congélateur pour décongélation lente (Log de température du frigo #2 valide à 2°C).
        *   -> **Lundi 6h00 (La Source) :** Reçu de Sysco. Température : 3.2°C. **Lien Cliquable vers la Facture Originale HD (OCR)**.
*   **Conclusion :** L'audit prend 12 secondes. L'inspecteur est ébahi. Le rapport est vierge. Le propriétaire idolâtre RiveHub.

### 4. Conclusion Stratégique de l'Acquisition
Ce workflow est votre **Bélier de Siège (Battering Ram)**. 
Ne vendez pas "Un meilleur logiciel d'inventaire" (C'est chiant, personne ne veut faire des inventaires). 
Vendez : **"Automatisez votre conformité HACCP en prenant simplement vos factures en photo. Protégez votre restaurant des amendes, et au passage, laissez l'IA gérer vos marges (Food Cost) et vos étiquettes."**
C'est une proposition de valeur irrésistible car elle enlève de la douleur immédiatement.
