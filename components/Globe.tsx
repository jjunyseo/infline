'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLines } from '@/store/useLines';
import {
  generateCircleLine,
  generateGreatCircleLine,
  generateCircleFromThreePoints,
  generateZoneCircle,
  calculateBearing,
  calculateDistance,
  findNearestPointOnLine,
} from '@/lib/lineGenerator';
import { LineZone } from '@/types';

interface GlobeProps {
  onMapReady?: (map: mapboxgl.Map) => void;
}

export default function Globe({ onMapReady }: GlobeProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const searchPinMarker = useRef<mapboxgl.Marker | null>(null);
  const pointMarkers = useRef<mapboxgl.Marker[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const {
    lines,
    userLocation,
    searchPin,
    setUserLocation,
    creationStep,
    creationConfig,
    previewGeometry,
    setCreationStep,
    setBearing,
    setRadius,
    setPreviewGeometry,
    addSelectedPoint,
    addZone,
  } = useLines();

  // 지도 초기화
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      zoom: 2,
      center: [127, 37],
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

      // 저장된 라인용 소스
      map.current.addSource('saved-lines', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current.addLayer({
        id: 'saved-lines-layer',
        type: 'line',
        source: 'saved-lines',
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
          'line-width': 3,
          'line-opacity': 0.8,
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
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setUserLocation(location);
        
        // 사용자 위치로 이동
        map.current?.flyTo({
          center: [location.lon, location.lat],
          zoom: 3,
          duration: 2000,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setUserLocation({ lat: 37.5665, lon: 126.978 });
      }
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [onMapReady, setUserLocation]);

  // 사용자 위치 마커
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (userMarker.current) {
      userMarker.current.setLngLat([userLocation.lon, userLocation.lat]);
    } else {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="position: relative; width: 20px; height: 20px;">
          <div style="
            position: absolute;
            width: 20px;
            height: 20px;
            background: #4264fb;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.4);
          "></div>
          <div class="user-marker-ring" style="
            position: absolute;
            width: 40px;
            height: 40px;
            background: rgba(66, 100, 251, 0.3);
            border-radius: 50%;
            top: -10px;
            left: -10px;
          "></div>
        </div>
      `;

      userMarker.current = new mapboxgl.Marker(el)
        .setLngLat([userLocation.lon, userLocation.lat])
        .addTo(map.current);
    }
  }, [userLocation]);

  // 검색 핀 마커
  useEffect(() => {
    if (!map.current) return;

    if (searchPinMarker.current) {
      searchPinMarker.current.remove();
      searchPinMarker.current = null;
    }

    if (searchPin) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="position: relative;">
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
            <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 40 16 40S32 28 32 16C32 7.16 24.84 0 16 0Z" fill="#ff6b6b"/>
            <circle cx="16" cy="14" r="6" fill="white"/>
          </svg>
        </div>
      `;
      el.style.cursor = 'pointer';

      searchPinMarker.current = new mapboxgl.Marker(el, { anchor: 'bottom' })
        .setLngLat(searchPin.center)
        .addTo(map.current);
    }
  }, [searchPin]);

  // 선택된 점 마커
  useEffect(() => {
    pointMarkers.current.forEach((marker) => marker.remove());
    pointMarkers.current = [];

    if (!map.current || creationStep !== 'select-points') return;

    creationConfig.selectedPoints.forEach((point, index) => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 28px;
          height: 28px;
          background: #00d4aa;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        ">${index + 1}</div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat(point)
        .addTo(map.current!);

      pointMarkers.current.push(marker);
    });
  }, [creationStep, creationConfig.selectedPoints]);

  // 저장된 라인 업데이트
  useEffect(() => {
    if (!map.current) return;

    const updateLines = () => {
      const source = map.current?.getSource('saved-lines') as mapboxgl.GeoJSONSource;
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

  // 프리뷰 라인 계산 및 업데이트
  useEffect(() => {
    if (!map.current || !userLocation) return;
    if (!map.current.isStyleLoaded()) return;

    const source = map.current.getSource('preview-line') as mapboxgl.GeoJSONSource;
    if (!source) return;

    let geometry: GeoJSON.LineString | null = null;
    let center: [number, number] | null = null;

    if (creationStep === 'select-direction' || creationStep === 'customize') {
      if (creationConfig.mode === 'direction') {
        if (creationConfig.radius >= 20000) {
          geometry = generateGreatCircleLine(
            [userLocation.lon, userLocation.lat],
            creationConfig.bearing
          );
          center = [userLocation.lon, userLocation.lat];
        } else {
          const result = generateCircleLine({
            origin: [userLocation.lon, userLocation.lat],
            bearing: creationConfig.bearing,
            radius: creationConfig.radius,
          });
          geometry = result.geometry;
          center = result.center;
        }
      }
    } else if (creationStep === 'select-points' && creationConfig.selectedPoints.length === 2) {
      const result = generateCircleFromThreePoints(
        [userLocation.lon, userLocation.lat],
        creationConfig.selectedPoints[0],
        creationConfig.selectedPoints[1]
      );
      if (result) {
        geometry = result.geometry;
        center = result.center;
      }
    }

    if (geometry) {
      source.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry }],
      });
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }

    // 프리뷰 geometry 저장 (별도 호출)
    setPreviewGeometry(geometry, center);
  }, [
    userLocation, 
    creationStep, 
    creationConfig.mode, 
    creationConfig.bearing, 
    creationConfig.radius, 
    creationConfig.selectedPoints,
    setPreviewGeometry,
  ]);

  // 구역 표시 업데이트
  useEffect(() => {
    if (!map.current) return;
    if (!map.current.isStyleLoaded()) return;

    const source = map.current.getSource('zones') as mapboxgl.GeoJSONSource;
    if (!source) return;

    const zoneFeatures: GeoJSON.Feature[] = [];

    // 저장된 라인의 구역
    lines.forEach((line) => {
      line.zones.forEach((zone) => {
        zoneFeatures.push({
          type: 'Feature',
          properties: { lineId: line.id, zoneId: zone.id },
          geometry: generateZoneCircle(zone.center, zone.radius),
        });
      });
    });

    // 현재 설정 중인 구역
    if (creationStep === 'customize' || creationStep === 'add-zone') {
      creationConfig.zones.forEach((zone) => {
        zoneFeatures.push({
          type: 'Feature',
          properties: { zoneId: zone.id, isPreview: true },
          geometry: generateZoneCircle(zone.center, zone.radius),
        });
      });
    }

    source.setData({ type: 'FeatureCollection', features: zoneFeatures });
  }, [lines, creationStep, creationConfig.zones]);

  // 지도 인터랙션 핸들러
  useEffect(() => {
    if (!map.current) return;

    const canvas = map.current.getCanvas();

    // 방향 선택 모드
    if (creationStep === 'select-direction') {
      const handleMove = (e: mapboxgl.MapMouseEvent) => {
        if (!userLocation) return;
        const bearing = calculateBearing(
          [userLocation.lon, userLocation.lat],
          [e.lngLat.lng, e.lngLat.lat]
        );
        setBearing(bearing);
      };

      const handleClick = () => {
        setCreationStep('customize');
      };

      map.current.on('mousemove', handleMove);
      map.current.on('click', handleClick);
      canvas.style.cursor = 'crosshair';

      return () => {
        map.current?.off('mousemove', handleMove);
        map.current?.off('click', handleClick);
        canvas.style.cursor = '';
      };
    }

    // 2점 선택 모드
    if (creationStep === 'select-points') {
      const handleClick = (e: mapboxgl.MapMouseEvent) => {
        addSelectedPoint([e.lngLat.lng, e.lngLat.lat]);
        
        if (creationConfig.selectedPoints.length >= 1) {
          setTimeout(() => {
            setCreationStep('customize');
          }, 100);
        }
      };

      map.current.on('click', handleClick);
      canvas.style.cursor = 'crosshair';

      return () => {
        map.current?.off('click', handleClick);
        canvas.style.cursor = '';
      };
    }

    // 커스터마이징 모드
    if (creationStep === 'customize') {
      let startRadius = creationConfig.radius;
      let startDistance = 0;
      let localDragging = false;

      const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
        if (!userLocation || !previewGeometry) return;

        const coords = previewGeometry.coordinates as [number, number][];
        const nearest = findNearestPointOnLine([e.lngLat.lng, e.lngLat.lat], coords);

        if (nearest.distance < 100) {
          localDragging = true;
          setIsDragging(true);
          startRadius = creationConfig.radius;
          startDistance = calculateDistance(
            [userLocation.lon, userLocation.lat],
            [e.lngLat.lng, e.lngLat.lat]
          );
          canvas.style.cursor = 'grabbing';
          map.current?.dragPan.disable();
        }
      };

      const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
        if (!localDragging || !userLocation) return;

        const currentDistance = calculateDistance(
          [userLocation.lon, userLocation.lat],
          [e.lngLat.lng, e.lngLat.lat]
        );

        const radiusChange = currentDistance - startDistance;
        const newRadius = Math.max(100, Math.min(startRadius + radiusChange, 20037));
        setRadius(newRadius);
      };

      const handleMouseUp = () => {
        if (localDragging) {
          localDragging = false;
          setIsDragging(false);
          canvas.style.cursor = 'grab';
          map.current?.dragPan.enable();
        }
      };

      const handleClick = (e: mapboxgl.MapMouseEvent) => {
        if (isDragging) return;
        if (!previewGeometry) return;
        
        const coords = previewGeometry.coordinates as [number, number][];
        const nearest = findNearestPointOnLine([e.lngLat.lng, e.lngLat.lat], coords);

        if (nearest.distance < 50) {
          const newZone: LineZone = {
            id: `zone-${Date.now()}`,
            center: nearest.point,
            radius: 2.5,
          };
          addZone(newZone);

          map.current?.flyTo({
            center: nearest.point,
            zoom: 10,
            duration: 1000,
          });
        }
      };

      map.current.on('mousedown', handleMouseDown);
      map.current.on('mousemove', handleMouseMove);
      map.current.on('mouseup', handleMouseUp);
      map.current.on('click', handleClick);
      canvas.style.cursor = 'grab';

      return () => {
        map.current?.off('mousedown', handleMouseDown);
        map.current?.off('mousemove', handleMouseMove);
        map.current?.off('mouseup', handleMouseUp);
        map.current?.off('click', handleClick);
        map.current?.dragPan.enable();
        canvas.style.cursor = '';
      };
    }

    // 구역 추가 모드
    if (creationStep === 'add-zone') {
      const handleClick = (e: mapboxgl.MapMouseEvent) => {
        if (!previewGeometry) return;

        const coords = previewGeometry.coordinates as [number, number][];
        const nearest = findNearestPointOnLine([e.lngLat.lng, e.lngLat.lat], coords);

        if (nearest.distance < 100) {
          const newZone: LineZone = {
            id: `zone-${Date.now()}`,
            center: nearest.point,
            radius: 2.5,
          };
          addZone(newZone);
          setCreationStep('customize');

          map.current?.flyTo({
            center: nearest.point,
            zoom: 10,
            duration: 1000,
          });
        }
      };

      map.current.on('click', handleClick);
      canvas.style.cursor = 'crosshair';

      return () => {
        map.current?.off('click', handleClick);
        canvas.style.cursor = '';
      };
    }
  }, [
    creationStep,
    userLocation,
    creationConfig.radius,
    creationConfig.selectedPoints,
    previewGeometry,
    isDragging,
    setBearing,
    setRadius,
    setCreationStep,
    addSelectedPoint,
    addZone,
  ]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* 모드 가이드 */}
      {creationStep === 'select-direction' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#1a1a24]/90 backdrop-blur-sm px-6 py-3 rounded-full border border-[#4264fb]/50 z-10">
          <p className="text-sm text-white">
            🧭 선이 나아갈 방향을 클릭하세요
          </p>
        </div>
      )}

      {creationStep === 'select-points' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#1a1a24]/90 backdrop-blur-sm px-6 py-3 rounded-full border border-[#00d4aa]/50 z-10">
          <p className="text-sm text-white">
            📍 {creationConfig.selectedPoints.length}/2 위치 선택됨
          </p>
        </div>
      )}

      {creationStep === 'customize' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#1a1a24]/90 backdrop-blur-sm px-6 py-3 rounded-full border border-[#ffe66d]/50 z-10">
          <p className="text-sm text-white">
            ⚙️ 선을 드래그하여 반경 조절 · 선 위 클릭으로 구역 추가
          </p>
        </div>
      )}

      {creationStep === 'add-zone' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#1a1a24]/90 backdrop-blur-sm px-6 py-3 rounded-full border border-[#ff6b6b]/50 z-10">
          <p className="text-sm text-white">
            🎯 선 위의 위치를 클릭하여 구역 추가
          </p>
        </div>
      )}
    </div>
  );
}
