'use client';

import { useLines } from '@/store/useLines';
import SearchBox from './SearchBox';

interface ControlPanelProps {
  onFlyTo: (lng: number, lat: number) => void;
  onFlyToMyLocation: () => void;
}

export default function ControlPanel({ onFlyTo, onFlyToMyLocation }: ControlPanelProps) {
  const { creationMode, setCreationMode, userLocation } = useLines();

  const handleCreateLine = () => {
    if (creationMode === 'idle') {
      setCreationMode('selecting');
    } else {
      setCreationMode('idle');
    }
  };

  return (
    <div className="absolute top-6 left-6 z-10 flex flex-col gap-4">
      {/* 로고 */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-[#4264fb] rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">∞</span>
        </div>
        <span className="text-xl font-bold text-white">infline</span>
      </div>

      {/* 검색창 */}
      <SearchBox onSelect={(lng, lat) => onFlyTo(lng, lat)} />

      {/* 버튼들 */}
      <div className="flex gap-2">
        <button
          onClick={handleCreateLine}
          className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2
            ${creationMode === 'selecting'
              ? 'bg-[#00d4aa] text-[#0a0a0f]'
              : 'bg-[#4264fb] hover:bg-[#5a7bfc] text-white'
            }`}
        >
          {creationMode === 'selecting' ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              취소
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              선 만들기
            </>
          )}
        </button>

        <button
          onClick={onFlyToMyLocation}
          disabled={!userLocation}
          className="px-4 py-2.5 bg-[#1a1a24] border border-[#3a3a4a] rounded-lg 
                     text-white hover:bg-[#2a2a3a] transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
          </svg>
          내 위치
        </button>
      </div>
    </div>
  );
}

