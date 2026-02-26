# Email Notification System — Design Doc
**Date:** 2026-02-22
**Project:** Rive (Shore)
**Status:** Approved

---

## Overview

Add a full transactional email system to Rive using **Resend** for delivery and **React Email** for templates. Covers 6 email types across the user lifecycle: signup, trial management, and billing events.

**Sender:** `dock@rivehub.com`
**Primary language:** French

---

## Dependencies

```
resend
@react-email/components
```

---

## Architecture

### New Files

| File | Purpose |
|---|---|
| `/src/emails/WelcomeEmail.tsx` | Welcome email sent on signup |
| `/src/emails/TrialWarningEmail.tsx` | Shared template for 7-day and 3-day warnings (parametrized) |
| `/src/emails/TrialExpiredEmail.tsx` | Trial expired notification |
| `/src/emails/PaymentConfirmationEmail.tsx` | Subscription purchase confirmation |
| `/src/emails/SubscriptionCancelledEmail.tsx` | Cancellation confirmation + win-back |
| `/src/lib/email.ts` | Resend client + typed `sendEmail()` utility |
| `/src/app/api/cron/trial-check/route.ts` | Daily cron endpoint |
| `/supabase/migration_v7_email_tracking.sql` | Email sent state columns |

### Modified Files

| File | Change |
|---|---|
| `/src/app/api/notify-signup/route.ts` | Add welcome email trigger |
| `/src/app/api/stripe/webhook/route.ts` | Add payment confirmation + cancellation email triggers |
| `/vercel.json` | Add cron schedule entry |
| `.env.example` | Document new env vars |

### New Environment Variables

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API authentication |
| `CRON_SECRET` | Protects the cron endpoint from unauthorized calls |

---

## Trigger Points

| Email | Event | Location |
|---|---|---|
| Welcome | After signup | `POST /api/notify-signup` (already called client-side after signup) |
| Trial 7-day warning | Daily cron, 7 days before expiry | `POST /api/cron/trial-check` |
| Trial 3-day warning | Daily cron, 3 days before expiry | `POST /api/cron/trial-check` |
| Trial expired | Daily cron, day of/after expiry | `POST /api/cron/trial-check` |
| Payment confirmation | Stripe `checkout.session.completed` | `/src/app/api/stripe/webhook/route.ts` |
| Subscription cancelled | Stripe `customer.subscription.deleted` | `/src/app/api/stripe/webhook/route.ts` |

---

## Cron Job Logic

**Schedule:** Daily at 09:00 UTC (`0 9 * * *` in vercel.json)
**Security:** Validates `Authorization: Bearer {CRON_SECRET}` header

```
POST /api/cron/trial-check
  → Query all restaurant_settings WHERE subscription_tier = 'trial'
  → For each restaurant:
      if trial_ends_at - now() <= 7 days AND NOT email_trial_7_sent:
          send 7-day warning, set email_trial_7_sent = true
      if trial_ends_at - now() <= 3 days AND NOT email_trial_3_sent:
          send 3-day warning, set email_trial_3_sent = true
      if trial_ends_at < now() AND NOT email_trial_expired_sent:
          send expired email, set email_trial_expired_sent = true
```

Flags prevent duplicate sends if the cron runs multiple times or is retried.

---

## Database Migration (v7)

Add 3 boolean columns to `restaurant_settings`:

```sql
ALTER TABLE restaurant_settings
  ADD COLUMN email_trial_7_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN email_trial_3_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN email_trial_expired_sent BOOLEAN NOT NULL DEFAULT FALSE;
```

---

## Email Templates

### Design System
- **Primary color:** Clay `#CC5833` (dominant — CTAs, accents, highlights)
- **Secondary color:** Moss `#2E4036` (headings, footer)
- **Background:** Cream `#F2F0E9`
- **Text:** Charcoal `#1A1A1A`
- **Font:** System sans-serif stack (email client safe)
- **Style:** Organic, warm, premium — consistent with landing page aesthetic

### Email Content

| Email | Subject | Key Content |
|---|---|---|
| Welcome | `Bienvenue sur Rive 🌊` | Greeting, 14-day trial reminder, 2-3 quick-start tips, CTA → dashboard |
| Trial 7-day warning | `Votre essai Rive se termine dans 7 jours` | Features recap, upgrade CTA → pricing page |
| Trial 3-day warning | `Plus que 3 jours pour profiter de Rive` | Urgency tone, upgrade CTA with tier comparison |
| Trial expired | `Votre essai Rive est terminé` | What they lose, what they keep (Essential), upgrade CTA |
| Payment confirmation | `Bienvenue dans l'équipe Rive ✓` | Thank you, tier name + included features, CTA → dashboard |
| Subscription cancelled | `Votre abonnement Rive a été annulé` | Confirmation, remaining access, win-back message |

All CTAs use Clay `#CC5833` as the button background color.

---

## `sendEmail()` Utility

Located in `/src/lib/email.ts`, wraps Resend with a typed interface:

```ts
type EmailPayload =
  | { type: 'welcome'; to: string; restaurantName: string }
  | { type: 'trial_warning'; to: string; restaurantName: string; daysLeft: number }
  | { type: 'trial_expired'; to: string; restaurantName: string }
  | { type: 'payment_confirmation'; to: string; restaurantName: string; tier: string }
  | { type: 'subscription_cancelled'; to: string; restaurantName: string };

export async function sendEmail(payload: EmailPayload): Promise<void>
```

Non-blocking — all callers use fire-and-forget (`.catch(() => {})`) so email failures never break the main user flow.

---

## Security Notes

- Cron route validates `Authorization: Bearer {CRON_SECRET}` — rejects with 401 if missing/wrong
- Resend API key stored server-side only (not `NEXT_PUBLIC_`)
- Email sending is always non-blocking and never surfaces errors to end users
- No PII stored in email tracking columns (only boolean flags)