import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import RoomContent from './RoomContent';

type Props = {
  params: Promise<{ roomId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomId } = await params;

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

  return {
    title: roomName,
    description: `${roomName} - 가능한 날짜를 선택해주세요`,
    openGraph: {
      title: roomName,
      description: '가능한 날짜를 선택해주세요',
      type: 'website',
    },
  };
}

export default async function RoomPage({ params }: Props) {
  const { roomId } = await params;
  return <RoomContent roomId={roomId} />;
}
