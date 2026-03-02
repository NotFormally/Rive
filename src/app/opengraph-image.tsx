import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Rive — AI-Powered Restaurant Operations Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1A1A1A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle geometric accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: '#CC5833',
          }}
        />

        {/* Logo */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: '0.3em',
            color: '#F2F0E9',
            marginBottom: 24,
          }}
        >
          RIVE
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#F2F0E9',
            opacity: 0.8,
            marginBottom: 40,
            maxWidth: 700,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          AI-Powered Restaurant Operations Platform
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 900,
          }}
        >
          {['Food Cost', 'HACCP', 'AI Logbook', 'Menu Engineering', 'OCR Scanner', '25+ Languages'].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  background: 'rgba(204, 88, 51, 0.15)',
                  border: '1px solid rgba(204, 88, 51, 0.3)',
                  borderRadius: 999,
                  padding: '8px 20px',
                  fontSize: 16,
                  color: '#CC5833',
                  letterSpacing: '0.05em',
                }}
              >
                {feature}
              </div>
            )
          )}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 16,
            color: '#F2F0E9',
            opacity: 0.4,
            letterSpacing: '0.15em',
          }}
        >
          rivehub.com
        </div>
      </div>
    ),
    { ...size }
  );
}
