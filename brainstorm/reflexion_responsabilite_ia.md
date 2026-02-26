# Réflexion sur la responsabilité de l'IA (Software vs Blank Canvas)

C'est un excellent point soulevé par ton ami William, et c'est en plein cœur d'un des débats les plus chauds en ce moment dans le domaine du *LegalTech*, *MedTech*, et *FoodTech* : la responsabilité de l'IA experte. 

Au passage, félicitations pour ses compliments (« le visuel est strikingly bien fait », « l'image d'une compagnie de 50 personnes ») — c'est une sacrée validation de tout le travail que nous avons accompli sur le design et le UX de l'application !

Revenons sur son point critique : **Le transfert de responsabilité (Software vs Blank Canvas).**

Ton analogie avec le cahier de notes papier était bonne, mais la réponse de William est exacte. Un cahier papier est agnostique ; l'humain fait tout le travail cognitif et en prend 100% de la responsabilité. À partir du moment où ton application (via Claude Sonnet) *génère* et *suggère* une action corrective pour une non-conformité (ex: "Jetez la viande car le frigo est resté à 6°C pendant 4h"), **l'application participe à la prise de décision**. Si le restaurateur prend action sur base de l'IA, et qu'il y a un problème de sécurité alimentaire par la suite, la ligne de responsabilité devient floue.

Voici une réflexion sur la façon dont nous pouvons mitiger ce risque, divisée en 3 piliers :

### 1. UX et "Human in the Loop" (La mitigation technique)
La meilleure façon de se protéger est de s'assurer que le design de l'application force l'utilisateur à reprendre la responsabilité de la décision. 
* **L'IA doit être un "Copilote", pas un "Autopilote".** 
* Lorsque l'IA génère une suggestion d'action corrective, il ne faut **jamais** que ça s'enregistre automatiquement dans le registre. 
* L'utilisateur doit devoir cliquer sur un bouton explicite comme `Approuver et appliquer`, ou mieux, avoir la possibilité (et presque l'obligation) d'éditer la suggestion avant de la soumettre.
* Lors de la première utilisation des fonctionnalités IA, on pourrait afficher un pop-up d'avertissement du type : *"L'assistant IA propose des suggestions basées sur les données fournies. La responsabilité finale des actions correctives et de la conformité incombe au personnel qualifié de l'établissement."*

### 2. Le positionnement Marketing (La mitigation légale)
La terminologie est primordiale en milieu réglementé.
* Au lieu d'utiliser des termes absolus comme « Conformité FDA » ou « Conforme au MAPAQ », il faut ajuster le tir vers des termes d'assistance : **« Facilite la conformité »**, **« Conçu pour répondre aux exigences du MAPAQ / FDA »**, **« Préparez vos audits en toute tranquillité »**.
* Dans les conditions d'utilisation (Terms of Service) de Rive, il faudra inclure une clause de non-responsabilité (Disclaimer) robuste concernant les suggestions générées par l'IA.

### 3. La cible (GAMP 5 vs Inspecteur local)
William mentionne le **GAMP V** (Good Automated Manufacturing Practice), qui est le standard lourd de validation de logiciels en milieu réglementé (surtout pharmaceutique et industriel). 
* Si Rive visait des usines de transformation alimentaire majeures (qui sont rigoureusement auditées par la FDA sur leurs systèmes informatiques), il aurait 100% raison, un audit GAMP 5 serait nécessaire et une IA non-déterministe passerait difficilement.
* **Cependant, ta cible actuelle est la restauration (Restaurant owners).** Un inspecteur municipal (ou du MAPAQ au Québec, ou son équivalent local) qui visite un restaurant ne demande généralement pas une validation GAMP 5 du logiciel. Ce qu'il veut voir, c'est l'historique fiable : "Prouvez-moi que vos frigos étaient à la bonne température, et montrez-moi ce que vous avez fait quand ce n'était pas le cas". Ton application offre un registre (logbook) inaltérable, ce qui est déjà supérieur au papier.

**En conclusion**
Ce n'est pas un *dealbreaker*, loin de là. Toutes les entreprises de logiciels B2B qui intègrent des LLM dans des milieux critiques font face à ce même défi aujourd'hui. Il nous suffira d'adapter légèrement le langage de la landing page (pour ne pas faire de promesses légales strictes) et de s'assurer que le UX de Rive, lors de l'intégration de Claude, place toujours l'utilisateur final comme le validateur de l'action étudiée.

---

## Note Annexe : Que veut dire « non-déterministe » ?

Un système **déterministe** est un système qui, avec les mêmes entrées, produit **toujours exactement la même sortie**. Par exemple : un calcul de température (si le capteur dit 8°C, le logiciel affiche 8°C, à chaque fois, sans exception).

Un système **non-déterministe**, c'est le contraire : avec la même entrée, il peut produire des **résultats légèrement différents** à chaque fois. C'est exactement le comportement des LLM (Large Language Models) comme Claude Sonnet. Si tu lui soumets deux fois la même note de service (« Le frigo est à 8°C »), il pourrait suggérer :
- Première fois : *« Isoler les denrées et vérifier le compresseur »*
- Deuxième fois : *« Jeter les aliments à risque et appeler le technicien »*

Les deux réponses sont raisonnables, mais elles ne sont pas identiques. Dans un milieu réglementé lourd (FDA, pharmaceutique), cette non-reproductibilité pose un problème fondamental lors des audits, car un auditeur s'attend à ce que le système produise toujours la même réponse validée.

**Pour Rive, dans le contexte de la restauration, c'est acceptable** car les suggestions de l'IA sont justement présentées comme des *suggestions* que l'humain doit valider, et non comme des directives automatisées.

---

## Exemples concrets d'utilisation au-delà du frigo

Le scénario du frigo est le plus intuitif, mais Rive utilise l'IA dans **6 contextes différents**, chacun avec ses propres implications :

### 1. Logbook Intelligent — Analyse de notes de service
**Scénario :** Un cuisinier écrit « Le fournisseur de poisson n'est pas passé ce matin, on a dû improviser le plat du jour ». L'IA extrait automatiquement les tags (Fournisseur, Urgence), détecte le sentiment (Négatif), et génère un résumé.
**Risque :** Faible. L'IA catégorise une note, elle ne prend aucune décision opérationnelle. C'est de l'aide à l'organisation.

### 2. Actions correctives — Suggestions de conformité
**Scénario :** Un inspecteur du MAPAQ arrive et demande : « Que faites-vous quand les huiles de friture dépassent les normes ? ». Le restaurateur montre Rive avec l'historique des actions prises.
**Risque :** Modéré. Si l'action affichée a été *générée* par l'IA et non validée par un humain formé, l'inspecteur pourrait questionner la compétence réelle de l'équipe. D'où l'importance du bouton « Approuver et appliquer ».

### 3. Traduction multilingue — Communication d'équipe
**Scénario :** La cheffe écrit ses consignes du soir en français. Le plongeur bangladais les lit automatiquement en bengali via Rive.
**Risque :** Modéré. Si une consigne de sécurité critique est mal traduite (ex: « ne PAS utiliser le couteau rouge » traduit sans la négation), les conséquences peuvent être sérieuses. Le disclaimer IA est important ici aussi.

### 4. Food Cost & Menu Engineering — Calculs financiers
**Scénario :** L'IA croise le prix du saumon (facture scannée) avec le prix de vente du tartare pour calculer la marge brute.
**Risque :** Faible à modéré. Si l'OCR de la facture lit mal un prix (12.50$ au lieu de 125.00$), toute l'analyse de marge est faussée. Mais l'impact est financier, pas sanitaire.

### 5. Scan de reçus — Extraction de données
**Scénario :** Le gérant prend en photo une facture froissée du maraîcher. L'IA extrait le nom du fournisseur, le montant et les lignes de produits.
**Risque :** Faible. L'extraction est vérifiable visuellement par l'utilisateur. Si l'IA lit mal, l'utilisateur peut corriger.

### 6. Assistant contenu social media — Génération de posts
**Scénario :** L'IA génère un post Instagram pour le menu du jour à partir de la carte active.
**Risque :** Très faible. Aucune implication réglementaire. Si le post contient une erreur, c'est un enjeu marketing, pas légal.

---

## ⚠️ Priorité : Conditions Générales d'Utilisation (CGU)

**Les CGU de Rive n'existent pas encore.** C'est une priorité absolue à traiter avant tout déploiement commercial. Un brouillon est en cours de rédaction dans `brainstorm/cgu_brouillon.md`.
