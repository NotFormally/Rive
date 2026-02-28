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
            <Heading style={logo}>R I V E</Heading>
          </div>

          {/* Main */}
          <div style={main}>
            <Heading style={h1}>Bienvenue sur Rive, {restaurantName} 🌊</Heading>
            <Text style={text}>
              Votre compte gratuit est prêt. Voici par où commencer :
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
const logo = { color: '#F2F0E9', fontSize: '20px', fontWeight: '600', margin: '0', letterSpacing: '0.3em', textTransform: 'uppercase' as const };
const main = { backgroundColor: '#ffffff', padding: '32px', borderRadius: '0 0 12px 12px', marginBottom: '24px' };
const h1 = { color: '#2E4036', fontSize: '22px', fontWeight: '700', margin: '0 0 16px 0', lineHeight: '1.3' };
const text = { color: '#1A1A1A', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0' };
const tipBox = { backgroundColor: '#F2F0E9', borderRadius: '8px', padding: '16px 20px', marginBottom: '28px' };
const tipItem = { color: '#1A1A1A', fontSize: '14px', lineHeight: '1.7', margin: '0 0 8px 0' };
const button = { backgroundColor: '#CC5833', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '0' };
