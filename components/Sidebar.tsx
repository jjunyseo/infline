'use client';

import { useState } from 'react';
import { useLines } from '@/store/useLines';
import { SidebarTab } from '@/types';
import LineCreator from './LineCreator';
import LineListPanel from './LineListPanel';

export default function Sidebar() {
  const { isSidebarOpen, setSidebarOpen } = useLines();
  const [activeTab, setActiveTab] = useState<SidebarTab>('create');

  return (
    <>
      {/* 사이드바 토글 버튼 */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className={`absolute top-6 left-6 z-30 p-3 bg-[#1a1a24] border border-[#3a3a4a] rounded-xl 
                   text-white hover:bg-[#2a2a3a] transition-all shadow-lg
                   ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 사이드바 */}
      <div
        className={`absolute top-0 left-0 h-full z-20 transition-transform duration-300 ease-out
                   ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full w-80 bg-[#0a0a0f]/95 backdrop-blur-md border-r border-[#3a3a4a] flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-[#3a3a4a]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#4264fb] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">∞</span>
              </div>
              <span className="text-lg font-bold text-white">infline</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a3a] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
              선 만들기
            </button>
            <button
              onClick={() => setActiveTab('lines')}
              className={`flex-1 py-3 text-sm font-medium transition-colors
                ${activeTab === 'lines'
                  ? 'text-[#4264fb] border-b-2 border-[#4264fb]'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              내 선
            </button>
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'create' && <LineCreator />}
            {activeTab === 'lines' && <LineListPanel />}
          </div>
        </div>
      </div>

      {/* 오버레이 (모바일) */}
      {isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/30 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}

