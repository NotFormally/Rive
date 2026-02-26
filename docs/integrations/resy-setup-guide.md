# Guide d'Intégration Resy : Obtenir vos Identifiants (API Key & Auth Token)

Resy ne proposant pas d'API publique ouverte aux développeurs tiers, l'intégration avec Rive nécessite que vous récupériez manuellement vos identifiants de connexion depuis votre navigateur web.

Ce guide vous explique étape par étape comment récupérer votre **Clé d'API (API Key)** et votre **Jeton d'Authentification (Auth Token)** pour les connecter à Rive.

---

## Étape 1 : Se connecter à Resy (Dashboard)
1. Ouvrez le navigateur **Google Chrome** sur votre ordinateur (recommandé).
2. Connectez-vous à votre interface de gestion de restaurant : [https://os.resy.com/](https://os.resy.com/) (ou l'URL de votre tableau de bord Resy habituel).
3. Connectez-vous avec vos identifiants administrateur.

## Étape 2 : Ouvrir les Outils de Développement (Developer Tools)
Une fois sur la page principale de votre tableau de bord Resy :
1. Faites un **clic droit** n'importe où sur la page.
2. Cliquez sur **"Inspecter"** (ou "Inspect" en anglais).
3. Un nouveau panneau va s'ouvrir sur la droite ou en bas de votre écran. Cliquez sur l'onglet **"Network"** (ou "Réseau").
   * *Astuce : S'il y a beaucoup d'informations affichées, cliquez sur l'icône "Clear" (le petit symbole "interdit" 🚫 ou la poubelle) en haut à gauche de ce panneau pour faire le vide.*

## Étape 3 : Intercepter une requête réseau
1. Laissez le panneau "Network" ouvert.
2. **Rafraîchissez la page web** (touche F5 ou Cmd+R sur Mac).
3. Le panneau "Network" va se remplir de nombreuses lignes.
4. Dans la barre de filtre (Filter) en haut du panneau Network, tapez `api.resy.com`.
5. Cliquez sur l'une des lignes qui s'affichent en bas (par exemple, une ligne nommée `settings` ou `details` ou `reservations`).

## Étape 4 : Extraire les clés (Headers)
1. Après avoir cliqué sur une ligne, un volet s'ouvre sur le côté droit avec plusieurs onglets (Headers, Preview, Response...).
2. Restez dans l'onglet **"Headers"** (En-têtes).
3. Faites défiler vers le bas jusqu'à la section nommée **"Request Headers"** (En-têtes de requête).
4. Cherchez les deux lignes suivantes :

   * **La Clé d'API** : Cherchez la ligne `Authorization: ResyAPI api_key="VOTRE_CLE_ICI"`.
     * *Copiez seulement le texte contenu à l'intérieur des guillemets.* (C'est souvent une longue chaîne de caractères).
   
   * **Le Jeton d'Authentification** : Cherchez la ligne `x-resy-auth-token: VOTRE_TOKEN_ICI`.
     * *Copiez la valeur entière du token.*

## Étape 5 : Connecter Rive
1. Retournez sur votre interface **Rive**, dans la page **Paramètres > Intégrations Réservations**.
2. Cliquez sur **Connecter Resy**.
3. Dans le champ demandé, vous devez coller vos deux clés séparées par le symbole "pipe" `|` (la barre verticale, que l'on obtient souvent avec Alt+Maj+L sur Mac ou AltGr+6 sur PC).

**Format attendu :**
`CLE_API|TOKEN_AUTH`

*Exemple à ne pas copier :*
`SUZJ79SKDN29384JDKSNDK|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. Cliquez sur **Valider la connexion**.

---
*Note technique : Le `x-resy-auth-token` (lié à votre session utilisateur) peut expirer après un certain temps (généralement quelques mois, ou si vous vous déconnectez complètement de Resy). Si Rive cesse de se synchroniser, il faudra répéter cette opération pour récupérer un nouveau token.*
