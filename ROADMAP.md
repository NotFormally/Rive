# 🗺️ Rive - Feuille de Route & Actions Requises (TODO)

Ce document centralise les tâches opérationnelles, techniques et administratives restantes pour finaliser les différentes intégrations et fonctionnalités de Rive.

---

## 📱 Intégration Native : Meta Graph API (Instagram & Facebook)
*Statut : Code Backend & Frontend intégré. En attente de validation administrative et Meta.*

### 1. Légalisation de Rive (Pré-requis bloquant)
- [ ] Enregistrer "Rive" (ou entité parente) au Registraire des entreprises du Québec (REQ) en tant qu'Entreprise Individuelle (S.e.n.c.) ou Incorporation (Inc.).
- [ ] Récupérer le Numéro d'Entreprise du Québec (NEQ) ou certificat de constitution.
- [ ] S'assurer que le nom de domaine `rivehub.com` ou une facture (ex: hébergement Vercel) est au nom de l'entreprise.

### 2. Configuration sur le Portail Meta for Developers
- [ ] Créer l'application "Rive" sur [developers.facebook.com](https://developers.facebook.com/).
- [ ] Ajouter les "Use Cases" : `Facebook Login` et `Content Management` (Manage Pages / Publish to Instagram).
- [ ] Dans `Facebook Login > Settings`, ajouter les URLs de redirection (OAuth Redirect URIs) :
  - `http://localhost:3000/api/auth/meta/callback`
  - `https://rivehub.com/api/auth/meta/callback`
- [ ] Récupérer le `META_CLIENT_ID` (App ID) et `META_CLIENT_SECRET` (App Secret).
- [ ] Mettre à jour ces variables d'environnement sur Vercel (Production) et dans le `.env.local` (Local).

### 3. Business Verification & App Review (Meta)
- [ ] Dans le Meta Business Manager, compléter la "Business Verification" en soumettant le document du REQ.
- [ ] Une fois la publication locale fonctionnelle, faire un enregistrement d'écran (Screencast) montrant :
  1. Un utilisateur Rive cliquant sur "Connecter Meta"
  2. L'écran de consentement Facebook/Instagram
  3. Rive générant un post via IA
  4. L'utilisateur cliquant sur "Publier" et l'apparition du post sur le compte Instagram cible.
- [ ] Soumettre le Screencast pour la "App Review" afin d'obtenir l'autorisation `instagram_content_publish`.
- [ ] Passer l'App Meta du mode "Development" au mode "Live".

---

## 🎵 Intégration Native : TikTok API
*Statut : Code Backend & Frontend intégré. En attente de configuration sur le portail dev.*

- [ ] S'inscrire sur le portail [TikTok for Developers](https://developers.tiktok.com/).
- [ ] Créer une application Web.
- [ ] Demander les scopes : `user.info.basic`, `video.publish`, `video.upload`.
- [ ] Renseigner les URLs de redirection :
  - `http://localhost:3000/api/auth/tiktok/callback`
  - `https://rivehub.com/api/auth/tiktok/callback`
- [ ] Récupérer le `TIKTOK_CLIENT_KEY` et `TIKTOK_CLIENT_SECRET`.
- [ ] Mettre à jour les variables d'environnement sur Vercel.
- [ ] (Si requis par TikTok) Soumettre à vérification (App Review).

---

## 🍺 Nouveaux Modules (En cours)
*Statut : Variables ajoutées dans `AuthProvider.tsx` et `settings/page.tsx`.*

- [ ] **Module Deposits (♻️)** : Développer la logique de gestion des consignes (bouteilles/fûts).
- [ ] **Module Variance (💧)** : Développer la logique de gestion des écarts / pertes de stock (Spoilage).
- [ ] **Module Production (🍺)** : Développer la logique de suivi de production interne.
- [ ] Créer les Mocks/UI pour ces 3 nouvelles sections d'ici la mise en production.

---

## 🚀 Divers / Infrastructure
- [ ] Exécuter la migration SQL `supabase/migrations/20260227205014_social_connections.sql` sur l'instance de production Supabase via le dashboard ou la CLI.
- [ ] Revoir les CGU pour s'assurer qu'elles incluent les modalités d'intégration OAuth et le traitement (sans conservation) des tokens tiers.
