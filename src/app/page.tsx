'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Room } from '@/lib/supabase';
import { verifyPassword } from './actions';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

function generateRoomId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const router = useRouter();

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRooms(data);
    }
    setIsLoadingRooms(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms();
    }
  }, [isAuthenticated]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isVerifying) return;

    setIsVerifying(true);
    setPasswordError('');

    const isValid = await verifyPassword(password);

    if (isValid) {
      setIsAuthenticated(true);
    } else {
      setPasswordError('비밀번호가 올바르지 않습니다');
    }

    setIsVerifying(false);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || isCreating) return;

    setIsCreating(true);

    const roomId = generateRoomId();
    const { error } = await supabase
      .from('rooms')
      .insert({ id: roomId, name: roomName.trim() });

    if (error) {
      console.error('Error creating room:', error);
      alert('방 생성에 실패했습니다. 다시 시도해주세요.');
      setIsCreating(false);
      return;
    }

    setRoomName('');
    setIsCreating(false);
    fetchRooms();

    const link = `${window.location.origin}/${roomId}`;
    await navigator.clipboard.writeText(link);
    alert('일정이 생성되었습니다! 링크가 클립보드에 복사되었습니다.');
  };

  const copyRoomLink = async (roomId: string) => {
    const link = `${window.location.origin}/${roomId}`;
    await navigator.clipboard.writeText(link);
    alert('링크가 복사되었습니다!');
  };

  const deleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`"${roomName}" 일정을 삭제하시겠습니까?`)) return;

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (error) {
      console.error('Error deleting room:', error);
      alert('삭제에 실패했습니다.');
      return;
    }

    fetchRooms();
  };

  // 비밀번호 입력 화면
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
            약속 날짜 정하기
          </h1>
          <p className="text-center text-gray-500 mb-8">
            관리자 비밀번호를 입력하세요
          </p>

          <form onSubmit={handlePasswordSubmit} className="bg-white p-6 rounded-xl shadow-lg">
            <label className="block mb-2 font-medium text-gray-700">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 mb-2"
            />
            {passwordError && (
              <p className="text-red-500 text-sm mb-2">{passwordError}</p>
            )}
            <button
              type="submit"
              disabled={!password.trim() || isVerifying}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium mt-2"
            >
              {isVerifying ? '확인 중...' : '확인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          약속 날짜 정하기
        </h1>

        {/* 새 일정 만들기 */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">새 일정 만들기</h2>
          <form onSubmit={handleCreateRoom} className="flex gap-2">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="예: 2월 정기 모임"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
            <button
              type="submit"
              disabled={!roomName.trim() || isCreating}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium whitespace-nowrap"
            >
              {isCreating ? '생성 중...' : '만들기'}
            </button>
          </form>
        </div>

        {/* 방 목록 */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            현재 방 목록 ({rooms.length}개)
          </h2>

          {isLoadingRooms ? (
            <p className="text-gray-500 text-center py-4">로딩 중...</p>
          ) : rooms.length === 0 ? (
            <p className="text-gray-500 text-center py-4">생성된 일정이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">
                      {room.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(parseISO(room.created_at), 'yyyy년 M월 d일 생성', { locale: ko })}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => router.push(`/${room.id}`)}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      열기
                    </button>
                    <button
                      onClick={() => copyRoomLink(room.id)}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      링크
                    </button>
                    <button
                      onClick={() => deleteRoom(room.id, room.name)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
