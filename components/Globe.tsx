'use client';

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLines } from '@/store/useLines';
import { 
  generateDummyLines, 
  generateGreatCircleLine, 
  getRandomLineColor,
  calculateBearing 
} from '@/lib/lineGenerator';
import { Line } from '@/types';

interface GlobeProps {
  onMapReady?: (map: mapboxgl.Map) => void;
}

export default function Globe({ onMapReady }: GlobeProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);

  const {
    lines,
    userLocation,
    setUserLocation,
    creationMode,
    previewBearing,
    addLine,
    setCreationMode,
    setPreviewBearing,
  } = useLines();

  // 지도 초기화
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      zoom: 1.5,
      center: [0, 20],
      pitch: 0,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // 대기 효과
      map.current.setFog({
        color: 'rgb(20, 20, 30)',
        'high-color': 'rgb(40, 40, 60)',
        'horizon-blend': 0.1,
        'space-color': 'rgb(10, 10, 15)',
        'star-intensity': 0.6,
      });

      // 더미 라인 추가
      const dummyLines = generateDummyLines();

      map.current.addSource('dummy-lines', {
        type: 'geojson',
        data: dummyLines,
      });

      map.current.addLayer({
        id: 'dummy-lines-layer',
        type: 'line',
        source: 'dummy-lines',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.6,
        },
      });

      // 사용자 라인용 소스
      map.current.addSource('user-lines', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current.addLayer({
        id: 'user-lines-layer',
        type: 'line',
        source: 'user-lines',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
          'line-opacity': 0.9,
        },
      });

      // 프리뷰 라인용 소스
      map.current.addSource('preview-line', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current.addLayer({
        id: 'preview-line-layer',
        type: 'line',
        source: 'preview-line',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
          'line-opacity': 0.5,
          'line-dasharray': [2, 2],
        },
      });

      onMapReady?.(map.current);
    });

    // 사용자 위치 가져오기
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        // 기본 위치 (서울)
        setUserLocation({ lat: 37.5665, lon: 126.978 });
      }
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [onMapReady, setUserLocation]);

  // 사용자 위치 마커 업데이트
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (userMarker.current) {
      userMarker.current.setLngLat([userLocation.lon, userLocation.lat]);
    } else {
      // 커스텀 마커 엘리먼트
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="position: relative; width: 16px; height: 16px;">
          <div style="
            position: absolute;
            width: 16px;
            height: 16px;
            background: #4264fb;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>
          <div class="user-marker-ring" style="
            position: absolute;
            width: 32px;
            height: 32px;
            background: rgba(66, 100, 251, 0.3);
            border-radius: 50%;
            top: -8px;
            left: -8px;
          "></div>
        </div>
      `;

      userMarker.current = new mapboxgl.Marker(el)
        .setLngLat([userLocation.lon, userLocation.lat])
        .addTo(map.current);
    }
  }, [userLocation]);

  // 사용자 라인 업데이트
  useEffect(() => {
    if (!map.current) return;

    const updateLines = () => {
      const source = map.current?.getSource('user-lines') as mapboxgl.GeoJSONSource;
      if (source) {
        const features = lines.map((line) => ({
          type: 'Feature' as const,
          properties: { id: line.id, color: line.color },
          geometry: line.geometry,
        }));
        source.setData({ type: 'FeatureCollection', features });
      }
    };

    if (map.current.isStyleLoaded()) {
      updateLines();
    } else {
      map.current.on('load', updateLines);
    }
  }, [lines]);

  // 프리뷰 라인 업데이트
  useEffect(() => {
    if (!map.current || !userLocation) return;

    const updatePreview = () => {
      const source = map.current?.getSource('preview-line') as mapboxgl.GeoJSONSource;
      if (!source) return;

      if (creationMode === 'selecting') {
        const previewGeometry = generateGreatCircleLine({
          origin: [userLocation.lon, userLocation.lat],
          bearing: previewBearing,
        });
        source.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: previewGeometry,
          }],
        });
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
    };

    if (map.current.isStyleLoaded()) {
      updatePreview();
    } else {
      map.current.on('load', updatePreview);
    }
  }, [creationMode, previewBearing, userLocation]);

  // 지도 클릭/드래그로 방향 선택
  useEffect(() => {
    if (!map.current || creationMode !== 'selecting') return;

    const handleMove = (e: mapboxgl.MapMouseEvent) => {
      if (!userLocation) return;

      const bearing = calculateBearing(
        [userLocation.lon, userLocation.lat],
        [e.lngLat.lng, e.lngLat.lat]
      );
      setPreviewBearing(bearing);
    };

    const handleClick = () => {
      if (!userLocation) return;

      const newLine: Line = {
        id: `line-${Date.now()}`,
        creatorId: 'user-1',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        geometry: generateGreatCircleLine({
          origin: [userLocation.lon, userLocation.lat],
          bearing: previewBearing,
        }),
        color: getRandomLineColor(),
      };

      addLine(newLine);
      setCreationMode('idle');
    };

    map.current.on('mousemove', handleMove);
    map.current.on('click', handleClick);

    // 커서 변경
    map.current.getCanvas().style.cursor = 'crosshair';

    return () => {
      if (map.current) {
        map.current.off('mousemove', handleMove);
        map.current.off('click', handleClick);
        map.current.getCanvas().style.cursor = '';
      }
    };
  }, [creationMode, userLocation, previewBearing, addLine, setCreationMode, setPreviewBearing]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* 선 생성 모드 가이드 */}
      {creationMode === 'selecting' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#1a1a24]/90 backdrop-blur-sm px-6 py-3 rounded-full border border-[#3a3a4a]">
          <p className="text-sm text-gray-300">
            🌍 지구를 클릭하여 선의 방향을 선택하세요
          </p>
        </div>
      )}
    </div>
  );
}

