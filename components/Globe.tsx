'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLines } from '@/store/useLines';
import {
  generateCircleWithDirection,
  generateGreatCircleLine,
  generateCircleFromThreePoints,
  generateZoneCircle,
  calculateBearing,
  calculateDistance,
  findNearestPointOnLine,
  determineShrinkDirection,
} from '@/lib/lineGenerator';
import { LineZone } from '@/types';

interface GlobeProps {
  onMapReady?: (map: mapboxgl.Map) => void;
}

const EARTH_HALF_CIRCUMFERENCE = 20037.5;

export default function Globe({ onMapReady }: GlobeProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const searchPinMarker = useRef<mapboxgl.Marker | null>(null);
  const pointMarkers = useRef<mapboxgl.Marker[]>([]);
  const zoneMarkers = useRef<mapboxgl.Marker[]>([]);
  
  const [isDraggingRadius, setIsDraggingRadius] = useState(false);
  const [isDraggingZone, setIsDraggingZone] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [isNearLine, setIsNearLine] = useState(false);

  const {
    lines,
    userLocation,
    searchPin,
    setUserLocation,
    creationStep,
    creationConfig,
    previewGeometry,
    shrinkDirection,
    setCreationStep,
    setBearing,
    setRadius,
    setShrinkDirection,
    setPreviewGeometry,
    addSelectedPoint,
    addZone,
    updateZone,
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

      map.current.setFog({
        color: 'rgb(20, 20, 30)',
        'high-color': 'rgb(40, 40, 60)',
        'horizon-blend': 0.1,
        'space-color': 'rgb(10, 10, 15)',
        'star-intensity': 0.6,
      });

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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setUserLocation(location);
        
        map.current?.flyTo({
          center: [location.lon, location.lat],
          zoom: 3,
          duration: 2000,
        });
      },
      () => {
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
          <div style="position: absolute; width: 20px; height: 20px; background: #4264fb; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.4);"></div>
          <div class="user-marker-ring" style="position: absolute; width: 40px; height: 40px; background: rgba(66, 100, 251, 0.3); border-radius: 50%; top: -10px; left: -10px;"></div>
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
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
          <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 40 16 40S32 28 32 16C32 7.16 24.84 0 16 0Z" fill="#ff6b6b"/>
          <circle cx="16" cy="14" r="6" fill="white"/>
        </svg>
      `;

      searchPinMarker.current = new mapboxgl.Marker(el, { anchor: 'bottom' })
        .setLngLat(searchPin.center)
        .addTo(map.current);
    }
  }, [searchPin]);

  // 선택된 점 마커
  useEffect(() => {
    pointMarkers.current.forEach((m) => m.remove());
    pointMarkers.current = [];

    if (!map.current || creationStep !== 'select-points') return;

    creationConfig.selectedPoints.forEach((point, index) => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="width: 28px; height: 28px; background: #00d4aa; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; box-shadow: 0 2px 10px rgba(0,0,0,0.4);">${index + 1}</div>
      `;

      const marker = new mapboxgl.Marker(el).setLngLat(point).addTo(map.current!);
      pointMarkers.current.push(marker);
    });
  }, [creationStep, creationConfig.selectedPoints]);

  // 구역 마커
  useEffect(() => {
    zoneMarkers.current.forEach((m) => m.remove());
    zoneMarkers.current = [];

    if (!map.current) return;
    if (creationStep !== 'customize' && creationStep !== 'add-zone') return;

    creationConfig.zones.forEach((zone, index) => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="width: 24px; height: 24px; background: #ff6b6b; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.4); cursor: move;">${index + 1}</div>
      `;

      const marker = new mapboxgl.Marker(el, { draggable: true })
        .setLngLat(zone.center)
        .addTo(map.current!);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        updateZone(zone.id, { center: [lngLat.lng, lngLat.lat] });
      });

      zoneMarkers.current.push(marker);
    });
  }, [creationStep, creationConfig.zones, updateZone]);

  // 저장된 라인 업데이트
  useEffect(() => {
    if (!map.current?.isStyleLoaded()) return;

    const source = map.current.getSource('saved-lines') as mapboxgl.GeoJSONSource;
    if (source) {
      const features = lines.map((line) => ({
        type: 'Feature' as const,
        properties: { id: line.id, color: line.color },
        geometry: line.geometry,
      }));
      source.setData({ type: 'FeatureCollection', features });
    }
  }, [lines]);

  // 프리뷰 라인 계산
  useEffect(() => {
    if (!map.current?.isStyleLoaded() || !userLocation) return;

    const source = map.current.getSource('preview-line') as mapboxgl.GeoJSONSource;
    if (!source) return;

    let geometry: GeoJSON.LineString | null = null;
    let center: [number, number] | null = null;

    // 방향 모드
    if (creationConfig.mode === 'direction') {
      if (creationStep === 'select-direction' || creationStep === 'customize') {
        const result = generateCircleWithDirection(
          [userLocation.lon, userLocation.lat],
          creationConfig.bearing,
          creationConfig.radius,
          shrinkDirection
        );
        geometry = result.geometry;
        center = result.center;
      }
    }
    // 위치 모드
    else if (creationConfig.mode === 'points') {
      if ((creationStep === 'select-points' || creationStep === 'customize') && 
          creationConfig.selectedPoints.length === 2) {
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
    }

    if (geometry) {
      source.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry }],
      });
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }

    setPreviewGeometry(geometry, center);
  }, [
    userLocation,
    creationStep,
    creationConfig.mode,
    creationConfig.bearing,
    creationConfig.radius,
    creationConfig.selectedPoints,
    shrinkDirection,
    setPreviewGeometry,
  ]);

  // 구역 표시 업데이트
  useEffect(() => {
    if (!map.current?.isStyleLoaded()) return;

    const source = map.current.getSource('zones') as mapboxgl.GeoJSONSource;
    if (!source) return;

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

  // 인터랙션 핸들러
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
          setTimeout(() => setCreationStep('customize'), 100);
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
      let dragStartRadius = creationConfig.radius;

      const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
        if (!previewGeometry) return;
        
        const coords = previewGeometry.coordinates as [number, number][];
        const nearest = findNearestPointOnLine([e.lngLat.lng, e.lngLat.lat], coords);
        
        if (nearest.distance < 200) {
          setIsNearLine(true);
          canvas.style.cursor = isDraggingRadius ? 'grabbing' : 'grab';
        } else {
          setIsNearLine(false);
          canvas.style.cursor = 'default';
        }

        // 반경 드래그 중
        if (isDraggingRadius && userLocation) {
          const dragDistance = calculateDistance(
            [userLocation.lon, userLocation.lat],
            [e.lngLat.lng, e.lngLat.lat]
          );
          
          // 축소 방향이 없으면 결정
          if (!shrinkDirection) {
            const direction = determineShrinkDirection(
              [userLocation.lon, userLocation.lat],
              [e.lngLat.lng, e.lngLat.lat],
              creationConfig.bearing
            );
            setShrinkDirection(direction);
          }
          
          // 드래그 거리에 따라 반경 조절 (대원에서 시작, 드래그할수록 작아짐)
          const newRadius = Math.max(50, EARTH_HALF_CIRCUMFERENCE - dragDistance * 2);
          setRadius(newRadius);
        }
      };

      const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
        if (!previewGeometry || !isNearLine) return;
        
        const coords = previewGeometry.coordinates as [number, number][];
        const nearest = findNearestPointOnLine([e.lngLat.lng, e.lngLat.lat], coords);
        
        if (nearest.distance < 200) {
          setIsDraggingRadius(true);
          dragStartRadius = creationConfig.radius;
          map.current?.dragPan.disable();
          canvas.style.cursor = 'grabbing';
        }
      };

      const handleMouseUp = () => {
        if (isDraggingRadius) {
          setIsDraggingRadius(false);
          map.current?.dragPan.enable();
          canvas.style.cursor = isNearLine ? 'grab' : 'default';
        }
      };

      const handleClick = (e: mapboxgl.MapMouseEvent) => {
        if (isDraggingRadius) return;
        if (!previewGeometry || !isNearLine) return;
        
        const coords = previewGeometry.coordinates as [number, number][];
        const nearest = findNearestPointOnLine([e.lngLat.lng, e.lngLat.lat], coords);
        
        if (nearest.distance < 200) {
          const newZone: LineZone = {
            id: `zone-${Date.now()}`,
            center: nearest.point,
            radius: 100,
          };
          addZone(newZone);
          setEditingZoneId(newZone.id);
          
          map.current?.flyTo({
            center: nearest.point,
            zoom: 8,
            duration: 1000,
          });
        }
      };

      map.current.on('mousemove', handleMouseMove);
      map.current.on('mousedown', handleMouseDown);
      map.current.on('mouseup', handleMouseUp);
      map.current.on('click', handleClick);

      return () => {
        map.current?.off('mousemove', handleMouseMove);
        map.current?.off('mousedown', handleMouseDown);
        map.current?.off('mouseup', handleMouseUp);
        map.current?.off('click', handleClick);
        map.current?.dragPan.enable();
        canvas.style.cursor = '';
      };
    }

    // 구역 추가 모드
    if (creationStep === 'add-zone') {
      const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
        if (!previewGeometry) return;
        
        const coords = previewGeometry.coordinates as [number, number][];
        const nearest = findNearestPointOnLine([e.lngLat.lng, e.lngLat.lat], coords);
        
        if (nearest.distance < 200) {
          setIsNearLine(true);
          canvas.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'32\' viewBox=\'0 0 24 32\'%3E%3Cpath d=\'M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z\' fill=\'%23ff6b6b\'/%3E%3Ccircle cx=\'12\' cy=\'10\' r=\'4\' fill=\'white\'/%3E%3C/svg%3E") 12 32, crosshair';
        } else {
          setIsNearLine(false);
          canvas.style.cursor = 'crosshair';
        }

        if (isDraggingZone && editingZoneId) {
          const zone = creationConfig.zones.find(z => z.id === editingZoneId);
          if (zone) {
            const newRadius = calculateDistance(zone.center, [e.lngLat.lng, e.lngLat.lat]);
            updateZone(editingZoneId, { radius: newRadius });
          }
        }
      };

      const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
        if (!previewGeometry) return;
        
        for (const zone of creationConfig.zones) {
          const dist = calculateDistance(zone.center, [e.lngLat.lng, e.lngLat.lat]);
          if (dist < zone.radius + 50) {
            setIsDraggingZone(true);
            setEditingZoneId(zone.id);
            map.current?.dragPan.disable();
            return;
          }
        }
      };

      const handleMouseUp = () => {
        if (isDraggingZone) {
          setIsDraggingZone(false);
          map.current?.dragPan.enable();
        }
      };

      const handleClick = (e: mapboxgl.MapMouseEvent) => {
        if (isDraggingZone) return;
        if (!previewGeometry || !isNearLine) return;
        
        const coords = previewGeometry.coordinates as [number, number][];
        const nearest = findNearestPointOnLine([e.lngLat.lng, e.lngLat.lat], coords);
        
        if (nearest.distance < 200) {
          const newZone: LineZone = {
            id: `zone-${Date.now()}`,
            center: nearest.point,
            radius: 100,
          };
          addZone(newZone);
          setEditingZoneId(newZone.id);
          setCreationStep('customize');
          
          map.current?.flyTo({
            center: nearest.point,
            zoom: 8,
            duration: 1000,
          });
        }
      };

      map.current.on('mousemove', handleMouseMove);
      map.current.on('mousedown', handleMouseDown);
      map.current.on('mouseup', handleMouseUp);
      map.current.on('click', handleClick);

      return () => {
        map.current?.off('mousemove', handleMouseMove);
        map.current?.off('mousedown', handleMouseDown);
        map.current?.off('mouseup', handleMouseUp);
        map.current?.off('click', handleClick);
        map.current?.dragPan.enable();
        canvas.style.cursor = '';
      };
    }
  }, [
    creationStep,
    userLocation,
    creationConfig,
    previewGeometry,
    shrinkDirection,
    isDraggingRadius,
    isDraggingZone,
    isNearLine,
    editingZoneId,
    setBearing,
    setRadius,
    setShrinkDirection,
    setCreationStep,
    addSelectedPoint,
    addZone,
    updateZone,
  ]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

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
            {isNearLine 
              ? '✋ 드래그로 반경 조절 · 클릭으로 구역 추가' 
              : '⚙️ 선 위로 마우스를 이동하세요'}
          </p>
        </div>
      )}

      {creationStep === 'add-zone' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#1a1a24]/90 backdrop-blur-sm px-6 py-3 rounded-full border border-[#ff6b6b]/50 z-10">
          <p className="text-sm text-white">
            {isNearLine 
              ? '📍 클릭하여 구역 추가' 
              : '🎯 선 위로 마우스를 이동하세요'}
          </p>
        </div>
      )}
    </div>
  );
}
