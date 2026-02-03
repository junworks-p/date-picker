'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { verifyPassword } from './actions';

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
  const [createdLink, setCreatedLink] = useState('');
  const router = useRouter();

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

    const link = `${window.location.origin}/${roomId}`;
    setCreatedLink(link);
    setIsCreating(false);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(createdLink);
    alert('링크가 복사되었습니다!');
  };

  const goToRoom = () => {
    const roomId = createdLink.split('/').pop();
    router.push(`/${roomId}`);
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
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          약속 날짜 정하기
        </h1>
        <p className="text-center text-gray-500 mb-8">
          새 일정을 만들고 친구들에게 링크를 공유하세요
        </p>

        {!createdLink ? (
          <form onSubmit={handleCreateRoom} className="bg-white p-6 rounded-xl shadow-lg">
            <label className="block mb-2 font-medium text-gray-700">
              일정 이름
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="예: 2월 정기 모임"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 mb-4"
            />
            <button
              type="submit"
              disabled={!roomName.trim() || isCreating}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {isCreating ? '생성 중...' : '새 일정 만들기'}
            </button>
          </form>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                일정이 생성되었습니다!
              </h2>
              <p className="text-gray-500 text-sm">
                아래 링크를 친구들에게 공유하세요
              </p>
            </div>

            <div className="bg-gray-100 p-3 rounded-lg mb-4 break-all text-sm text-gray-700">
              {createdLink}
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                링크 복사
              </button>
              <button
                onClick={goToRoom}
                className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                일정으로 이동
              </button>
            </div>

            <button
              onClick={() => {
                setCreatedLink('');
                setRoomName('');
              }}
              className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              다른 일정 만들기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
