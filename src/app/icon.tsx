import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#0f1419',
          color: '#d6b35a',
          display: 'flex',
          fontSize: 14,
          fontWeight: 700,
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        NL
      </div>
    ),
    size
  );
}
