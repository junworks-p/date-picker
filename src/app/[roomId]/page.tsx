'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { DayPicker } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase, DateSelection, Room } from '@/lib/supabase';
import 'react-day-picker/dist/style.css';

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [name, setName] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [allSelections, setAllSelections] = useState<DateSelection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [savedName, setSavedName] = useState('');

  // 방 정보 및 선택 데이터 불러오기
  const fetchRoomAndSelections = async () => {
    // 방 정보 가져오기
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !roomData) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setRoom(roomData);

    // 선택 데이터 가져오기
    const { data, error } = await supabase
      .from('date_selections')
      .select('*')
      .eq('room_id', roomId)
      .order('selected_date', { ascending: true });

    if (error) {
      console.error('Error fetching selections:', error);
      return;
    }

    setAllSelections(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRoomAndSelections();

    // 실시간 업데이트 구독
    const channel = supabase
      .channel(`room_${roomId}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'date_selections',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchRoomAndSelections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // 이름으로 기존 선택 불러오기
  const loadUserSelections = (userName: string) => {
    const userSelections = allSelections.filter((s) => s.name === userName);
    const dates = userSelections.map((s) => parseISO(s.selected_date));
    setSelectedDates(dates);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setSavedName(name.trim());
      loadUserSelections(name.trim());
    }
  };

  const handleDayClick = async (day: Date) => {
    if (!savedName) return;

    const dateStr = format(day, 'yyyy-MM-dd');
    const isSelected = selectedDates.some(
      (d) => format(d, 'yyyy-MM-dd') === dateStr
    );

    if (isSelected) {
      // 선택 해제
      const { error } = await supabase
        .from('date_selections')
        .delete()
        .eq('room_id', roomId)
        .eq('name', savedName)
        .eq('selected_date', dateStr);

      if (!error) {
        setSelectedDates(selectedDates.filter(
          (d) => format(d, 'yyyy-MM-dd') !== dateStr
        ));
      }
    } else {
      // 선택 추가
      const { error } = await supabase
        .from('date_selections')
        .insert({ room_id: roomId, name: savedName, selected_date: dateStr });

      if (!error) {
        setSelectedDates([...selectedDates, day]);
      }
    }

    fetchRoomAndSelections();
  };

  // 날짜별 선택자 수 계산
  const getDateCounts = () => {
    const counts: { [key: string]: string[] } = {};
    allSelections.forEach((s) => {
      if (!counts[s.selected_date]) {
        counts[s.selected_date] = [];
      }
      counts[s.selected_date].push(s.name);
    });
    return counts;
  };

  const dateCounts = getDateCounts();

  // 모든 사람이 가능한 날짜 찾기
  const uniqueNames = [...new Set(allSelections.map((s) => s.name))];
  const allAvailableDates = Object.entries(dateCounts)
    .filter(([, names]) => names.length === uniqueNames.length && uniqueNames.length > 0)
    .map(([date]) => date);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    alert('링크가 복사되었습니다!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">일정을 찾을 수 없습니다</h1>
        <p className="text-gray-500 mb-6">링크가 잘못되었거나 삭제된 일정입니다.</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          새 일정 만들기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {room?.name}
          </h1>
          <button
            onClick={copyLink}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            링크 복사하기
          </button>
        </div>

        {/* 이름 입력 */}
        {!savedName ? (
          <form onSubmit={handleNameSubmit} className="mb-8">
            <div className="flex gap-2 justify-center">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                확인
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center mb-6">
            <span className="text-lg text-gray-700">
              안녕하세요, <strong>{savedName}</strong>님! 가능한 날짜를 선택해주세요.
            </span>
            <button
              onClick={() => {
                setSavedName('');
                setSelectedDates([]);
              }}
              className="ml-4 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              이름 변경
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* 달력 */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <DayPicker
              mode="multiple"
              selected={selectedDates}
              onDayClick={savedName ? handleDayClick : undefined}
              locale={ko}
              modifiers={{
                allAvailable: allAvailableDates.map((d) => parseISO(d)),
              }}
              modifiersStyles={{
                allAvailable: {
                  border: '2px solid #10b981',
                  borderRadius: '50%',
                },
              }}
              styles={{
                caption: { color: '#1f2937' },
                head_cell: { color: '#6b7280' },
                day: { color: '#1f2937' },
              }}
              className="mx-auto"
              disabled={!savedName}
            />
            {savedName && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                날짜를 클릭하면 선택/해제됩니다
              </p>
            )}
          </div>

          {/* 선택 현황 */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">선택 현황</h2>

            {/* 모두 가능한 날짜 */}
            {allAvailableDates.length > 0 && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">
                  모두 가능한 날짜
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allAvailableDates.map((date) => (
                    <span
                      key={date}
                      className="px-3 py-1 bg-green-500 text-white rounded-full text-sm"
                    >
                      {format(parseISO(date), 'M/d (EEE)', { locale: ko })}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 날짜별 현황 */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {Object.entries(dateCounts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, names]) => (
                  <div
                    key={date}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-700">
                      {format(parseISO(date), 'M월 d일 (EEE)', { locale: ko })}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {names.map((n) => (
                          <span
                            key={n}
                            className={`px-2 py-0.5 rounded text-xs ${
                              n === savedName
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 min-w-[2rem] text-right">
                        {names.length}명
                      </span>
                    </div>
                  </div>
                ))}
              {Object.keys(dateCounts).length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  아직 선택된 날짜가 없습니다
                </p>
              )}
            </div>

            {/* 참여자 목록 */}
            {uniqueNames.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium text-gray-700 mb-2">
                  참여자 ({uniqueNames.length}명)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueNames.map((n) => (
                    <span
                      key={n}
                      className={`px-3 py-1 rounded-full text-sm ${
                        n === savedName
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            새 일정 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
