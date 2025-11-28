'use client';

import { useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import SearchBox from '@/components/SearchBox';
import AuthModal from '@/components/AuthModal';
import mapboxgl from 'mapbox-gl';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLines } from '@/store/useLines';

// SSR 비활성화 (Mapbox는 클라이언트에서만 동작)
const Globe = dynamic(() => import('@/components/Globe'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#4264fb] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">지구를 불러오는 중...</p>
      </div>
    </div>
  ),
});

export default function GlobePage() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { user, loading, signOut } = useAuth();
  const { userLocation } = useLines();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleMapReady = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map;
  }, []);

  const handleFlyTo = useCallback((lng: number, lat: number) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 8,
      duration: 2000,
    });
  }, []);

  const handleFlyToMyLocation = useCallback(() => {
    if (userLocation) {
      mapRef.current?.flyTo({
        center: [userLocation.lon, userLocation.lat],
        zoom: 4,
        duration: 2000,
      });
    }
  }, [userLocation]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#0a0a0f] overflow-hidden relative">
      {/* 사이드바 */}
      <Sidebar />

      {/* 상단 검색바 */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
        <SearchBox
          onSelect={(lng, lat, name) => {
            handleFlyTo(lng, lat);
            console.log('Selected:', name);
          }}
          placeholder="도시, 장소 검색..."
          className="w-full"
        />
      </div>

      {/* 상단 우측 버튼들 */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        {/* 내 위치 버튼 */}
        <button
          onClick={handleFlyToMyLocation}
          disabled={!userLocation}
          className="p-2.5 bg-[#1a1a24]/80 backdrop-blur-sm border border-[#3a3a4a] rounded-lg 
                     text-gray-400 hover:text-white hover:bg-[#2a2a3a] transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          title="내 위치로 이동"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* 사용자 정보 또는 로그인 버튼 */}
        {loading ? (
          <div className="w-8 h-8 border-2 border-[#4264fb] border-t-transparent rounded-full animate-spin" />
        ) : user ? (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-[#1a1a24]/80 backdrop-blur-sm border border-[#3a3a4a] 
                         rounded-lg hover:bg-[#2a2a3a] transition-colors"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 bg-[#4264fb] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <span className="text-white text-sm hidden md:block">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </button>

            {/* 드롭다운 */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1a1a24] border border-[#3a3a4a] rounded-lg shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#3a3a4a]">
                  <p className="text-sm text-white font-medium truncate">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-[#2a2a3a] transition-colors"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-2 bg-[#4264fb] hover:bg-[#5a7bfc] text-white text-sm font-medium 
                       rounded-lg transition-colors"
          >
            로그인
          </button>
        )}

        {/* 홈 버튼 */}
        <Link
          href="/"
          className="p-2.5 bg-[#1a1a24]/80 backdrop-blur-sm border border-[#3a3a4a] rounded-lg text-gray-400 hover:text-white hover:bg-[#2a2a3a] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </Link>
      </div>

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* 지구 */}
      <Globe onMapReady={handleMapReady} />

      {/* 안내 텍스트 */}
      <div className="absolute bottom-6 right-6 z-10 text-right">
        <p className="text-xs text-gray-500">
          마우스로 지구를 드래그하여 회전
        </p>
        <p className="text-xs text-gray-500">
          스크롤로 확대/축소
        </p>
      </div>

      {/* 인증 모달 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
