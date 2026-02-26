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
  welcome: 'Bienvenue sur Rive \u{1F30A}',
  trial_warning: (p) =>
    p.type === 'trial_warning'
      ? `Votre essai Rive se termine dans ${p.daysLeft} jours`
      : '',
  trial_expired: 'Votre essai Rive est termin\u00e9',
  payment_confirmation: 'Bienvenue dans l\'\u00e9quipe Rive \u2713',
  subscription_cancelled: 'Votre abonnement Rive a \u00e9t\u00e9 annul\u00e9',
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
