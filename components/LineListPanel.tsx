'use client';

import { useState } from 'react';
import { useLines } from '@/store/useLines';

type SubTab = 'lines' | 'zones';

export default function LineListPanel() {
  const [subTab, setSubTab] = useState<SubTab>('lines');
  const { lines, zones, removeLine, removeStandaloneZone } = useLines();

  const renderEmptyState = (type: SubTab) => {
    if (type === 'lines') {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#1a1a24] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl opacity-50">🧵</span>
          </div>
          <h3 className="text-white font-medium mb-2">아직 선이 없습니다</h3>
          <p className="text-sm text-gray-500">
            &apos;만들기&apos; 탭에서 첫 번째 선을 만들어보세요!
          </p>
        </div>
      );
    }
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[#1a1a24] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl opacity-50">⭕</span>
        </div>
        <h3 className="text-white font-medium mb-2">아직 구역이 없습니다</h3>
        <p className="text-sm text-gray-500">
          &apos;만들기&apos; 탭에서 첫 번째 구역을 만들어보세요!
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* 서브 탭 */}
      <div className="flex border-b border-[#3a3a4a] bg-[#0a0a0f]/50">
        <button
          onClick={() => setSubTab('lines')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors relative
            ${subTab === 'lines'
              ? 'text-[#4264fb] border-b-2 border-[#4264fb]'
              : 'text-gray-500 hover:text-gray-300'
            }`}
        >
          내 선
          {lines.length > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${subTab === 'lines' ? 'bg-[#4264fb]/20 text-[#4264fb]' : 'bg-[#2a2a3a] text-gray-400'}`}>
              {lines.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubTab('zones')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors relative
            ${subTab === 'zones'
              ? 'text-[#00d4aa] border-b-2 border-[#00d4aa]'
              : 'text-gray-500 hover:text-gray-300'
            }`}
        >
          내 구역
          {zones.length > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${subTab === 'zones' ? 'bg-[#00d4aa]/20 text-[#00d4aa]' : 'bg-[#2a2a3a] text-gray-400'}`}>
              {zones.length}
            </span>
          )}
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {subTab === 'lines' && (
          <>
            {lines.length === 0 ? (
              renderEmptyState('lines')
            ) : (
              <>
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
              </>
            )}
          </>
        )}

        {subTab === 'zones' && (
          <>
            {zones.length === 0 ? (
              renderEmptyState('zones')
            ) : (
              <>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  내가 만든 구역 ({zones.length})
                </h3>
                {zones.map((zone, index) => {
                  const createdAt = new Date(zone.createdAt);
                  const now = new Date();
                  const daysAgo = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                  const hoursAgo = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));

                  return (
                    <div
                      key={zone.id}
                      className="p-4 bg-[#1a1a24] border border-[#3a3a4a] rounded-xl hover:border-[#00d4aa]/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: zone.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium truncate">
                              {zone.name || `구역 #${zone.id.slice(-4)}`}
                            </span>
                            <button
                              onClick={() => removeStandaloneZone(zone.id)}
                              className="text-gray-500 hover:text-red-400 transition-colors p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-[#2a2a3a] rounded-full text-gray-400">
                              📍 반경 {zone.radius.toFixed(1)} km
                            </span>
                            <span className="px-2 py-1 bg-[#2a2a3a] rounded-full text-gray-400">
                              🕐 {daysAgo > 0 ? `${daysAgo}일 전` : `${hoursAgo}시간 전`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

