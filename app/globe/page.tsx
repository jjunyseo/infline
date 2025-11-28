'use client';

import { useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ControlPanel from '@/components/ControlPanel';
import LineList from '@/components/LineList';
import mapboxgl from 'mapbox-gl';
import Link from 'next/link';

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

  const handleMapReady = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map;
  }, []);

  const handleFlyTo = useCallback((lng: number, lat: number) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 6,
      duration: 2000,
    });
  }, []);

  const handleFlyToMyLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      mapRef.current?.flyTo({
        center: [position.coords.longitude, position.coords.latitude],
        zoom: 4,
        duration: 2000,
      });
    });
  }, []);

  return (
    <div className="w-screen h-screen bg-[#0a0a0f] overflow-hidden relative">
      {/* 홈 버튼 */}
      <Link
        href="/"
        className="absolute top-6 right-6 z-20 p-2.5 bg-[#1a1a24]/80 backdrop-blur-sm border border-[#3a3a4a] rounded-lg text-gray-400 hover:text-white hover:bg-[#2a2a3a] transition-colors"
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

      {/* 지구 */}
      <Globe onMapReady={handleMapReady} />

      {/* 컨트롤 패널 */}
      <ControlPanel
        onFlyTo={handleFlyTo}
        onFlyToMyLocation={handleFlyToMyLocation}
      />

      {/* 선 목록 */}
      <LineList />

      {/* 안내 텍스트 */}
      <div className="absolute bottom-6 right-6 z-10 text-right">
        <p className="text-xs text-gray-500">
          마우스로 지구를 드래그하여 회전
        </p>
        <p className="text-xs text-gray-500">
          스크롤로 확대/축소
        </p>
      </div>
    </div>
  );
}

