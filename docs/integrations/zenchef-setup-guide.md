# Guide d'Intégration Zenchef : Obtenir votre Clé d'API

L'intégration native entre Zenchef et Rive vous permet de synchroniser automatiquement vos réservations, vos plans de salle et l'historique de vos clients. Contrairement à d'autres plateformes, Zenchef propose une API sécurisée mais son accès doit être demandé explicitement à leur service technique.

Ce guide vous explique la marche à suivre pour obtenir votre clé d'API Zenchef en quelques jours.

---

## Prérequis
Pour pouvoir demander un accès à l'API Zenchef, votre restaurant **doit disposer d'un abonnement "Grow"** (ou un équivalent supérieur).
Vous pouvez vérifier l'état de votre abonnement depuis votre espace Zenchef, dans la section "Facturation" (Billing) : 
👉 `https://app.zenchef.com/billing`

Si vous ne possédez pas l'abonnement adéquat, il vous faudra contacter votre chargé de compte Zenchef pour mettre à niveau votre forfait.

---

## Étape 1 : Formuler la demande par email
L'accès à l'API n'est pas activable manuellement depuis votre tableau de bord. C'est **le restaurant** (vous) qui doit adresser la demande directement à l'équipe technique de Zenchef.

1. **Destinataire :** `api-tech-help@zenchef.com`
2. **Objet :** Demande de clé API pour le restaurant [Nom de votre restaurant]
3. **Corps du message (Modèle à copier-coller) :**

> Bonjour l'équipe Zenchef,
> 
> En tant que gérant du restaurant **[Nom exact de votre restaurant tel qu'il apparaît sur Zenchef]** (ID Zenchef : **[Votre ID Zenchef]**), je vous contacte pour demander un accès à votre API REST publique.
> 
> Nous utilisons actuellement la plateforme "Rive" (https://rive.com) pour la gestion de nos opérations internes (Smart Prep Lists) et notre analyse Food Cost. Rive a développé une intégration avec votre API publique pour synchroniser en temps réel notre volume de couverts et notre portefeuille clients.
> 
> Pour l'instant, nous n'avons besoin d'un accès qu'en **Lecture Seule (Read-Only)** sur les endpoints "Reservations" et "Availability" liés à notre restaurant.
> 
> Pourriez-vous nous générer et nous transmettre notre clé d'API (`x-zenchef-api-key`) ?
> 
> Merci de me faire part des éventuelles démarches administratives ou partenariales nécessaires, sachant que cette connexion ne concerne que nos propres données de réservation internes.
> 
> Cordialement,
> **[Votre prénom et nom]**
> Gérant de **[Nom de votre restaurant]**

*(Astuce : Votre ID Zenchef est souvent visible dans l'URL (le lien en haut) lorsque vous êtes connecté sur votre interface, ou dans vos paramètres)*

---

## Étape 2 : Connecter la clé à Rive
Une fois l'email traité par le support de Zenchef (cela peut prendre de 48h à 72h ouvrées), ils vous répondront en vous fournissant une longue chaîne de caractères sécurisée : votre **Clé d'API Zenchef**.

1. Retournez dans votre interface **Rive**, dans la page **Paramètres > Intégrations Réservations**.
2. Cliquez sur **Connecter Zenchef**.
3. Dans la boîte de dialogue, **collez** exactement la clé d'API que le support Zenchef vous a fournie.
4. Cliquez sur **Valider la connexion**.

Une fois connectée, l'intégration est active immédiatement. La "Dernière synchronisation" s'affichera dans l'interface et vos données de réservations commenceront à remonter dans Rive dans les minutes qui suivent.
