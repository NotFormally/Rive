import {
  Html, Head, Body, Container, Heading, Text, Button, Hr
} from '@react-email/components';

interface TeamInviteEmailProps {
  restaurantName: string;
  roleName: string;
  inviteUrl: string;
}

export function TeamInviteEmail({ restaurantName, roleName, inviteUrl }: TeamInviteEmailProps) {
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
            <Heading style={h1}>Invitation à rejoindre l'équipe</Heading>
            <Text style={text}>
              Bonjour,
              <br /><br />
              Vous avez été invité(e) à rejoindre l'espace de travail <strong>{restaurantName}</strong> sur Rive, en tant que <strong>{roleName}</strong>.
            </Text>

            <div style={tipBox}>
              <Text style={tipItem}>Rive est une plateforme tout-en-un pour la gestion de votre restaurant : menus intelligents, suivi des coûts, réservations unifiées et plus encore.</Text>
            </div>

            <Button style={button} href={inviteUrl}>
              Accepter l'invitation →
            </Button>
            
            <Text style={subtext}>
              Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet e-mail en toute sécurité. Le lien expirera automatiquement.
            </Text>
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
const header = { backgroundColor: '#1A1A1A', borderRadius: '12px 12px 0 0', padding: '24px 32px', marginBottom: '0' };
const logo = { color: '#F2F0E9', fontSize: '24px', fontWeight: '700', margin: '0', letterSpacing: '-0.5px' };
const main = { backgroundColor: '#ffffff', padding: '32px', borderRadius: '0 0 12px 12px', marginBottom: '24px' };
const h1 = { color: '#2E4036', fontSize: '22px', fontWeight: '700', margin: '0 0 16px 0', lineHeight: '1.3' };
const text = { color: '#1A1A1A', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0' };
const tipBox = { backgroundColor: '#F2F0E9', borderLeft: '4px solid #CC5833', borderRadius: '4px 8px 8px 4px', padding: '16px 20px', marginBottom: '28px' };
const tipItem = { color: '#1A1A1A', fontSize: '14px', lineHeight: '1.7', margin: '0' };
const button = { backgroundColor: '#CC5833', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' };
const subtext = { color: '#6b7280', fontSize: '13px', lineHeight: '1.5', margin: '0' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '0' };
