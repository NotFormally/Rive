import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { PaymentConfirmationEmail } from '@/emails/PaymentConfirmationEmail';
import { SubscriptionCancelledEmail } from '@/emails/SubscriptionCancelledEmail';
import { TeamInviteEmail } from '@/emails/TeamInviteEmail';
import { MonthlyReportEmail } from '@/emails/MonthlyReportEmail';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_fallback_for_build');
const FROM = 'Rive <dock@rivehub.com>';

export type EmailPayload =
  | { type: 'welcome'; to: string; restaurantName: string }
  | { type: 'payment_confirmation'; to: string; restaurantName: string; tier: string }
  | { type: 'subscription_cancelled'; to: string; restaurantName: string }
  | { type: 'team_invite'; to: string; restaurantName: string; roleName: string; inviteUrl: string }
  | { type: 'monthly_report'; to: string; restaurantName: string; month: string; learnings: string[]; feedbackCount: number; accuracyImprovement: number; siteUrl: string }
  | { type: 'churn_alert'; to: string; restaurantName: string; daysSinceLastFeedback: number; calibrationCount: number; feedbackDays: number };

const SUBJECTS: Record<EmailPayload['type'], string | ((p: EmailPayload) => string)> = {
  welcome: 'Bienvenue sur Rive \u{1F30A}',
  payment_confirmation: 'Bienvenue dans l\'\u00e9quipe Rive \u2713',
  subscription_cancelled: 'Votre abonnement Rive a \u00e9t\u00e9 annul\u00e9',
  team_invite: (p) =>
    p.type === 'team_invite'
      ? `Invitation à rejoindre l'équipe de ${p.restaurantName} sur Rive`
      : '',
  monthly_report: (p) =>
    p.type === 'monthly_report'
      ? `Rapport mensuel Rive — ${p.month}`
      : '',
  churn_alert: (p) =>
    p.type === 'churn_alert'
      ? `${p.restaurantName} — Rive attend vos retours`
      : '',
};

function getSubject(payload: EmailPayload): string {
  const s = SUBJECTS[payload.type];
  return typeof s === 'function' ? s(payload) : s;
}

function getReactComponent(payload: EmailPayload) {
  switch (payload.type) {
    case 'welcome':
      return WelcomeEmail({ restaurantName: payload.restaurantName });
    case 'payment_confirmation':
      return PaymentConfirmationEmail({ restaurantName: payload.restaurantName, tier: payload.tier });
    case 'subscription_cancelled':
      return SubscriptionCancelledEmail({ restaurantName: payload.restaurantName });
    case 'team_invite':
      return TeamInviteEmail({
         restaurantName: payload.restaurantName,
         roleName: payload.roleName,
         inviteUrl: payload.inviteUrl
      });
    case 'monthly_report':
      return MonthlyReportEmail({
        restaurantName: payload.restaurantName,
        month: payload.month,
        learnings: payload.learnings,
        feedbackCount: payload.feedbackCount,
        accuracyImprovement: payload.accuracyImprovement,
        siteUrl: payload.siteUrl,
      });
    case 'churn_alert':
      // Simple text email — no dedicated template needed
      return null;
  }
}

function getTextBody(payload: EmailPayload): string | null {
  if (payload.type === 'churn_alert') {
    return [
      `Bonjour,`,
      ``,
      `Cela fait ${payload.daysSinceLastFeedback} jours que l'équipe de ${payload.restaurantName} n'a pas calibré ses prévisions sur Rive.`,
      ``,
      `Jusqu'ici, vous avez enregistré ${payload.calibrationCount} calibration${payload.calibrationCount > 1 ? 's' : ''} sur ${payload.feedbackDays} jour${payload.feedbackDays > 1 ? 's' : ''} d'activité. Chaque retour améliore la précision de vos prévisions — ne perdez pas votre élan.`,
      ``,
      `Connectez-vous pour reprendre : https://rivehub.com/dashboard/prep`,
      ``,
      `— L'équipe Rive`,
      `dock@rivehub.com`,
    ].join('\n');
  }
  return null;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email send');
    return;
  }

  const reactComponent = getReactComponent(payload);
  const textBody = getTextBody(payload);

  const emailOptions: any = {
    from: FROM,
    to: payload.to,
    subject: getSubject(payload),
  };

  if (reactComponent) {
    emailOptions.react = reactComponent;
  } else if (textBody) {
    emailOptions.text = textBody;
  }

  const { error } = await resend.emails.send(emailOptions);

  if (error) {
    console.error(`[email] Failed to send ${payload.type} to ${payload.to}:`, error);
  } else {
    console.log(`[email] Sent ${payload.type} to ${payload.to}`);
  }
}
