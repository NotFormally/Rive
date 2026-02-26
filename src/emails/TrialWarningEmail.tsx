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
