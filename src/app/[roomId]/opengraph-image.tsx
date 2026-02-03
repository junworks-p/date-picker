import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export const alt = '약속 날짜 정하기';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  // Supabase에서 방 정보 가져오기
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: room } = await supabase
    .from('rooms')
    .select('name')
    .eq('id', roomId)
    .single();

  const roomName = room?.name || '약속 날짜 정하기';

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
            fontSize: 64,
            fontWeight: 'bold',
            marginBottom: 16,
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          {roomName}
        </div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          가능한 날짜를 선택해주세요
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
