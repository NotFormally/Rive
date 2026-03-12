# Cartographie complète — Architecture du Menu Utilisateur RiveHub

> Derniere mise a jour : 2026-03-09

---

## 1. Composant Principal : `Sidebar.tsx`

**Fichier** : `src/components/Sidebar.tsx` (~290 lignes)

Composant client unique qui gere **desktop** (fixe) et **mobile** (slide-over). Utilise `useAuth()` pour le profil et les settings, `usePathname()` pour la route active.

---

## 2. Structure de Navigation — 5 Zones Nautiques

| Zone | Nom | Icone | Routes |
|------|-----|-------|--------|
| **I — La Passerelle** | Vue d'ensemble | `Telescope` | `/dashboard`, `/carte`, `/pavillon`, `/compas`, `/estime` |
| **II — La Reserve** | Inventaire & Couts | `Boxes` | `/reserve` (food cost), `/reserve/reception` (La Lunette), `/reserve/tirant`, `/reserve/lest`, `/reserve/production` (La Cale) |
| **III — La Manoeuvre** | Service & Operations | `Waypoints` | `/quart/appareillage`, `/atelier/production/voice`, `/quart/mouillage`, `/quart/sonar`, `/quart/sonar/audit-demo`, `/carte/editeur` |
| **IV — Le Journal de Bord** | Analytics | `BookOpen` | `/journal`, `/journal/barometre` |
| **V — Le Gouvernail** | Reglages | `SlidersHorizontal` | `/gouvernail`, `/gouvernail/haccp-builder`, `/multilingual` |

---

## 3. Rendu Conditionnel par Modules

Chaque zone est conditionnee par des booleans dans `AuthProvider.tsx` (lignes 66-78) :

| Module | Controle |
|--------|----------|
| `module_menu_editor` | La Carte, Editeur |
| `module_food_cost` | Reserve (food cost) |
| `module_menu_engineering` | Le Compas |
| `module_receipt_scanner` | La Lunette (The Lens) |
| `module_reservations` | Le Mouillage |
| `module_smart_prep` | L'Appareillage, Dictee Vocale |
| `module_deposits` | Tracker Consignes |
| `module_variance` | Pertes & Coulage |
| `module_production` | La Cale |
| `module_logbook` | Le Journal |
| `module_instagram` | (desactive par defaut) |

Seule la Zone II (La Reserve) disparait entierement si aucun de ses modules n'est actif. Les autres zones contiennent des items inconditionnels (ex: Le Sonar, HACCP Runner, Le Barometre, Le Gouvernail) et restent toujours visibles.

---

## 4. Roles Utilisateur

**Type** : `MemberRole = 'owner' | 'admin' | 'editor'`

| Role | Badge | Permissions |
|------|-------|-------------|
| `owner` | Ambre | Tout (inviter, supprimer membres, changer roles) |
| `admin` | Vert fonce | Gestion equipe + settings |
| `editor` | Orange | Acces lecture/ecriture limite |

Pas de filtre de role sur le sidebar lui-meme — la visibilite depend des **modules actives**, pas du role.

---

## 5. Sections Utilisateur dans le Sidebar

**Haut** (lignes 128-154) :
- Logo restaurant cliquable → redirige vers `/dashboard/gouvernail`
- Nom du restaurant avec effet glow au hover

**Bas** (lignes 215-233) :
- Affichage langue active (icone `Sparkles`)
- Bouton **Deconnexion** (`signOut()` via AuthProvider)

> **Pas de dropdown utilisateur classique** — tout passe par la page `/gouvernail` (hub de settings central).

---

## 6. Mobile

| Element | Detail |
|---------|--------|
| **Hamburger** | Fixe `top-6 left-6`, z-index 60, visible < `md` |
| **Overlay** | Backdrop noir 80% + blur, z-index 50, ferme au clic |
| **Drawer** | `w-72`, animation slide CSS cubic-bezier, bouton X en haut |

---

## 7. Arbre des Layouts

```
RootLayout (/[locale]/layout.tsx)
└── AuthProvider
    └── NextIntlClientProvider
        └── DashboardLayout (/[locale]/dashboard/layout.tsx)
            ├── Sidebar          ← navigation principale
            └── main
                ├── CompasGauge  ← header
                ├── {page}       ← contenu
                └── Pilote       ← footer
```

---

## 8. i18n du Sidebar

Cles de traduction dans `messages/{locale}.json` sous `"Sidebar"` :

```
nav_overview, nav_carte, nav_pavillon, nav_compas, nav_estime,
nav_appareillage, nav_mouillage, nav_sonar, nav_haccp_runner,
nav_foodcost, nav_variance, nav_deposits,
nav_production, nav_reception_ocr, nav_dictee_voice, nav_menu,
nav_nid, nav_barometre, nav_greement,
nav_haccp_builder, nav_multilingual_team,
btn_logout, active_language, restaurant_space
```

25 locales supportees.

---

## 9. Hub Settings — `/dashboard/gouvernail` (~986 lignes)

Ce fichier est le **vrai menu utilisateur** avec :
- Profil restaurant (nom, tagline, logo)
- Toggles des 11 modules
- Gestion d'equipe (inviter, changer roles, supprimer)
- Couts main d'oeuvre & utilitaires
- Google Place ID
- Sous-pages : `/greement` (integrations), `/haccp-builder`, `/calfatage`

---

## 10. Points Architecturaux Cles

1. **Pas de dropdown user** — le sidebar + `/gouvernail` remplacent ce pattern
2. **Architecture modulaire** — le sidebar se reconfigure dynamiquement selon l'abonnement/settings
3. **Theme nautique coherent** — chaque zone = partie d'un navire
4. **Mobile-first** — drawer slide-over avec overlay, responsive des `md`
5. **Multi-tenant** — RLS Supabase, profil restaurant isole par equipe
6. **Routing i18n** — toutes les routes prefixees `/[locale]/dashboard/...`

---

## Fichiers Cles

| Fichier | Role |
|---------|------|
| `src/components/Sidebar.tsx` | Navigation principale (5 zones) |
| `src/components/AuthProvider.tsx` | Auth, profil, module settings |
| `src/app/[locale]/dashboard/layout.tsx` | Layout dashboard (Sidebar + CompasGauge + Pilote) |
| `src/app/[locale]/layout.tsx` | Root layout (AuthProvider, i18n, fonts) |
| `src/app/[locale]/dashboard/gouvernail/page.tsx` | Hub settings utilisateur (~986 lignes) |
| `messages/{locale}.json` | Traductions sidebar (25 locales) |
