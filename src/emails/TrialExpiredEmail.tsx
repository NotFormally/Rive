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
              <Text style={statusKeep}>✅ Carnet de bord</Text>
              <Text style={statusKeep}>✅ Éditeur de menu & QR code</Text>
              <Text style={statusLost}>❌ Analyse des coûts (Performance et +)</Text>
              <Text style={statusLost}>❌ Ingénierie de menu (Performance et +)</Text>
              <Text style={statusLost}>❌ Générateur Instagram (Performance et +)</Text>
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
const statusKeep = { color: '#1A1A1A', fontSize: '14px', lineHeight: '1.7', margin: '0 0 4px 0' };
const statusLost = { color: '#9ca3af', fontSize: '14px', lineHeight: '1.7', margin: '0 0 4px 0' };
const button = { backgroundColor: '#CC5833', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' };
const subtext = { color: '#9ca3af', fontSize: '12px', margin: '16px 0 0 0' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '0' };
