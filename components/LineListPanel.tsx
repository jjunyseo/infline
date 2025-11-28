'use client';

import { useLines } from '@/store/useLines';

export default function LineListPanel() {
  const { lines, removeLine } = useLines();

  if (lines.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#1a1a24] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl opacity-50">🧵</span>
          </div>
          <h3 className="text-white font-medium mb-2">아직 선이 없습니다</h3>
          <p className="text-sm text-gray-500">
            &apos;선 만들기&apos; 탭에서 첫 번째 선을 만들어보세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">
        내가 만든 선 ({lines.length})
      </h3>

      {lines.map((line) => {
        const expiresAt = new Date(line.expiresAt);
        const now = new Date();
        const hoursLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
        const minutesLeft = Math.max(0, Math.floor(((expiresAt.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60)));

        return (
          <div
            key={line.id}
            className="p-4 bg-[#1a1a24] border border-[#3a3a4a] rounded-xl hover:border-[#4264fb]/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: line.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium truncate">
                    {line.name || `선 #${line.id.slice(-4)}`}
                  </span>
                  <button
                    onClick={() => removeLine(line.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-[#2a2a3a] rounded-full text-gray-400">
                    👥 {line.riderCount}/{line.maxRiders}
                  </span>
                  <span className="px-2 py-1 bg-[#2a2a3a] rounded-full text-gray-400">
                    ⏱️ {hoursLeft}시간 {minutesLeft}분 남음
                  </span>
                  {line.zones.length > 0 && (
                    <span className="px-2 py-1 bg-[#ff6b6b]/20 rounded-full text-[#ff6b6b]">
                      🎯 구역 {line.zones.length}개
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

