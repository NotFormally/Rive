import {
  Html, Head, Body, Container, Heading, Text, Button, Hr
} from '@react-email/components';

interface MonthlyReportEmailProps {
  restaurantName: string;
  month: string; // e.g., "février 2026"
  learnings: string[];
  feedbackCount: number;
  accuracyImprovement: number; // percentage points
  siteUrl: string;
}

export function MonthlyReportEmail({
  restaurantName,
  month,
  learnings,
  feedbackCount,
  accuracyImprovement,
  siteUrl,
}: MonthlyReportEmailProps) {
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
            <Heading style={h1}>
              Rapport mensuel — {month}
            </Heading>
            <Text style={text}>
              Ce mois-ci, Rive a appris {learnings.length} nouvelle{learnings.length > 1 ? 's' : ''} chose{learnings.length > 1 ? 's' : ''} sur {restaurantName}.
            </Text>

            {/* Learnings */}
            <div style={learningsBox}>
              {learnings.map((learning, i) => (
                <Text key={i} style={learningItem}>
                  {learning}
                </Text>
              ))}
            </div>

            {/* Stats */}
            <div style={statsRow}>
              <div style={statCard}>
                <Text style={statNumber}>{feedbackCount}</Text>
                <Text style={statLabel}>calibrations</Text>
              </div>
              <div style={statCard}>
                <Text style={statNumber}>
                  {accuracyImprovement >= 0 ? '+' : ''}{accuracyImprovement}%
                </Text>
                <Text style={statLabel}>de précision</Text>
              </div>
            </div>

            <Button style={button} href={`${siteUrl}/dashboard/my-intelligence`}>
              Voir le rapport complet
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

// Styles (matching WelcomeEmail pattern)
const body = { backgroundColor: '#F2F0E9', margin: '0', padding: '0' };
const container = { maxWidth: '560px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' };
const header = { backgroundColor: '#CC5833', borderRadius: '12px 12px 0 0', padding: '24px 32px', marginBottom: '0' };
const logo = { color: '#F2F0E9', fontSize: '20px', fontWeight: '600', margin: '0', letterSpacing: '0.3em', textTransform: 'uppercase' as const };
const main = { backgroundColor: '#ffffff', padding: '32px', borderRadius: '0 0 12px 12px', marginBottom: '24px' };
const h1 = { color: '#2E4036', fontSize: '22px', fontWeight: '700', margin: '0 0 16px 0', lineHeight: '1.3' };
const text = { color: '#1A1A1A', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px 0' };
const learningsBox = { backgroundColor: '#F2F0E9', borderRadius: '8px', padding: '16px 20px', marginBottom: '28px' };
const learningItem = { color: '#1A1A1A', fontSize: '14px', lineHeight: '1.7', margin: '0 0 8px 0', paddingLeft: '8px', borderLeft: '3px solid #CC5833' };
const statsRow = { display: 'flex' as const, gap: '16px', marginBottom: '28px' };
const statCard = { flex: '1', backgroundColor: '#F2F0E9', borderRadius: '8px', padding: '16px', textAlign: 'center' as const };
const statNumber = { color: '#CC5833', fontSize: '28px', fontWeight: '700', margin: '0 0 4px 0', lineHeight: '1' };
const statLabel = { color: '#6b7280', fontSize: '13px', margin: '0' };
const button = { backgroundColor: '#CC5833', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0' };
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: '0' };
