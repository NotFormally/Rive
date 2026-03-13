import {
  Html, Head, Body, Container, Heading, Text, Button, Hr
} from '@react-email/components';

interface OnboardingNudgeEmailProps {
  restaurantName: string;
  daysSinceSignup: number;
  variant: '7d' | '14d' | '30d';
  quotaUsage?: { metric: string; used: number; limit: number }[];
}

export function OnboardingNudgeEmail({
  restaurantName,
  daysSinceSignup,
  variant,
  quotaUsage,
}: OnboardingNudgeEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <div style={header}>
            <Heading style={logo}>R I V E</Heading>
          </div>

          {/* Main */}
          <div style={main}>
            {variant === '7d' && (
              <>
                <Heading style={h1}>
                  7 jours sur Rive — comment ça va, {restaurantName} ?
                </Heading>
                <Text style={text}>
                  Vous êtes sur Rive depuis une semaine. Voici 3 actions pour tirer le maximum de votre compte gratuit :
                </Text>
                <div style={tipBox}>
                  <Text style={tipItem}>📸 <strong>Scannez une facture</strong> — Notre OCR extrait les prix automatiquement. Vous avez 10 scans gratuits par mois.</Text>
                  <Text style={tipItem}>📊 <strong>Lancez une analyse de menu</strong> — Découvrez vos plats stars avec la matrice BCG. 3 analyses gratuites par mois.</Text>
                  <Text style={tipItem}>📝 <strong>Notez dans le carnet de bord</strong> — L'IA classe et traduit vos observations. 50 notes par mois.</Text>
                </div>
              </>
            )}

            {variant === '14d' && (
              <>
                <Heading style={h1}>
                  2 semaines sur Rive — votre résumé
                </Heading>
                <Text style={text}>
                  Voici ce que {restaurantName} a accompli jusqu'ici :
                </Text>
                {quotaUsage && quotaUsage.length > 0 && (
                  <div style={tipBox}>
                    {quotaUsage.map((q, i) => (
                      <Text key={i} style={tipItem}>
                        {q.metric} : <strong>{q.used}</strong> / {q.limit === -1 ? '∞' : q.limit}
                      </Text>
                    ))}
                  </div>
                )}
                <Text style={text}>
                  Avec <strong>Essence (19 €/mois)</strong>, débloquez des scans et analyses illimités pour votre carnet, vos factures et vos posts Instagram.
                </Text>
              </>
            )}

            {variant === '30d' && (
              <>
                <Heading style={h1}>
                  Un mois avec Rive — prêt à passer au niveau supérieur ?
                </Heading>
                <Text style={text}>
                  {restaurantName} utilise Rive depuis 30 jours. Si vous atteignez les limites de votre compte gratuit, voici ce que chaque plan débloque :
                </Text>
                <div style={tipBox}>
                  <Text style={tipItem}><strong>Essence (19 €/mois)</strong> — Carnet, factures et Instagram illimités + gestion des consignes.</Text>
                  <Text style={tipItem}><strong>Performance (49 €/mois)</strong> — Tout Essence + suivi des écarts, production, réservations.</Text>
                  <Text style={tipItem}><strong>Intelligence (99 €/mois)</strong> — Tout Performance + prévisions IA (Smart Prep) et pilotage prédictif.</Text>
                </div>
              </>
            )}

            <Button style={button} href="https://rivehub.com/fr/dashboard">
              Accéder à mon tableau de bord →
            </Button>
          </div>

          <Hr style={hr} />

          {/* Footer */}
          <Text style={footer}>
            Rive · dock@rivehub.com · Montréal, QC
          </Text>
          <Text style={unsubscribe}>
            Vous recevez cet email car vous avez un compte Rive.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles (matching WelcomeEmail pattern)
const body = { backgroundColor: '#F2F0E9', margin: '0', padding: '0' };
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' };
const header = { backgroundColor: '#CC5833', borderRadius: '12px 12px 0 0', padding: '24px 32px', marginBottom: '0' };
const logo = { color: '#F2F0E9', fontSize: '20px', fontWeight: '600', margin: '0', letterSpacing: '0.3em', textTransform: 'uppercase' as const };
const main = { backgroundColor: '#ffffff', padding: '32px', borderRadius: '0 0 12px 12px', marginBottom: '24px' };
const h1 = { color: '#2E4036', fontSize: '22px', fontWeight: '700', margin: '0 0 16px 0', lineHeight: '1.3' };
const text = { color: '#1A1A1A', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0' };
const tipBox = { backgroundColor: '#F2F0E9', borderRadius: '8px', padding: '16px 20px', marginBottom: '28px' };
const tipItem = { color: '#1A1A1A', fontSize: '14px', lineHeight: '1.7', margin: '0 0 8px 0' };
const button = { backgroundColor: '#CC5833', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '0' };
const unsubscribe = { color: '#d1d5db', fontSize: '11px', textAlign: 'center' as const, margin: '8px 0 0 0' };
