# Plan d'Intégration des Plateformes de Réservation

Cette liste priorise les plateformes de réservation selon trois critères fondamentaux pour Rive :
1. **Facilité technique d'intégration** (Webhooks ou API REST documentée)
2. **Qualité de la cible de marché** (Haut de gamme, très forte dépendance à la donnée)
3. **Volume de clients potentiels locaux et internationaux**

---

### Priorité 1 : Les Intégrations "Quick Wins" et "High Value"

Ce sont les plateformes avec lesquelles nous devrions développer les "Smart Prep Lists" en premier, car elles nous offrent soit un accès facile (API ouverte), soit un marché parfait.

#### 1. Libro 🇨🇦
* **Cible :** Le marché québécois et canadien (plus de 3000 restaurants).
* **Pourquoi :** API réputée comme l'une des plus accessibles du marché, excellente équipe de support local (Montréal). Parfait pour valider notre "Proof of Concept" (POC) sur le marché domestique de Rive.
* **Complexité technique :** Faible à moyenne. Ils ont l'habitude des intégrations tierces (s'intègrent déjà avec Lightspeed, UEAT).

#### 2. Resy 🇺🇸
* **Cible :** Les tables gastronomiques, chefs étoilés, restaurants hype en Amérique du Nord et Europe.
* **Pourquoi :** C'est le Graal pour le positionnement de la marque Rive. Les restaurants sur Resy (souvent propriétés d'Amex) cherchent l'excellence et l'optimisation des coûts (Labor/Food cost très élevés).
* **Complexité technique :** Moyenne. Documentation API solide, mais depuis le rachat par American Express, l'obtention des clés partenaires peut demander de passer par un processus de validation (business compliance).

#### 3. Zenchef 🇫🇷
* **Cible :** Leader en France et en forte croissance en Europe francophone. Indépendants et gastronomiques.
* **Pourquoi :** Si Rive s'attaque au marché européen, Zenchef est incontournable. Une intégration Zenchef ouvre les portes du marché français de la haute restauration.
* **Complexité technique :** Moyenne. API REST très bien construite et écosystème d'intégrations déjà très développé.

---

### Priorité 2 : Les Poids Lourds Stratégiques

Ces plateformes sont massives, mais souvent plus "corporate" et lentes pour accorder des accès API aux jeunes startups. Elles sont cependant obligatoires à moyen terme pour ne bloquer aucun grand compte.

#### 4. SevenRooms 🌎
* **Cible :** Les grands groupes de restauration, les hôtels boutiques, les casinos (MGM), la grosse machinerie.
* **Pourquoi :** L'outil ultime de "Guest Experience". Les clients SevenRooms dépensent beaucoup en logiciel et gèrent des volumes de réservations colossaux. Ils ont le plus grand besoin de "Smart Prep Lists" précis pour contrôler le gaspillage sur 500+ couverts.
* **Complexité technique :** Élevée. L'API est très riche, mais le programme partenaire est strict.

#### 5. OpenTable 🌎
* **Cible :** Historiquement implanté partout, beaucoup de vieux restaurants, chaînes classiques et quelques très belles tables traditionnelles.
* **Pourquoi :** C'est simplement le plus gros volume mondial.
* **Complexité technique :** Élevée. Système hérité (legacy) par endroits et un programme partenaire (OpenTable Connect) qui fonctionne au compte-goutte.

#### 6. TheFork (LaFourchette) 🇪🇺
* **Cible :** L'outil grand public par excellence en Europe (détenu par TripAdvisor).
* **Pourquoi :** Volumétrie massive en Europe, Espagne, Italie. Moins "haut de gamme" que Resy, mais incontournable pour les brasseries et bistrots.
* **Complexité technique :** Moyenne à élevée selon les régions.

---

### Priorité 3 : Les Plateformes de Niche (Très Haut de Gamme)

Ces plateformes ne représentent pas un volume massif, mais ce sont les "Rolex" de la réservation. Une intégration avec elles est un argument de vente spectaculaire.

#### 7. Tock 🌟
* **Cible :** Restaurants 3 Étoiles Michelin, menus dégustation avec billets prépayés.
* **Pourquoi :** Tock gère l'inventaire au siège près. Si Rive peut prévoir les coûts (Food Cost) d'un menu dégustation vendu 400$ 3 mois à l'avance sur Tock, c'est l'argument marketing ultime de notre module d'Intelligence (Tier 3).
* **Complexité technique :** Moyenne, racheté récemment par Squarespace, documentation évolutive.

#### 8. CoverManager 🇪🇸/🇲🇽
* **Cible :** Le "Resy" espagnol, qui domine massivement l'Espagne, l'Amérique Latine et monte en force en Italie.
* **Pourquoi :** Si Rive (déjà traduit en espagnol) veut percer à Madrid, Barcelone ou Mexico, il n'y a pas d'autre choix que CoverManager, qui équipe la quasi-totalité des restaurants gastronomiques là-bas.

---

### Stratégie Technique "One API" (Le secret pour aller vite)
Au lieu d'intégrer toutes ces API une par une, Rive peut développer **UNE SEULE route Webhook universelle : `/api/reservations/webhook`**.
Ainsi, le restaurant n'a qu'à configurer sa plateforme (Libro ou autre) pour envoyer les événements `RESERVATION_CREATED` ou `RESERVATION_CANCELLED` vers cette URL unique de Rive, et Rive standardise la donnée. Cela nous évite de devoir supplier chaque plateforme pour des clés de lecture.
