import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = '약속 날짜 정하기';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 120, marginBottom: 20 }}>📅</div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 'bold',
            marginBottom: 16,
          }}
        >
          약속 날짜 정하기
        </div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          친구들과 함께 가능한 날짜를 선택하세요
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
