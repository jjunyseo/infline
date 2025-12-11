'use client';

import { useState } from 'react';
import { useLines } from '@/store/useLines';
import { SidebarTab } from '@/types';
import LineCreator from './LineCreator';
import LineListPanel from './LineListPanel';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('create');
  const { lines, zones } = useLines();

  const totalCount = lines.length + zones.length;

  return (
    <div className="absolute top-0 left-0 h-full z-20">
      <div className="h-full w-80 bg-[#0a0a0f]/95 backdrop-blur-md border-r border-[#3a3a4a] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-[#3a3a4a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4264fb] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">∞</span>
            </div>
            <span className="text-lg font-bold text-white">infline</span>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-[#3a3a4a]">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-sm font-medium transition-colors
              ${activeTab === 'create'
                ? 'text-[#4264fb] border-b-2 border-[#4264fb]'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            만들기
          </button>
          <button
            onClick={() => setActiveTab('lines')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative
              ${activeTab === 'lines'
                ? 'text-[#4264fb] border-b-2 border-[#4264fb]'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            내 기록
            {totalCount > 0 && (
              <span className="absolute top-2 right-4 w-5 h-5 bg-[#4264fb] rounded-full text-xs text-white flex items-center justify-center">
                {totalCount}
              </span>
            )}
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'create' && <LineCreator />}
          {activeTab === 'lines' && <LineListPanel />}
        </div>
      </div>
    </div>
  );
}
