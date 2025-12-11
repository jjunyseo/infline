'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLines } from '@/store/useLines';
import {
  generateCircleThroughPoint,
  generateCircleFromThreePoints,
  generateZoneCircle,
  calculateBearing,
  calculateDistance,
  findNearestPointOnLine,
  offsetToDisplayRadius,
  getRandomLineColor,
} from '@/lib/lineGenerator';
import { LineZone, Zone, CreationScope } from '@/types';

// 각 scope에 따른 줌 레벨
const SCOPE_ZOOM_LEVELS: Record<CreationScope, number> = {
  nearby: 15,   // ~1km 반경
  city: 11,     // 도시 전체
  country: 5,   // 국가 전체
  globe: 2,     // 지구 전체
};

const MIN_LINE_COORDINATES = 32;
const LOOP_CLOSURE_TOLERANCE_KM = 20; // tolerate small numerical errors
const MAX_ORIGIN_DEVIATION_KM = 25; // preview line must start near origin
const ORIGIN_INTERSECTION_TOLERANCE_KM = 5; // preview line must pass through origin

const isFiniteCoordinate = (coord: [number, number]) =>
  Array.isArray(coord) &&
  coord.length >= 2 &&
  Number.isFinite(coord[0]) &&
  Number.isFinite(coord[1]);

function validateLineString(
  geometry: GeoJSON.LineString | null | undefined,
  origin?: [number, number]
): geometry is GeoJSON.LineString {
  if (!geometry) return false;

  const coordinates = geometry.coordinates as [number, number][];
  if (!Array.isArray(coordinates) || coordinates.length < MIN_LINE_COORDINATES) {
    return false;
  }

  if (coordinates.some((coord) => !isFiniteCoordinate(coord))) {
    return false;
  }

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (calculateDistance(first, last) > LOOP_CLOSURE_TOLERANCE_KM) {
    return false;
  }

  if (origin) {
    if (calculateDistance(origin, first) > MAX_ORIGIN_DEVIATION_KM) {
      return false;
    }

    const touchesOrigin = coordinates.some(
      (coord) => calculateDistance(origin, coord) <= ORIGIN_INTERSECTION_TOLERANCE_KM
    );
    if (!touchesOrigin) {
      return false;
    }
  }

  return true;
}

interface GlobeProps {
  onMapReady?: (map: mapboxgl.Map) => void;
}

export default function Globe({ onMapReady }: GlobeProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const searchPinMarker = useRef<mapboxgl.Marker | null>(null);
  const pointMarkers = useRef<mapboxgl.Marker[]>([]);
  const zoneMarkers = useRef<mapboxgl.Marker[]>([]);
  
  const [isDraggingOffset, setIsDraggingOffset] = useState(false);
  const [isDraggingZone, setIsDraggingZone] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [isNearLine, setIsNearLine] = useState(false);
  
  const dragStartRef = useRef<{ point: [number, number] } | null>(null);

  const {
    lines,
    zones: standaloneZones,
    userLocation,
    searchPin,
    setUserLocation,
    creationStep,
    creationConfig,
    previewGeometry,
    offset,
    setCreationStep,
    setBearing,
    setOffset,
    setPreviewGeometry,
    addSelectedPoint,
    addLineZone,
    updateLineZone,
    addCreationZone,
    updateCreationZone,
  } = useLines();

  // 이전 scope를 추적
  const prevScopeRef = useRef<CreationScope | null>(null);

  // 지도 초기화
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      projection: 'globe',
      zoom: 2,
      center: [127, 37],
      pitch: 0,
      renderWorldCopies: false,
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
          'line-color': '#000000',
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

      // 독립 구역용 소스/레이어
      map.current.addSource('standalone-zones', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current.addLayer({
        id: 'standalone-zones-fill',
        type: 'fill',
        source: 'standalone-zones',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.25,
        },
      });

      map.current.addLayer({
        id: 'standalone-zones-border',
        type: 'line',
        source: 'standalone-zones',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.9,
        },
      });

      // 구역-사용자 연결 점선
      map.current.addSource('zone-connections', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // zone-connections 레이어를 가장 위에 추가
      map.current.addLayer({
        id: 'zone-connections-layer',
        type: 'line',
        source: 'zone-connections',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#ff6b6b',
          'line-width': 4,
          'line-opacity': 1,
          'line-dasharray': [2, 2],
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
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.position = 'relative';
      el.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: #4264fb; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.4); z-index: 2;"></div>
        <div class="user-marker-ring" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: rgba(66, 100, 251, 0.3); border-radius: 50%; z-index: 1;"></div>
      `;

      userMarker.current = new mapboxgl.Marker(el, { anchor: 'center' })
        .setLngLat([userLocation.lon, userLocation.lat])
        .addTo(map.current);
    }
  }, [userLocation]);

  // scope 변경 시 줌 애니메이션
  useEffect(() => {
    if (!map.current || !userLocation) return;
    
    const currentScope = creationConfig.scope;
    
    // scope가 변경되었을 때만 줌
    if (prevScopeRef.current !== currentScope && creationStep !== 'select-scope') {
      const targetZoom = SCOPE_ZOOM_LEVELS[currentScope];
      
      map.current.flyTo({
        center: [userLocation.lon, userLocation.lat],
        zoom: targetZoom,
        duration: 1500,
        essential: true,
      });
      
      prevScopeRef.current = currentScope;
    }
  }, [creationConfig.scope, creationStep, userLocation]);

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

  // 구역 마커 (선에 추가되는 구역)
  useEffect(() => {
    zoneMarkers.current.forEach((m) => m.remove());
    zoneMarkers.current = [];

    if (!map.current) return;

    // 선에 추가되는 구역 마커 (customize, add-zone 단계)
    if (creationStep === 'customize' || creationStep === 'add-zone') {
      creationConfig.lineZones.forEach((zone, index) => {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="width: 24px; height: 24px; background: #ff6b6b; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.4); cursor: move;">${index + 1}</div>
        `;

        const marker = new mapboxgl.Marker(el, { draggable: true })
          .setLngLat(zone.center)
          .addTo(map.current!);

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          updateLineZone(zone.id, { center: [lngLat.lng, lngLat.lat] });
        });

        zoneMarkers.current.push(marker);
      });
    }

    // 독립 구역 마커 (zone-place 단계)
    if (creationStep === 'zone-place') {
      creationConfig.zones.forEach((zone, index) => {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="width: 28px; height: 28px; background: ${zone.color}; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold; box-shadow: 0 2px 10px rgba(0,0,0,0.4); cursor: move;">${index + 1}</div>
        `;

        const marker = new mapboxgl.Marker(el, { draggable: true })
          .setLngLat(zone.center)
          .addTo(map.current!);

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          updateCreationZone(zone.id, { center: [lngLat.lng, lngLat.lat] });
        });

        zoneMarkers.current.push(marker);
      });
    }
  }, [creationStep, creationConfig.lineZones, creationConfig.zones, updateLineZone, updateCreationZone]);

  // 저장된 라인 업데이트
  useEffect(() => {
    if (!map.current?.isStyleLoaded()) return;

    const source = map.current.getSource('saved-lines') as mapboxgl.GeoJSONSource;
    if (source) {
      const features = lines
        .filter((line) => validateLineString(line.geometry))
        .map((line) => ({
          type: 'Feature' as const,
          properties: { id: line.id, color: line.color },
          geometry: line.geometry,
        }));
      source.setData({ type: 'FeatureCollection', features });
    }
  }, [lines]);

  // 프리뷰 라인 계산 - 생성 단계에서만 표시
  useEffect(() => {
    if (!map.current?.isStyleLoaded() || !userLocation) return;

    const source = map.current.getSource('preview-line') as mapboxgl.GeoJSONSource;
    if (!source) return;

    // 선 생성 관련 단계가 아니면 미리보기 제거
    const lineCreationSteps = ['select-direction', 'select-points', 'customize', 'add-zone'];
    if (!lineCreationSteps.includes(creationStep) || creationConfig.type !== 'line') {
      source.setData({ type: 'FeatureCollection', features: [] });
      setPreviewGeometry(null, null);
      return;
    }

    let geometry: GeoJSON.LineString | null = null;
    let center: [number, number] | null = null;

    // 방향 모드
    if (creationConfig.lineMode === 'direction') {
      if (creationStep === 'select-direction' || creationStep === 'customize' || creationStep === 'add-zone') {
        const result = generateCircleThroughPoint(
          [userLocation.lon, userLocation.lat],
          creationConfig.bearing,
          offset
        );
        geometry = result.geometry;
        center = result.center;
      }
    }
    // 위치 모드
    else if (creationConfig.lineMode === 'points') {
      if ((creationStep === 'select-points' || creationStep === 'customize' || creationStep === 'add-zone') && 
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

    const currentOrigin: [number, number] = [userLocation.lon, userLocation.lat];
    const validGeometry =
      geometry && validateLineString(geometry, currentOrigin) ? geometry : null;

    if (validGeometry) {
      source.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry: validGeometry }],
      });
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }

    setPreviewGeometry(validGeometry, validGeometry ? center : null);
  }, [
    userLocation,
    creationStep,
    creationConfig.type,
    creationConfig.lineMode,
    creationConfig.bearing,
    creationConfig.selectedPoints,
    offset,
    setPreviewGeometry,
  ]);

  // 구역 표시 업데이트 (선에 붙는 구역) - 저장된 것만 표시, 생성 중인 것은 해당 단계에서만
  useEffect(() => {
    if (!map.current?.isStyleLoaded()) return;

    const source = map.current.getSource('zones') as mapboxgl.GeoJSONSource;
    if (!source) return;

    const zoneFeatures: GeoJSON.Feature[] = [];

    // 저장된 선들의 구역만 표시
    lines.forEach((line) => {
      line.zones.forEach((zone) => {
        zoneFeatures.push({
          type: 'Feature',
          properties: { lineId: line.id, zoneId: zone.id },
          geometry: generateZoneCircle(zone.center, zone.radius),
        });
      });
    });

    // 생성 중인 선의 구역 (customize, add-zone 단계에서만 미리보기)
    if ((creationStep === 'customize' || creationStep === 'add-zone') && creationConfig.type === 'line') {
      creationConfig.lineZones.forEach((zone) => {
        zoneFeatures.push({
          type: 'Feature',
          properties: { zoneId: zone.id, isPreview: true },
          geometry: generateZoneCircle(zone.center, zone.radius),
        });
      });
    }

    source.setData({ type: 'FeatureCollection', features: zoneFeatures });
  }, [lines, creationStep, creationConfig.type, creationConfig.lineZones]);

  // 독립 구역 표시 업데이트 - 저장된 것만 표시, 생성 중인 것은 zone-place에서만
  useEffect(() => {
    if (!map.current?.isStyleLoaded()) return;

    const source = map.current.getSource('standalone-zones') as mapboxgl.GeoJSONSource;
    if (!source) return;

    const zoneFeatures: GeoJSON.Feature[] = [];

    // 저장된 독립 구역들만 표시
    standaloneZones.forEach((zone) => {
      zoneFeatures.push({
        type: 'Feature',
        properties: { zoneId: zone.id, color: zone.color },
        geometry: generateZoneCircle(zone.center, zone.radius),
      });
    });

    // 생성 중인 독립 구역들 (zone-place 단계에서만 미리보기)
    if (creationStep === 'zone-place' && creationConfig.type === 'zone') {
      creationConfig.zones.forEach((zone) => {
        zoneFeatures.push({
          type: 'Feature',
          properties: { zoneId: zone.id, color: zone.color, isPreview: true },
          geometry: generateZoneCircle(zone.center, zone.radius),
        });
      });
    }

    source.setData({ type: 'FeatureCollection', features: zoneFeatures });
  }, [standaloneZones, creationStep, creationConfig.type, creationConfig.zones]);

  // 구역-사용자 연결 점선 업데이트 - 저장된 것만 표시, 생성 중인 것은 zone-place에서만
  useEffect(() => {
    if (!map.current?.isStyleLoaded() || !userLocation) return;

    const source = map.current.getSource('zone-connections') as mapboxgl.GeoJSONSource;
    if (!source) return;

    const connectionFeatures: GeoJSON.Feature[] = [];
    const userCoord: [number, number] = [userLocation.lon, userLocation.lat];

    // 저장된 독립 구역들의 연결선만 표시
    standaloneZones.forEach((zone) => {
      connectionFeatures.push({
        type: 'Feature',
        properties: { zoneId: zone.id, color: zone.color },
        geometry: {
          type: 'LineString',
          coordinates: [userCoord, zone.center],
        },
      });
    });

    // 생성 중인 독립 구역들의 연결선 (zone-place 단계에서만 미리보기)
    if (creationStep === 'zone-place' && creationConfig.type === 'zone') {
      creationConfig.zones.forEach((zone) => {
        connectionFeatures.push({
          type: 'Feature',
          properties: { zoneId: zone.id, color: zone.color, isPreview: true },
          geometry: {
            type: 'LineString',
            coordinates: [userCoord, zone.center],
          },
        });
      });
    }

    source.setData({ type: 'FeatureCollection', features: connectionFeatures });
  }, [standaloneZones, creationStep, creationConfig.type, creationConfig.zones, userLocation]);

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
      const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
        if (!previewGeometry) return;
        
        const coords = previewGeometry.coordinates as [number, number][];
        const nearest = findNearestPointOnLine([e.lngLat.lng, e.lngLat.lat], coords);
        
        if (nearest.distance < 300) {
          setIsNearLine(true);
          canvas.style.cursor = isDraggingOffset ? 'grabbing' : 'grab';
        } else {
          setIsNearLine(false);
          canvas.style.cursor = 'default';
        }

        // 드래그 중
        if (isDraggingOffset && userLocation && dragStartRef.current) {
          const origin: [number, number] = [userLocation.lon, userLocation.lat];
          const currentPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
          
          // 드래그 방향에 따라 offset 계산
          const dragBearing = calculateBearing(origin, currentPoint);
          const bearingDiff = ((dragBearing - creationConfig.bearing + 540) % 360) - 180;
          
          // 드래그 거리
          const dragDistance = calculateDistance(dragStartRef.current.point, currentPoint);
          
          // offset 계산: 방향에 따라 양수/음수
          const direction = (bearingDiff > 0 && bearingDiff < 180) ? 1 : -1;
          const newOffset = direction * Math.min(dragDistance / 5000, 1);
          
          setOffset(newOffset);
        }
      };

      const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
        if (!previewGeometry || !isNearLine) return;
        
        const coords = previewGeometry.coordinates as [number, number][];
        const nearest = findNearestPointOnLine([e.lngLat.lng, e.lngLat.lat], coords);
        
        if (nearest.distance < 300) {
          setIsDraggingOffset(true);
          dragStartRef.current = {
            point: [e.lngLat.lng, e.lngLat.lat],
          };
          map.current?.dragPan.disable();
          canvas.style.cursor = 'grabbing';
        }
      };

      const handleMouseUp = () => {
        if (isDraggingOffset) {
          setIsDraggingOffset(false);
          dragStartRef.current = null;
          map.current?.dragPan.enable();
          canvas.style.cursor = isNearLine ? 'grab' : 'default';
        }
      };

      const handleClick = (e: mapboxgl.MapMouseEvent) => {
        if (isDraggingOffset) return;
        if (!previewGeometry || !isNearLine) return;
        
        const coords = previewGeometry.coordinates as [number, number][];
        const nearest = findNearestPointOnLine([e.lngLat.lng, e.lngLat.lat], coords);
        
        if (nearest.distance < 300) {
          const newZone: LineZone = {
            id: `zone-${Date.now()}`,
            center: nearest.point,
            radius: 100,
          };
          addLineZone(newZone);
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

    // 구역 추가 모드 (선에 구역 추가)
    if (creationStep === 'add-zone') {
      const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
        if (!previewGeometry) return;
        
        const coords = previewGeometry.coordinates as [number, number][];
        const nearest = findNearestPointOnLine([e.lngLat.lng, e.lngLat.lat], coords);
        
        if (nearest.distance < 300) {
          setIsNearLine(true);
          canvas.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'32\' viewBox=\'0 0 24 32\'%3E%3Cpath d=\'M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z\' fill=\'%23ff6b6b\'/%3E%3Ccircle cx=\'12\' cy=\'10\' r=\'4\' fill=\'white\'/%3E%3C/svg%3E") 12 32, crosshair';
        } else {
          setIsNearLine(false);
          canvas.style.cursor = 'crosshair';
        }

        if (isDraggingZone && editingZoneId) {
          const zone = creationConfig.lineZones.find(z => z.id === editingZoneId);
          if (zone) {
            const newRadius = calculateDistance(zone.center, [e.lngLat.lng, e.lngLat.lat]);
            updateLineZone(editingZoneId, { radius: newRadius });
          }
        }
      };

      const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
        if (!previewGeometry) return;
        
        for (const zone of creationConfig.lineZones) {
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
        
        if (nearest.distance < 300) {
          const newZone: LineZone = {
            id: `zone-${Date.now()}`,
            center: nearest.point,
            radius: 100,
          };
          addLineZone(newZone);
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

    // 독립 구역 만들기 모드
    if (creationStep === 'zone-place') {
      const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
        // 구역 반경 드래그
        if (isDraggingZone && editingZoneId) {
          const zone = creationConfig.zones.find(z => z.id === editingZoneId);
          if (zone) {
            const newRadius = calculateDistance(zone.center, [e.lngLat.lng, e.lngLat.lat]);
            updateCreationZone(editingZoneId, { radius: Math.max(0.1, newRadius) });
          }
          canvas.style.cursor = 'ew-resize';
        } else {
          // 구역 위에 있으면 리사이즈 커서
          let onZone = false;
          for (const zone of creationConfig.zones) {
            const dist = calculateDistance(zone.center, [e.lngLat.lng, e.lngLat.lat]);
            const tolerance = Math.max(zone.radius * 0.2, 0.5); // 반경의 20% 또는 최소 0.5km
            if (Math.abs(dist - zone.radius) < tolerance) {
              onZone = true;
              canvas.style.cursor = 'ew-resize';
              break;
            }
          }
          if (!onZone) {
            canvas.style.cursor = 'crosshair';
          }
        }
      };

      const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
        // 구역 테두리 근처면 리사이즈 시작
        for (const zone of creationConfig.zones) {
          const dist = calculateDistance(zone.center, [e.lngLat.lng, e.lngLat.lat]);
          const tolerance = Math.max(zone.radius * 0.2, 0.5);
          if (Math.abs(dist - zone.radius) < tolerance) {
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
          setEditingZoneId(null);
          map.current?.dragPan.enable();
        }
      };

      const handleClick = (e: mapboxgl.MapMouseEvent) => {
        if (isDraggingZone) return;
        
        // 기존 구역 위를 클릭하면 무시
        for (const zone of creationConfig.zones) {
          const dist = calculateDistance(zone.center, [e.lngLat.lng, e.lngLat.lat]);
          if (dist < zone.radius) {
            return; // 구역 내부 클릭 - 아무것도 하지 않음
          }
        }
        
        // scope에 따른 초기 반경 설정
        const initialRadius = creationConfig.scope === 'nearby' ? 0.01 : 1; // 근처: 10m, 그 외: 1km
        
        // 새 구역 생성
        const newZone: Zone = {
          id: `zone-${Date.now()}`,
          creatorId: 'user-1',
          createdAt: new Date().toISOString(),
          center: [e.lngLat.lng, e.lngLat.lat],
          radius: initialRadius,
          color: getRandomLineColor(),
        };
        addCreationZone(newZone);
        setEditingZoneId(newZone.id);
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
    offset,
    isDraggingOffset,
    isDraggingZone,
    isNearLine,
    editingZoneId,
    setBearing,
    setOffset,
    setCreationStep,
    addSelectedPoint,
    addLineZone,
    updateLineZone,
    addCreationZone,
    updateCreationZone,
  ]);

  // 표시용 반경
  const displayRadius = offsetToDisplayRadius(offset);

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
            {isDraggingOffset 
              ? `📐 ${offset > 0 ? 'N 반구' : offset < 0 ? 'S 반구' : '대원'} | ${Math.round(displayRadius).toLocaleString()} km`
              : isNearLine 
                ? '✋ 드래그로 원 크기 조절 · 클릭으로 구역 추가' 
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

      {creationStep === 'zone-place' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#1a1a24]/90 backdrop-blur-sm px-6 py-3 rounded-full border border-[#00d4aa]/50 z-10">
          <p className="text-sm text-white">
            {isDraggingZone 
              ? '📐 드래그하여 반경 조절'
              : `⭕ 지도를 클릭하여 구역 추가 (${creationConfig.zones.length}개)`}
          </p>
        </div>
      )}
    </div>
  );
}
