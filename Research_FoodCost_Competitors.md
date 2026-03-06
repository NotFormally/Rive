# Analyse Concurrentielle : Logiciels de Food Cost & OCR

Ce document répond à la demande d'analyse des concurrents majeurs dans le domaine du Food Cost et de la gestion d'inventaire, qualifiés de "vieux logiciels monolithiques" dans notre stratégie.

## L'Âge des Capitaines (Fondations)
Il est crucial de comprendre que la vaste majorité des leaders actuels ont été conçus avec les technologies du début des années 2010.
*   **Restaurant365 :** Fondé en **2011**. C'est le dinosaure du groupe, agissant presque comme un ERP complet (incluant la comptabilité générale).
*   **MarketMan :** Fondé en **2013** (à Tel Aviv, maintenant basé à NYC).
*   **MarginEdge :** Fondé en **2015** par des vétérans de la restauration.
*   **xtraCHEF :** Fondé en **2015**, racheté par Toast en 2021 pour ~50M$.

**Le Positionnement de Rive :** Ces plateformes ont entre 10 et 14 ans. Leurs backends ont été construits bien avant l'ère des architectures modernes Serverless (Supabase), de l'Edge Computing, et surtout, bien avant l'avènement des LLMs. Leur dette technique est massive. Rive arrive avec une architecture 2026, immensément plus rapide, moins lourde à opérer, et nativement augmentée par l'IA.

---

## 1. Restaurant365
**Le Poids Lourd (L'ERP de la restauration)**
*   **Fonctionnalités clés :** Plateforme "tout-en-un". Elle intègre la comptabilité de base (Account Payable, grand livre), les inventaires, le calcul du Food Cost, et même des modules de planification des horaires (Scheduling). Elle se connecte directement aux banques.
*   **La Cible :** Les grands groupes, les franchises multi-sites avec des équipes comptables dédiées.
*   **Faiblesse (L'opportunité pour Rive) :** C'est un monstre de complexité. L'interface (UI/UX) est notoirement lourde et demande une longue formation. C'est un logiciel pour les "comptables d'entreprise", pas pour le Chef exécutif qui finit son service à 23h.
*   **L'avantage Rive :** Une UX hyper-fluide (le Dashboard "Sonar"), pensée pour le terrain, sans la lourdeur d'un module comptable complet.

## 2. MarginEdge
**Le Concurrent le Plus Direct (Le Leader du Mid-Market)**
*   **Fonctionnalités clés :** Très fort sur l'OCR. Ils promettent un traitement des factures en 24-48h. Ils trackent les coûts en temps réel, gèrent les recettes dématérialisées avec photos/vidéos en cuisine, et paient les factures (Bill Pay) directement depuis la plateforme.
*   **La Cible :** Les restaurants indépendants performants et les petits groupes.
*   **Faiblesse (L'opportunité pour Rive) :** Leur promesse de "24 à 48 heures" pour le traitement OCR indique qu'ils s'appuient massivement sur un "Human-in-the-Loop" (des opérateurs humains qui vérifient/corrigent la donnée en sous-traitance) sur des architectures vieillissantes.
*   **L'avantage Rive :** L'architecture "Hybrid OCR" (Déterministe + LLM) de Rive permet un traitement presque instantané sans dépendre d'une armée de vérificateurs humains, réduisant massivement vos coûts d'opération (COGS) par rapport aux leurs, et permettant une remontée d'information (alertes de prix) en temps réel.

## 3. xtraCHEF (by Toast)
**L'Avantage de l'Écosystème Fermé**
*   **Fonctionnalités clés :** Automatisation des comptes fournisseurs, Food Cost, gestion des fournisseurs.
*   **La Cible :** Principalement les clients qui utilisent déjà le POS Toast.
*   **Faiblesse (L'opportunité pour Rive) :** Depuis le rachat par Toast, l'outil est devenu un moyen de retenir les clients dans l'écosystème Toast. Le développement de fonctionnalités "agnostiques" (pour d'autres POS) ralentit.
*   **L'avantage Rive :** Rive est agnostique. En permettant des imports par API (Square, Lightspeed) ou par simple parseur CSV natif, Rive parle à tous les restaurants qui refusent de s'enfermer chez Toast ou qui utilisent des POS européens/canadiens alternatifs.

## 4. MarketMan
**Le Spécialiste de la Commande**
*   **Fonctionnalités clés :** Excellent dans la gestion des flux de commandes fournisseurs (Purchase Orders), gestion de la chaîne d'approvisionnement, calculs de COGS (Cost of Goods Sold).
*   **La Cible :** Restauration rapide, dark kitchens, chaînes avec commissariats centraux (production centralisée).
*   **Faiblesse (L'opportunité pour Rive) :** Plus axé sur l'Opérationnel de chaîne que sur l'intelligence fine pour la haute gastronomie.
*   **L'avantage Rive :** Le "Branding" et l'Ontologie. MarketMan est utilitaire. Rive se positionne comme de "L'Intelligence Liquide" pour le "Capitaine". L'interface cognitive de Rive (Liquid Intelligence, Sonar) séduit le restaurateur axé sur la qualité et l'expérience.
