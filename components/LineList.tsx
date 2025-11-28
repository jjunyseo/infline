'use client';

import { useLines } from '@/store/useLines';

export default function LineList() {
  const { lines, removeLine } = useLines();

  if (lines.length === 0) return null;

  return (
    <div className="absolute bottom-6 left-6 z-10 bg-[#1a1a24]/90 backdrop-blur-sm border border-[#3a3a4a] rounded-xl p-4 w-72">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">
        내가 만든 선 ({lines.length})
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {lines.map((line) => (
          <div
            key={line.id}
            className="flex items-center justify-between p-3 bg-[#2a2a3a] rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: line.color }}
              />
              <div>
                <p className="text-sm text-white">
                  {new Date(line.createdAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}에 생성
                </p>
                <p className="text-xs text-gray-500">24시간 후 만료</p>
              </div>
            </div>
            <button
              onClick={() => removeLine(line.id)}
              className="text-gray-500 hover:text-red-400 transition-colors p-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

