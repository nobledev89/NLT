import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'New Life Tagum';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0f0d0b 0%, #1a1510 60%, #0f0d0b 100%)',
          color: '#efe9e1',
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 8, textTransform: 'uppercase', color: '#d6ad6a' }}>
          Welcome to
        </div>
        <div style={{ fontSize: 96, fontWeight: 600, marginTop: 16 }}>New Life Tagum</div>
        <div style={{ fontSize: 34, color: '#b8af9f', marginTop: 24, maxWidth: 900 }}>
          A welcoming family of faith in the heart of Tagum.
        </div>
        <div style={{ fontSize: 22, color: '#8a8175', marginTop: 48 }}>
          1489 Manuel B. Suaybaguio Sr. St, Tagum, Davao del Norte
        </div>
      </div>
    ),
    { ...size }
  );
}
