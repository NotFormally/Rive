import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { PaymentConfirmationEmail } from '@/emails/PaymentConfirmationEmail';
import { SubscriptionCancelledEmail } from '@/emails/SubscriptionCancelledEmail';
import { TeamInviteEmail } from '@/emails/TeamInviteEmail';
import { MonthlyReportEmail } from '@/emails/MonthlyReportEmail';
import { OnboardingNudgeEmail } from '@/emails/OnboardingNudgeEmail';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_fallback_for_build');
const FROM = 'Rive <dock@rivehub.com>';

export type EmailPayload =
  | { type: 'welcome'; to: string; restaurantName: string }
  | { type: 'payment_confirmation'; to: string; restaurantName: string; tier: string }
  | { type: 'subscription_cancelled'; to: string; restaurantName: string }
  | { type: 'team_invite'; to: string; restaurantName: string; roleName: string; inviteUrl: string }
  | { type: 'monthly_report'; to: string; restaurantName: string; month: string; learnings: string[]; feedbackCount: number; accuracyImprovement: number; siteUrl: string }
  | { type: 'onboarding_nudge'; to: string; restaurantName: string; daysSinceSignup: number; variant: '7d' | '14d' | '30d'; quotaUsage?: { metric: string; used: number; limit: number }[] }
  | { type: 'churn_alert'; to: string; restaurantName: string; daysSinceLastFeedback: number; calibrationCount: number; feedbackDays: number }
  | { type: 'admin_signup_notification'; to: string; restaurantName: string; email: string; locale: string }
  | { type: 'admin_subscription_notification'; to: string; restaurantName: string; email: string; tier: string }
  | { type: 'support_report'; to: string; restaurantName: string; email: string; errorDetails: string; messageCount: number }
  | { type: 'churn_feedback'; to: string; restaurantName: string; email: string; reason: string; comments: string }
  | { type: 'account_deleted'; to: string; restaurantName: string }
  | { type: 'admin_account_deleted'; to: string; restaurantName: string; email: string }
  | { type: 'team_access_revoked'; to: string; restaurantName: string };

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
  onboarding_nudge: (p) =>
    p.type === 'onboarding_nudge'
      ? p.variant === '7d'
        ? `${p.restaurantName} — 7 jours sur Rive 🌊`
        : p.variant === '14d'
          ? `${p.restaurantName} — Votre résumé de 2 semaines`
          : `${p.restaurantName} — Prêt à passer au niveau supérieur ?`
      : '',
  churn_alert: (p) =>
    p.type === 'churn_alert'
      ? `${p.restaurantName} — Rive attend vos retours`
      : '',
  admin_signup_notification: (p) =>
    p.type === 'admin_signup_notification'
      ? `🚨 New Signup: ${p.restaurantName}`
      : '',
  admin_subscription_notification: (p) =>
    p.type === 'admin_subscription_notification'
      ? `💸 New Subscription: ${p.restaurantName} (${p.tier})`
      : '',
  support_report: (p) =>
    p.type === 'support_report'
      ? `🛟 Support Report: ${p.restaurantName}`
      : '',
  churn_feedback: (p) =>
    p.type === 'churn_feedback'
      ? `⚠️ Cancelled Subscription: ${p.restaurantName}`
      : '',
  account_deleted: 'Votre compte Rive a été supprimé',
  admin_account_deleted: (p) =>
    p.type === 'admin_account_deleted'
      ? `🗑️ Account Deleted: ${p.restaurantName}`
      : '',
  team_access_revoked: (p) =>
    p.type === 'team_access_revoked'
      ? `Votre accès à ${p.restaurantName} a été révoqué`
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
    case 'onboarding_nudge':
      return OnboardingNudgeEmail({
        restaurantName: payload.restaurantName,
        daysSinceSignup: payload.daysSinceSignup,
        variant: payload.variant,
        quotaUsage: payload.quotaUsage,
      });
    case 'churn_alert':
    case 'admin_signup_notification':
    case 'admin_subscription_notification':
    case 'support_report':
    case 'churn_feedback':
    case 'account_deleted':
    case 'admin_account_deleted':
    case 'team_access_revoked':
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
  if (payload.type === 'admin_signup_notification') {
    return [
      `New User Signup on Rive:`,
      ``,
      `Restaurant: ${payload.restaurantName}`,
      `Email: ${payload.email}`,
      `Locale: ${payload.locale}`,
      ``,
      `Action required: None. This is an automated notification.`,
    ].join('\n');
  }
  if (payload.type === 'admin_subscription_notification') {
    return [
      `New Subscription on Rive:`,
      ``,
      `Restaurant: ${payload.restaurantName}`,
      `Email: ${payload.email}`,
      `Tier: ${payload.tier}`,
      ``,
      `Action required: None. This is an automated notification.`,
    ].join('\n');
  }
  if (payload.type === 'support_report') {
    return [
      `Support Report from Rive user:`,
      ``,
      `Restaurant: ${payload.restaurantName}`,
      `Email: ${payload.email}`,
      `Messages in chat: ${payload.messageCount}`,
      ``,
      `Error details:`,
      payload.errorDetails || 'No specific error captured.',
      ``,
      `The full chat log has been saved in the support_reports table.`,
      `Check the admin dashboard for details.`,
    ].join('\n');
  }
  if (payload.type === 'churn_feedback') {
    return [
      `⚠️ Cancellation Feedback Received:`,
      ``,
      `Restaurant: ${payload.restaurantName}`,
      `Email: ${payload.email}`,
      `Reason: ${payload.reason}`,
      ``,
      `Additional Comments:`,
      payload.comments || 'No comments provided.',
      ``,
      `Action required: Reach out to the user if applicable.`,
    ].join('\n');
  }
  if (payload.type === 'account_deleted') {
    return [
      `Bonjour,`,
      ``,
      `Votre compte Rive pour « ${payload.restaurantName} » a été supprimé avec succès.`,
      ``,
      `Toutes les données associées à votre restaurant ont été définitivement effacées de nos serveurs :`,
      `menus, recettes, journaux, factures, configurations et intégrations.`,
      ``,
      `Les membres de votre équipe conservent leur propre compte.`,
      ``,
      `Si vous souhaitez revenir un jour, vous êtes toujours le bienvenu : https://rivehub.com`,
      ``,
      `— L'équipe Rive`,
    ].join('\n');
  }
  if (payload.type === 'admin_account_deleted') {
    return [
      `🗑️ Account Permanently Deleted:`,
      ``,
      `Restaurant: ${payload.restaurantName}`,
      `Email: ${payload.email}`,
      `Timestamp: ${new Date().toISOString()}`,
      ``,
      `All data has been purged (CASCADE). Auth user deleted.`,
      `Team members retain their accounts.`,
    ].join('\n');
  }
  if (payload.type === 'team_access_revoked') {
    return [
      `Bonjour,`,
      ``,
      `Le restaurant « ${payload.restaurantName} » a fermé son compte Rive.`,
      `Votre accès à ce restaurant a été révoqué.`,
      ``,
      `Votre propre compte Rive reste actif — vous pouvez toujours vous connecter.`,
      ``,
      `— L'équipe Rive`,
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
