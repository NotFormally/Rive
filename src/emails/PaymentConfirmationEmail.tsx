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
