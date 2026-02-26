# Email Notification System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full transactional email system (Resend + React Email) covering 6 email types across the user lifecycle — welcome, trial warnings, trial expiry, payment confirmation, and subscription cancellation.

**Architecture:** Resend delivers emails via a typed `sendEmail()` utility in `/src/lib/email.ts`. React Email templates live in `/src/emails/`. Event-triggered emails fire from existing API routes (notify-signup, Stripe webhook). Time-based trial emails are sent by a Vercel Cron job hitting `/api/cron/trial-check` daily at 09:00 UTC.

**Tech Stack:** `resend`, `@react-email/components`, Next.js API Routes, Vercel Cron, Supabase (service role for auth.users email lookup)

---

## Design Reference

Full design doc at `docs/plans/2026-02-22-email-notifications-design.md`.

**Brand colors:**
- Clay (primary/dominant): `#CC5833`
- Moss (secondary): `#2E4036`
- Cream (background): `#F2F0E9`
- Charcoal (text): `#1A1A1A`

---

## Task 1: Database Migration — Email Tracking Columns

**Files:**
- Create: `supabase/migration_v7_email_tracking.sql`

**Step 1: Create the migration file**

```sql
-- ============================================
-- Rive — Migration v7: Email Tracking
-- ============================================
-- Run in Supabase SQL Editor

ALTER TABLE restaurant_settings
  ADD COLUMN IF NOT EXISTS email_trial_7_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_trial_3_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_trial_expired_sent BOOLEAN NOT NULL DEFAULT FALSE;
```

**Step 2: Run in Supabase SQL Editor**

Go to Supabase Dashboard → SQL Editor → paste and run.
Expected: `ALTER TABLE` success, no errors.

**Step 3: Verify**

Run in SQL Editor:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'restaurant_settings'
  AND column_name LIKE 'email_%';
```
Expected: 3 rows — `email_trial_7_sent`, `email_trial_3_sent`, `email_trial_expired_sent`.

**Step 4: Commit**

```bash
git add supabase/migration_v7_email_tracking.sql
git commit -m "feat: add email tracking columns to restaurant_settings"
```

---

## Task 2: Install Dependencies + Document Env Vars

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.example`
- Modify: `.env.local` (add real keys — NOT committed)

**Step 1: Install packages**

```bash
npm install resend @react-email/components
```

Expected: Both packages added to `package.json` dependencies, no peer dep errors.

**Step 2: Update `.env.example`**

Add these lines after the existing content:

```
# Resend (Required for transactional emails)
RESEND_API_KEY=re_...

# Cron Job Security (Required — set any random secret string)
CRON_SECRET=your_random_secret_here

# Supabase Service Role (Required for cron + email lookups)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Step 3: Add real values to `.env.local`**

Go to resend.com → API Keys → create key named "rive-production".
Set `RESEND_API_KEY`, `CRON_SECRET` (any random string e.g. `openssl rand -hex 32`), and `SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard → Settings → API → service_role key).

**Step 4: Commit**

```bash
git add .env.example package.json package-lock.json
git commit -m "feat: install resend and react-email, document env vars"
```

---

## Task 3: Create Email Utility `/src/lib/email.ts`

**Files:**
- Create: `src/lib/email.ts`

**Step 1: Create the file**

```typescript
import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { TrialWarningEmail } from '@/emails/TrialWarningEmail';
import { TrialExpiredEmail } from '@/emails/TrialExpiredEmail';
import { PaymentConfirmationEmail } from '@/emails/PaymentConfirmationEmail';
import { SubscriptionCancelledEmail } from '@/emails/SubscriptionCancelledEmail';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Rive <dock@rivehub.com>';

export type EmailPayload =
  | { type: 'welcome'; to: string; restaurantName: string }
  | { type: 'trial_warning'; to: string; restaurantName: string; daysLeft: 7 | 3 }
  | { type: 'trial_expired'; to: string; restaurantName: string }
  | { type: 'payment_confirmation'; to: string; restaurantName: string; tier: string }
  | { type: 'subscription_cancelled'; to: string; restaurantName: string };

const SUBJECTS: Record<EmailPayload['type'], string | ((p: EmailPayload) => string)> = {
  welcome: 'Bienvenue sur Rive 🌊',
  trial_warning: (p) =>
    p.type === 'trial_warning'
      ? `Votre essai Rive se termine dans ${p.daysLeft} jours`
      : '',
  trial_expired: 'Votre essai Rive est terminé',
  payment_confirmation: 'Bienvenue dans l'équipe Rive ✓',
  subscription_cancelled: 'Votre abonnement Rive a été annulé',
};

function getSubject(payload: EmailPayload): string {
  const s = SUBJECTS[payload.type];
  return typeof s === 'function' ? s(payload) : s;
}

function getReactComponent(payload: EmailPayload) {
  switch (payload.type) {
    case 'welcome':
      return WelcomeEmail({ restaurantName: payload.restaurantName });
    case 'trial_warning':
      return TrialWarningEmail({ restaurantName: payload.restaurantName, daysLeft: payload.daysLeft });
    case 'trial_expired':
      return TrialExpiredEmail({ restaurantName: payload.restaurantName });
    case 'payment_confirmation':
      return PaymentConfirmationEmail({ restaurantName: payload.restaurantName, tier: payload.tier });
    case 'subscription_cancelled':
      return SubscriptionCancelledEmail({ restaurantName: payload.restaurantName });
  }
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email send');
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: payload.to,
    subject: getSubject(payload),
    react: getReactComponent(payload),
  });

  if (error) {
    console.error(`[email] Failed to send ${payload.type} to ${payload.to}:`, error);
  } else {
    console.log(`[email] Sent ${payload.type} to ${payload.to}`);
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: Errors about missing email template files — those get built next. That's fine for now.

**Step 3: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: add sendEmail utility with Resend client"
```

---

## Task 4: Create WelcomeEmail Template

**Files:**
- Create: `src/emails/WelcomeEmail.tsx`

**Step 1: Create the file**

```tsx
import {
  Html, Head, Body, Container, Heading, Text, Button, Hr, Img
} from '@react-email/components';

interface WelcomeEmailProps {
  restaurantName: string;
}

export function WelcomeEmail({ restaurantName }: WelcomeEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <div style={header}>
            <Heading style={logo}>Rive</Heading>
          </div>

          {/* Main */}
          <div style={main}>
            <Heading style={h1}>Bienvenue sur Rive, {restaurantName} 🌊</Heading>
            <Text style={text}>
              Votre essai gratuit de 14 jours commence maintenant. Voici par où commencer :
            </Text>

            <div style={tipBox}>
              <Text style={tipItem}>📋 <strong>Carnet de bord</strong> — Notez vos observations en cuisine. L'IA les classe et les traduit automatiquement.</Text>
              <Text style={tipItem}>🍽️ <strong>Éditeur de menu</strong> — Créez votre menu en quelques minutes et partagez-le via QR code.</Text>
              <Text style={tipItem}>📊 <strong>Ingénierie de menu</strong> — Identifiez vos plats stars et boostez votre rentabilité.</Text>
            </div>

            <Button style={button} href="https://rivehub.com/fr/dashboard">
              Accéder à mon tableau de bord →
            </Button>
          </div>

          <Hr style={hr} />

          {/* Footer */}
          <Text style={footer}>
            Rive · dock@rivehub.com · Montréal, QC
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const body = { backgroundColor: '#F2F0E9', margin: '0', padding: '0' };
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' };
const header = { backgroundColor: '#CC5833', borderRadius: '12px 12px 0 0', padding: '24px 32px', marginBottom: '0' };
const logo = { color: '#F2F0E9', fontSize: '24px', fontWeight: '700', margin: '0', letterSpacing: '-0.5px' };
const main = { backgroundColor: '#ffffff', padding: '32px', borderRadius: '0 0 12px 12px', marginBottom: '24px' };
const h1 = { color: '#2E4036', fontSize: '22px', fontWeight: '700', margin: '0 0 16px 0', lineHeight: '1.3' };
const text = { color: '#1A1A1A', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0' };
const tipBox = { backgroundColor: '#F2F0E9', borderRadius: '8px', padding: '16px 20px', marginBottom: '28px' };
const tipItem = { color: '#1A1A1A', fontSize: '14px', lineHeight: '1.7', margin: '0 0 8px 0' };
const button = { backgroundColor: '#CC5833', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '0' };
```

**Step 2: Commit**

```bash
git add src/emails/WelcomeEmail.tsx
git commit -m "feat: add WelcomeEmail React Email template"
```

---

## Task 5: Create TrialWarningEmail Template

**Files:**
- Create: `src/emails/TrialWarningEmail.tsx`

**Step 1: Create the file**

```tsx
import {
  Html, Head, Body, Container, Heading, Text, Button, Hr
} from '@react-email/components';

interface TrialWarningEmailProps {
  restaurantName: string;
  daysLeft: 7 | 3;
}

export function TrialWarningEmail({ restaurantName, daysLeft }: TrialWarningEmailProps) {
  const isUrgent = daysLeft === 3;

  return (
    <Html lang="fr">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <div style={{ ...header, backgroundColor: isUrgent ? '#b84d2e' : '#CC5833' }}>
            <Heading style={logo}>Rive</Heading>
          </div>

          <div style={main}>
            <Heading style={h1}>
              {isUrgent
                ? `⚠️ Plus que 3 jours pour ${restaurantName}`
                : `📅 Votre essai se termine dans 7 jours`}
            </Heading>

            <Text style={text}>
              {isUrgent
                ? `L'essai gratuit de ${restaurantName} se termine dans 3 jours. Ne perdez pas l'accès à vos outils.`
                : `L'essai gratuit de ${restaurantName} se termine dans 7 jours. C'est le bon moment pour passer à la suite.`}
            </Text>

            <div style={tierBox}>
              <Text style={tierTitle}>Ce que vous gardez avec un abonnement :</Text>
              <Text style={tierItem}>✅ Carnet de bord intelligent (illimité)</Text>
              <Text style={tierItem}>✅ Éditeur de menu & QR code</Text>
              <Text style={tierItem}>✅ Analyse des coûts alimentaires</Text>
              <Text style={tierItem}>✅ Ingénierie de menu IA</Text>
              <Text style={tierItem}>✅ Générateur de posts Instagram</Text>
            </div>

            <Button style={button} href="https://rivehub.com/fr/pricing">
              Voir les forfaits →
            </Button>

            <Text style={subtext}>
              À partir de 49 $/mois · Sans engagement · Annulez à tout moment
            </Text>
          </div>

          <Hr style={hr} />
          <Text style={footer}>Rive · dock@rivehub.com · Montréal, QC</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: '#F2F0E9', margin: '0', padding: '0' };
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' };
const header = { borderRadius: '12px 12px 0 0', padding: '24px 32px' };
const logo = { color: '#F2F0E9', fontSize: '24px', fontWeight: '700', margin: '0', letterSpacing: '-0.5px' };
const main = { backgroundColor: '#ffffff', padding: '32px', borderRadius: '0 0 12px 12px', marginBottom: '24px' };
const h1 = { color: '#2E4036', fontSize: '22px', fontWeight: '700', margin: '0 0 16px 0', lineHeight: '1.3' };
const text = { color: '#1A1A1A', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0' };
const tierBox = { backgroundColor: '#F2F0E9', borderRadius: '8px', padding: '16px 20px', marginBottom: '28px' };
const tierTitle = { color: '#2E4036', fontSize: '14px', fontWeight: '600', margin: '0 0 10px 0' };
const tierItem = { color: '#1A1A1A', fontSize: '14px', lineHeight: '1.7', margin: '0 0 4px 0' };
const button = { backgroundColor: '#CC5833', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' };
const subtext = { color: '#9ca3af', fontSize: '12px', margin: '16px 0 0 0' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '0' };
```

**Step 2: Commit**

```bash
git add src/emails/TrialWarningEmail.tsx
git commit -m "feat: add TrialWarningEmail React Email template"
```

---

## Task 6: Create TrialExpiredEmail Template

**Files:**
- Create: `src/emails/TrialExpiredEmail.tsx`

**Step 1: Create the file**

```tsx
import {
  Html, Head, Body, Container, Heading, Text, Button, Hr
} from '@react-email/components';

interface TrialExpiredEmailProps {
  restaurantName: string;
}

export function TrialExpiredEmail({ restaurantName }: TrialExpiredEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <div style={header}>
            <Heading style={logo}>Rive</Heading>
          </div>

          <div style={main}>
            <Heading style={h1}>Votre essai est terminé, {restaurantName}</Heading>

            <Text style={text}>
              Votre période d'essai gratuit de 14 jours est arrivée à terme. Votre compte passe automatiquement en mode <strong>Essentiel</strong>.
            </Text>

            <div style={statusBox}>
              <Text style={statusTitle}>Ce que vous gardez :</Text>
              <Text style={statusItem}>✅ Carnet de bord</Text>
              <Text style={statusItem}>✅ Éditeur de menu & QR code</Text>
              <Text style={statusItem + ' color: #9ca3af;'}>❌ Analyse des coûts (Performance et +)</Text>
              <Text style={statusItem + ' color: #9ca3af;'}>❌ Ingénierie de menu (Performance et +)</Text>
              <Text style={statusItem + ' color: #9ca3af;'}>❌ Générateur Instagram (Performance et +)</Text>
            </div>

            <Button style={button} href="https://rivehub.com/fr/pricing">
              Choisir un forfait →
            </Button>

            <Text style={subtext}>
              Des questions ? Répondez directement à cet e-mail.
            </Text>
          </div>

          <Hr style={hr} />
          <Text style={footer}>Rive · dock@rivehub.com · Montréal, QC</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: '#F2F0E9', margin: '0', padding: '0' };
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' };
const header = { backgroundColor: '#2E4036', borderRadius: '12px 12px 0 0', padding: '24px 32px' };
const logo = { color: '#F2F0E9', fontSize: '24px', fontWeight: '700', margin: '0', letterSpacing: '-0.5px' };
const main = { backgroundColor: '#ffffff', padding: '32px', borderRadius: '0 0 12px 12px', marginBottom: '24px' };
const h1 = { color: '#2E4036', fontSize: '22px', fontWeight: '700', margin: '0 0 16px 0', lineHeight: '1.3' };
const text = { color: '#1A1A1A', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0' };
const statusBox = { backgroundColor: '#F2F0E9', borderRadius: '8px', padding: '16px 20px', marginBottom: '28px' };
const statusTitle = { color: '#2E4036', fontSize: '14px', fontWeight: '600', margin: '0 0 10px 0' };
const statusItem = { color: '#1A1A1A', fontSize: '14px', lineHeight: '1.7', margin: '0 0 4px 0' };
const button = { backgroundColor: '#CC5833', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' };
const subtext = { color: '#9ca3af', fontSize: '12px', margin: '16px 0 0 0' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '0' };
```

**Step 2: Commit**

```bash
git add src/emails/TrialExpiredEmail.tsx
git commit -m "feat: add TrialExpiredEmail React Email template"
```

---

## Task 7: Create PaymentConfirmationEmail Template

**Files:**
- Create: `src/emails/PaymentConfirmationEmail.tsx`

**Step 1: Create the file**

```tsx
import {
  Html, Head, Body, Container, Heading, Text, Button, Hr
} from '@react-email/components';

interface PaymentConfirmationEmailProps {
  restaurantName: string;
  tier: string;
}

const TIER_LABELS: Record<string, string> = {
  essential: 'Essentiel',
  performance: 'Performance',
  enterprise: 'Entreprise',
};

const TIER_FEATURES: Record<string, string[]> = {
  essential: ['Carnet de bord illimité', 'Éditeur de menu & QR code'],
  performance: ['Carnet de bord illimité', 'Éditeur de menu & QR code', 'Analyse des coûts alimentaires', 'Ingénierie de menu IA', 'Générateur de posts Instagram'],
  enterprise: ['Tout le forfait Performance', 'Scanner de reçus IA', 'Support prioritaire'],
};

export function PaymentConfirmationEmail({ restaurantName, tier }: PaymentConfirmationEmailProps) {
  const label = TIER_LABELS[tier] || tier;
  const features = TIER_FEATURES[tier] || [];

  return (
    <Html lang="fr">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <div style={header}>
            <Heading style={logo}>Rive</Heading>
          </div>

          <div style={main}>
            <Heading style={h1}>Merci, {restaurantName} ✓</Heading>

            <Text style={text}>
              Votre abonnement <strong>{label}</strong> est maintenant actif. Tous vos outils sont disponibles.
            </Text>

            <div style={confirmBox}>
              <Text style={confirmTitle}>Inclus dans votre forfait {label} :</Text>
              {features.map((f) => (
                <Text key={f} style={confirmItem}>✅ {f}</Text>
              ))}
            </div>

            <Button style={button} href="https://rivehub.com/fr/dashboard">
              Accéder à mon tableau de bord →
            </Button>
          </div>

          <Hr style={hr} />
          <Text style={footer}>Rive · dock@rivehub.com · Montréal, QC</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: '#F2F0E9', margin: '0', padding: '0' };
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' };
const header = { backgroundColor: '#CC5833', borderRadius: '12px 12px 0 0', padding: '24px 32px' };
const logo = { color: '#F2F0E9', fontSize: '24px', fontWeight: '700', margin: '0', letterSpacing: '-0.5px' };
const main = { backgroundColor: '#ffffff', padding: '32px', borderRadius: '0 0 12px 12px', marginBottom: '24px' };
const h1 = { color: '#2E4036', fontSize: '22px', fontWeight: '700', margin: '0 0 16px 0', lineHeight: '1.3' };
const text = { color: '#1A1A1A', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0' };
const confirmBox = { backgroundColor: '#F2F0E9', borderRadius: '8px', padding: '16px 20px', marginBottom: '28px' };
const confirmTitle = { color: '#2E4036', fontSize: '14px', fontWeight: '600', margin: '0 0 10px 0' };
const confirmItem = { color: '#1A1A1A', fontSize: '14px', lineHeight: '1.7', margin: '0 0 4px 0' };
const button = { backgroundColor: '#CC5833', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '0' };
```

**Step 2: Commit**

```bash
git add src/emails/PaymentConfirmationEmail.tsx
git commit -m "feat: add PaymentConfirmationEmail React Email template"
```

---

## Task 8: Create SubscriptionCancelledEmail Template

**Files:**
- Create: `src/emails/SubscriptionCancelledEmail.tsx`

**Step 1: Create the file**

```tsx
import {
  Html, Head, Body, Container, Heading, Text, Button, Hr
} from '@react-email/components';

interface SubscriptionCancelledEmailProps {
  restaurantName: string;
}

export function SubscriptionCancelledEmail({ restaurantName }: SubscriptionCancelledEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <div style={header}>
            <Heading style={logo}>Rive</Heading>
          </div>

          <div style={main}>
            <Heading style={h1}>Votre abonnement a été annulé</Heading>

            <Text style={text}>
              Nous confirmons l'annulation de l'abonnement de {restaurantName}. Vous conservez un accès limité via le forfait Essentiel.
            </Text>

            <div style={keepBox}>
              <Text style={keepTitle}>Ce que vous gardez :</Text>
              <Text style={keepItem}>✅ Carnet de bord</Text>
              <Text style={keepItem}>✅ Éditeur de menu & QR code</Text>
            </div>

            <Text style={winback}>
              Vous nous manquez déjà. Si vous changez d'avis, vos données sont toujours là, prêtes à reprendre là où vous vous étiez arrêté.
            </Text>

            <Button style={button} href="https://rivehub.com/fr/pricing">
              Réactiver mon abonnement →
            </Button>
          </div>

          <Hr style={hr} />
          <Text style={footer}>Rive · dock@rivehub.com · Montréal, QC</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: '#F2F0E9', margin: '0', padding: '0' };
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' };
const header = { backgroundColor: '#2E4036', borderRadius: '12px 12px 0 0', padding: '24px 32px' };
const logo = { color: '#F2F0E9', fontSize: '24px', fontWeight: '700', margin: '0', letterSpacing: '-0.5px' };
const main = { backgroundColor: '#ffffff', padding: '32px', borderRadius: '0 0 12px 12px', marginBottom: '24px' };
const h1 = { color: '#2E4036', fontSize: '22px', fontWeight: '700', margin: '0 0 16px 0', lineHeight: '1.3' };
const text = { color: '#1A1A1A', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0' };
const keepBox = { backgroundColor: '#F2F0E9', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' };
const keepTitle = { color: '#2E4036', fontSize: '14px', fontWeight: '600', margin: '0 0 10px 0' };
const keepItem = { color: '#1A1A1A', fontSize: '14px', lineHeight: '1.7', margin: '0 0 4px 0' };
const winback = { color: '#4b5563', fontSize: '14px', fontStyle: 'italic', lineHeight: '1.6', margin: '0 0 24px 0' };
const button = { backgroundColor: '#CC5833', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '0' };
```

**Step 2: Commit**

```bash
git add src/emails/SubscriptionCancelledEmail.tsx
git commit -m "feat: add SubscriptionCancelledEmail React Email template"
```

---

## Task 9: Wire Welcome Email into `notify-signup` Route

**Files:**
- Modify: `src/app/api/notify-signup/route.ts`

**Context:** This route is already called fire-and-forget from `src/app/[locale]/signup/page.tsx` after successful signup. It receives `restaurant_name` and `email`. We just need to call `sendEmail` here.

**Step 1: Replace the entire file content**

Full updated file at `src/app/api/notify-signup/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

const ADMIN_EMAIL = "nassim.saighi@gmail.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { restaurant_name, email, locale } = body;

    if (!restaurant_name || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("signup_notifications").insert({
      restaurant_name,
      email,
      locale: locale || "fr",
      notified: false,
    });

    console.log(
      `🆕 NEW SIGNUP | ${restaurant_name} | ${email} | locale: ${locale || "fr"} | ${new Date().toISOString()}`
    );

    // Send welcome email (fire and forget — never blocks signup)
    sendEmail({
      type: 'welcome',
      to: email,
      restaurantName: restaurant_name,
    }).catch((err) => console.error('[email] welcome email failed:', err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notify signup error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Manual test**

Start dev server (`npm run dev`), sign up with a new account using a real email address, check that inbox receives the welcome email.

**Step 4: Commit**

```bash
git add src/app/api/notify-signup/route.ts
git commit -m "feat: send welcome email on new signup"
```

---

## Task 10: Wire Payment + Cancellation Emails into Stripe Webhook

**Files:**
- Modify: `src/app/api/stripe/webhook/route.ts`

**Context:** The webhook handles two events. On `checkout.session.completed` it already has `restaurantId` + `tier`. On `customer.subscription.deleted` it finds the restaurant via `stripe_subscription_id`. To get the restaurant's email we need to: (1) query `restaurant_profiles` to get `user_id`, (2) use Supabase auth admin to get the email.

**Step 1: Replace the file content**

Full updated file at `src/app/api/stripe/webhook/route.ts`:

```typescript
import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getRestaurantEmail(supabase: ReturnType<typeof createClient>, restaurantId: string): Promise<{ email: string; restaurantName: string } | null> {
  const { data: profile } = await supabase
    .from('restaurant_profiles')
    .select('user_id, restaurant_name')
    .eq('id', restaurantId)
    .single();

  if (!profile) return null;

  const { data: { user } } = await supabase.auth.admin.getUserById(profile.user_id);
  if (!user?.email) return null;

  return { email: user.email, restaurantName: profile.restaurant_name };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig || !webhookSecret) {
      return NextResponse.json({ error: 'Webhook Secret Error' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const supabase = getServiceClient();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const restaurantId = session.metadata?.restaurantId;

      if (restaurantId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0].price.id;

        let tier = 'trial';
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIEL) tier = 'essential';
        else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PERFORMANCE) tier = 'performance';
        else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTREPRISE) tier = 'enterprise';

        const { error } = await supabase.rpc('update_subscription_from_stripe', {
          p_restaurant_id: restaurantId,
          p_stripe_customer_id: session.customer as string,
          p_stripe_subscription_id: session.subscription as string,
          p_tier: tier,
        });

        if (error) {
          console.error("Database update error:", error);
          throw new Error("Unable to update subscription in database");
        }

        // Send payment confirmation email (fire and forget)
        getRestaurantEmail(supabase, restaurantId).then((info) => {
          if (info) {
            sendEmail({
              type: 'payment_confirmation',
              to: info.email,
              restaurantName: info.restaurantName,
              tier,
            }).catch((err) => console.error('[email] payment confirmation failed:', err));
          }
        }).catch(() => {});
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;

      const { data: settingsData } = await supabase
        .from('restaurant_settings')
        .select('restaurant_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (settingsData) {
        await supabase.rpc('update_subscription_from_stripe', {
          p_restaurant_id: settingsData.restaurant_id,
          p_stripe_customer_id: subscription.customer,
          p_stripe_subscription_id: null,
          p_tier: 'trial',
        });

        // Send cancellation email (fire and forget)
        getRestaurantEmail(supabase, settingsData.restaurant_id).then((info) => {
          if (info) {
            sendEmail({
              type: 'subscription_cancelled',
              to: info.email,
              restaurantName: info.restaurantName,
            }).catch((err) => console.error('[email] cancellation email failed:', err));
          }
        }).catch(() => {});
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Erreur serveur Webhook:", err);
    return NextResponse.json({ error: 'Serveur Erreur' }, { status: 500 });
  }
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/app/api/stripe/webhook/route.ts
git commit -m "feat: send payment confirmation and cancellation emails from Stripe webhook"
```

---

## Task 11: Create Cron Endpoint `/api/cron/trial-check`

**Files:**
- Create: `src/app/api/cron/trial-check/route.ts`

**Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  // Validate cron secret
  const authHeader = req.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const now = new Date();

  // Fetch all trial restaurants with their profile info
  const { data: trialRestaurants, error } = await supabase
    .from('restaurant_settings')
    .select(`
      restaurant_id,
      trial_ends_at,
      email_trial_7_sent,
      email_trial_3_sent,
      email_trial_expired_sent,
      restaurant_profiles!inner(user_id, restaurant_name)
    `)
    .eq('subscription_tier', 'trial');

  if (error) {
    console.error('[cron/trial-check] Query failed:', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  if (!trialRestaurants || trialRestaurants.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;

  for (const restaurant of trialRestaurants) {
    const profile = Array.isArray(restaurant.restaurant_profiles)
      ? restaurant.restaurant_profiles[0]
      : restaurant.restaurant_profiles;

    if (!profile) continue;

    // Get user email from auth
    const { data: { user } } = await supabase.auth.admin.getUserById(profile.user_id);
    if (!user?.email) continue;

    const trialEndsAt = restaurant.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
    if (!trialEndsAt) continue;

    const msLeft = trialEndsAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    const updates: Record<string, boolean> = {};

    // 7-day warning
    if (daysLeft <= 7 && daysLeft > 3 && !restaurant.email_trial_7_sent) {
      await sendEmail({
        type: 'trial_warning',
        to: user.email,
        restaurantName: profile.restaurant_name,
        daysLeft: 7,
      }).catch((err) => console.error('[cron] 7-day warning failed:', err));
      updates.email_trial_7_sent = true;
    }

    // 3-day warning
    if (daysLeft <= 3 && daysLeft > 0 && !restaurant.email_trial_3_sent) {
      await sendEmail({
        type: 'trial_warning',
        to: user.email,
        restaurantName: profile.restaurant_name,
        daysLeft: 3,
      }).catch((err) => console.error('[cron] 3-day warning failed:', err));
      updates.email_trial_3_sent = true;
    }

    // Expired
    if (daysLeft <= 0 && !restaurant.email_trial_expired_sent) {
      await sendEmail({
        type: 'trial_expired',
        to: user.email,
        restaurantName: profile.restaurant_name,
      }).catch((err) => console.error('[cron] expired email failed:', err));
      updates.email_trial_expired_sent = true;
    }

    // Persist flags
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('restaurant_settings')
        .update(updates)
        .eq('restaurant_id', restaurant.restaurant_id);
      processed++;
    }
  }

  console.log(`[cron/trial-check] Processed ${processed}/${trialRestaurants.length} restaurants`);
  return NextResponse.json({ processed, total: trialRestaurants.length });
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Manual test — hit the cron endpoint locally**

Start dev server, then in a separate terminal:

```bash
curl -X POST http://localhost:3000/api/cron/trial-check \
  -H "Authorization: Bearer YOUR_CRON_SECRET_FROM_ENV"
```

Expected: `{"processed":N,"total":N}` — no 401, no 500.

Test the security check too:
```bash
curl -X POST http://localhost:3000/api/cron/trial-check \
  -H "Authorization: Bearer wrong-secret"
```
Expected: `{"error":"Unauthorized"}` with status 401.

**Step 4: Commit**

```bash
git add src/app/api/cron/trial-check/route.ts
git commit -m "feat: add daily cron endpoint for trial expiration emails"
```

---

## Task 12: Update `vercel.json` with Cron Schedule

**Files:**
- Modify: `vercel.json`

**Step 1: Add the crons array to vercel.json**

Current `vercel.json` only has a `headers` key. Add a `crons` key alongside it.

The final file should look like:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://images.unsplash.com data: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co https://api.anthropic.com; frame-ancestors 'none'"
        }
      ]
    }
  ],
  "crons": [
    {
      "path": "/api/cron/trial-check",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Step 2: Verify JSON is valid**

```bash
node -e "require('./vercel.json'); console.log('JSON valid')"
```

Expected: `JSON valid`

**Note on Vercel Cron authentication:** Vercel automatically sends `Authorization: Bearer $CRON_SECRET` when invoking cron routes, provided `CRON_SECRET` is set in Vercel environment variables. Set it in Vercel Dashboard → Settings → Environment Variables.

**Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat: add Vercel cron schedule for daily trial email check"
```

---

## Task 13: Final Verification Checklist

**Step 1: Full TypeScript build**

```bash
npm run build
```

Expected: Build succeeds with no type errors.

**Step 2: Welcome email end-to-end**

1. Start dev server: `npm run dev`
2. Sign up with a new account using a real email you can check
3. Verify welcome email arrives in inbox with correct branding (Clay header, Cream background)

**Step 3: Cron email end-to-end**

In Supabase SQL Editor, temporarily set a test restaurant's trial to expire in 2 days:
```sql
UPDATE restaurant_settings
SET trial_ends_at = NOW() + INTERVAL '2 days'
WHERE restaurant_id = 'YOUR_TEST_RESTAURANT_ID';
```

Then hit the cron endpoint:
```bash
curl -X POST http://localhost:3000/api/cron/trial-check \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected: 3-day warning email arrives. Check `email_trial_3_sent = true` in Supabase.

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete email notification system (Resend + React Email + Vercel Cron)"
```

---

## Summary of All New Files

| File | Purpose |
|---|---|
| `supabase/migration_v7_email_tracking.sql` | 3 boolean flag columns |
| `src/lib/email.ts` | Resend client + sendEmail() |
| `src/emails/WelcomeEmail.tsx` | Welcome template |
| `src/emails/TrialWarningEmail.tsx` | 7-day / 3-day warning template |
| `src/emails/TrialExpiredEmail.tsx` | Trial expired template |
| `src/emails/PaymentConfirmationEmail.tsx` | Payment confirmation template |
| `src/emails/SubscriptionCancelledEmail.tsx` | Cancellation template |
| `src/app/api/cron/trial-check/route.ts` | Daily cron endpoint |

## Summary of Modified Files

| File | Change |
|---|---|
| `src/app/api/notify-signup/route.ts` | + welcome email trigger |
| `src/app/api/stripe/webhook/route.ts` | + payment + cancellation email triggers |
| `vercel.json` | + cron schedule |
| `.env.example` | + RESEND_API_KEY, CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY |
