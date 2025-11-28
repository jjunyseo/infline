'use client';

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLines } from '@/store/useLines';
import {
  generateGreatCircleLine,
  generateCircleFromThreePoints,
  generateZoneCircle,
  getRandomLineColor,
  calculateBearing,
} from '@/lib/lineGenerator';
import { Line, LineZone } from '@/types';

interface GlobeProps {
  onMapReady?: (map: mapboxgl.Map) => void;
}

export default function Globe({ onMapReady }: GlobeProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const pointMarkers = useRef<mapboxgl.Marker[]>([]);

  const {
    lines,
    userLocation,
    setUserLocation,
    creationMode,
    creationConfig,
    previewBearing,
    addLine,
    setCreationMode,
    setPreviewBearing,
    addSelectedPoint,
    addZone,
    resetCreation,
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
          'line-opacity': 0.6,
          'line-dasharray': [2, 2],
        },
      });

      // 구역 표시용 소스
      map.current.addSource('zones', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': '#ff6b6b',
          'fill-opacity': 0.2,
        },
      });

      map.current.addLayer({
        id: 'zones-border',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color': '#ff6b6b',
          'line-width': 2,
          'line-opacity': 0.8,
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

  // 선택된 점 마커 업데이트
  useEffect(() => {
    // 기존 마커 제거
    pointMarkers.current.forEach((marker) => marker.remove());
    pointMarkers.current = [];

    if (!map.current || creationMode !== 'points') return;

    // 새 마커 추가
    creationConfig.selectedPoints.forEach((point, index) => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          background: #00d4aa;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">${index + 1}</div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat(point)
        .addTo(map.current!);

      pointMarkers.current.push(marker);
    });
  }, [creationMode, creationConfig.selectedPoints]);

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

      // 구역 업데이트
      const zonesSource = map.current?.getSource('zones') as mapboxgl.GeoJSONSource;
      if (zonesSource) {
        const zoneFeatures: GeoJSON.Feature[] = [];
        lines.forEach((line) => {
          line.zones.forEach((zone) => {
            zoneFeatures.push({
              type: 'Feature',
              properties: { lineId: line.id, zoneId: zone.id },
              geometry: generateZoneCircle(zone.center, zone.radius),
            });
          });
        });
        zonesSource.setData({ type: 'FeatureCollection', features: zoneFeatures });
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

      // 방향 선택 모드
      if (creationMode === 'direction') {
        const previewGeometry = generateGreatCircleLine({
          origin: [userLocation.lon, userLocation.lat],
          bearing: previewBearing,
        });
        source.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: previewGeometry,
            },
          ],
        });
      }
      // 2점 선택 모드 - 3점이 모두 있을 때
      else if (creationMode === 'points' && creationConfig.selectedPoints.length === 2) {
        const result = generateCircleFromThreePoints(
          [userLocation.lon, userLocation.lat],
          creationConfig.selectedPoints[0],
          creationConfig.selectedPoints[1]
        );

        if (result) {
          source.setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: result.geometry,
              },
            ],
          });
        }
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
    };

    if (map.current.isStyleLoaded()) {
      updatePreview();
    } else {
      map.current.on('load', updatePreview);
    }
  }, [creationMode, previewBearing, userLocation, creationConfig.selectedPoints]);

  // 지도 인터랙션 핸들러
  useEffect(() => {
    if (!map.current) return;

    // 방향 선택 모드
    if (creationMode === 'direction') {
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

        const geometry = generateGreatCircleLine({
          origin: [userLocation.lon, userLocation.lat],
          bearing: previewBearing,
        });

        const newLine: Line = {
          id: `line-${Date.now()}`,
          creatorId: 'user-1',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          geometry,
          color: getRandomLineColor(),
          maxRiders: creationConfig.maxRiders,
          riderCount: 0,
          center: [userLocation.lon, userLocation.lat],
          radius: 20037.5, // 지구 둘레 절반
          zones: [...creationConfig.zones],
        };

        addLine(newLine);
        resetCreation();
      };

      map.current.on('mousemove', handleMove);
      map.current.on('click', handleClick);
      map.current.getCanvas().style.cursor = 'crosshair';

      return () => {
        if (map.current) {
          map.current.off('mousemove', handleMove);
          map.current.off('click', handleClick);
          map.current.getCanvas().style.cursor = '';
        }
      };
    }

    // 2점 선택 모드
    if (creationMode === 'points') {
      const handleClick = (e: mapboxgl.MapMouseEvent) => {
        if (creationConfig.selectedPoints.length >= 2) {
          // 2점이 모두 선택되면 선 생성
          if (!userLocation) return;

          const result = generateCircleFromThreePoints(
            [userLocation.lon, userLocation.lat],
            creationConfig.selectedPoints[0],
            creationConfig.selectedPoints[1]
          );

          if (result) {
            const newLine: Line = {
              id: `line-${Date.now()}`,
              creatorId: 'user-1',
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              geometry: result.geometry,
              color: getRandomLineColor(),
              maxRiders: creationConfig.maxRiders,
              riderCount: 0,
              center: result.center,
              radius: result.radius,
              zones: [...creationConfig.zones],
            };

            addLine(newLine);
            resetCreation();
          }
        } else {
          // 점 추가
          addSelectedPoint([e.lngLat.lng, e.lngLat.lat]);
        }
      };

      map.current.on('click', handleClick);
      map.current.getCanvas().style.cursor = 'crosshair';

      return () => {
        if (map.current) {
          map.current.off('click', handleClick);
          map.current.getCanvas().style.cursor = '';
        }
      };
    }

    // 구역 선택 모드
    if (creationMode === 'zone-select') {
      const handleClick = (e: mapboxgl.MapMouseEvent) => {
        const newZone: LineZone = {
          id: `zone-${Date.now()}`,
          center: [e.lngLat.lng, e.lngLat.lat],
          radius: 2.5, // 기본 반경 2.5km
        };
        addZone(newZone);
        setCreationMode('configuring');

        // 자동 확대
        map.current?.flyTo({
          center: [e.lngLat.lng, e.lngLat.lat],
          zoom: 12,
          duration: 1500,
        });
      };

      map.current.on('click', handleClick);
      map.current.getCanvas().style.cursor = 'crosshair';

      return () => {
        if (map.current) {
          map.current.off('click', handleClick);
          map.current.getCanvas().style.cursor = '';
        }
      };
    }
  }, [
    creationMode,
    userLocation,
    previewBearing,
    creationConfig,
    addLine,
    resetCreation,
    setPreviewBearing,
    addSelectedPoint,
    addZone,
    setCreationMode,
  ]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* 모드 가이드 */}
      {creationMode === 'direction' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#1a1a24]/90 backdrop-blur-sm px-6 py-3 rounded-full border border-[#3a3a4a] z-10">
          <p className="text-sm text-gray-300">
            🧭 지구를 클릭하여 선의 방향을 선택하세요
          </p>
        </div>
      )}

      {creationMode === 'points' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#1a1a24]/90 backdrop-blur-sm px-6 py-3 rounded-full border border-[#3a3a4a] z-10">
          <p className="text-sm text-gray-300">
            📍 {creationConfig.selectedPoints.length}/2 위치 선택됨
            {creationConfig.selectedPoints.length === 2 && ' - 클릭하여 선 생성'}
          </p>
        </div>
      )}

      {creationMode === 'zone-select' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#1a1a24]/90 backdrop-blur-sm px-6 py-3 rounded-full border border-[#3a3a4a] z-10">
          <p className="text-sm text-gray-300">
            🎯 선 위의 위치를 클릭하여 구역을 설정하세요
          </p>
        </div>
      )}
    </div>
  );
}
