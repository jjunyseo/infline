import * as turf from '@turf/turf';

const EARTH_HALF_CIRCUMFERENCE = 20037.5; // km (지구 둘레의 절반)
const MIN_RADIUS = 50; // 최소 반경

/**
 * 대원에서 시작해서 점진적으로 작은 원으로 변형
 * 
 * - origin: 사용자 위치 (원이 항상 지나는 점)
 * - bearing: 대원의 방향
 * - offset: 대원에서 얼마나 옆으로 밀렸는지 (0 = 대원, 큰값 = 작은 원)
 * - shrinkDirection: 밀리는 방향 ('left' = bearing-90, 'right' = bearing+90)
 */
export function generateCircleWithDirection(
  origin: [number, number],
  bearing: number,
  offset: number,
  shrinkDirection: 'left' | 'right' | null,
  steps: number = 200
): {
  geometry: GeoJSON.LineString;
  center: [number, number];
} {
  // offset이 0이거나 방향이 없으면 대원
  if (!shrinkDirection || offset < 10) {
    return {
      geometry: generateGreatCircleLine(origin, bearing, steps),
      center: origin,
    };
  }

  // 옆으로 밀 방향
  const offsetBearing = shrinkDirection === 'right' 
    ? (bearing + 90) % 360 
    : (bearing - 90 + 360) % 360;

  // 대원의 각 점을 생성하면서 옆으로 밀기
  const coordinates: [number, number][] = [];
  const earthCircumference = 40075;
  const stepDistance = earthCircumference / steps;

  for (let i = 0; i <= steps; i++) {
    // 대원 위의 점
    const distance = stepDistance * i;
    const greatCirclePoint = turf.destination(origin, distance, bearing, { units: 'kilometers' });
    const coord = greatCirclePoint.geometry.coordinates as [number, number];
    
    // offset 양에 따라 점을 옆으로 이동
    // 시작점(origin)과 끝점은 고정, 중간(지구 반대편)에서 최대로 이동
    const progress = i / steps; // 0 ~ 1
    const actualOffset = offset * Math.sin(progress * Math.PI);
    
    if (actualOffset > 10) {
      const newPoint = turf.destination(coord, actualOffset, offsetBearing, { units: 'kilometers' });
      coordinates.push(newPoint.geometry.coordinates as [number, number]);
    } else {
      coordinates.push(coord);
    }
  }

  // 원의 중심 계산 (중간 지점)
  const midIndex = Math.floor(steps / 2);
  const center = coordinates[midIndex];

  return {
    geometry: { type: 'LineString', coordinates },
    center,
  };
}

/**
 * 지구를 한 바퀴 도는 Great Circle (대원) 생성
 */
export function generateGreatCircleLine(
  origin: [number, number],
  bearing: number,
  steps: number = 200
): GeoJSON.LineString {
  const coordinates: [number, number][] = [];
  const earthCircumference = 40075;
  const stepDistance = earthCircumference / steps;

  for (let i = 0; i <= steps; i++) {
    const distance = stepDistance * i;
    const point = turf.destination(origin, distance, bearing, { units: 'kilometers' });
    coordinates.push(point.geometry.coordinates as [number, number]);
  }

  return { type: 'LineString', coordinates };
}

/**
 * 3점을 지나는 원 생성
 */
export function generateCircleFromThreePoints(
  point1: [number, number],
  point2: [number, number],
  point3: [number, number],
  steps: number = 200
): { geometry: GeoJSON.LineString; center: [number, number]; radius: number } | null {
  const bearing12 = turf.bearing(point1, point2);
  const bearing13 = turf.bearing(point1, point3);
  
  const bearingDiff = Math.abs(bearing12 - bearing13);
  if (bearingDiff < 5 || (bearingDiff > 175 && bearingDiff < 185) || bearingDiff > 355) {
    return null;
  }

  const mid12 = turf.midpoint(point1, point2);
  const mid23 = turf.midpoint(point2, point3);
  
  const perpBearing12 = (bearing12 + 90) % 360;
  const perpBearing23 = (turf.bearing(point2, point3) + 90) % 360;
  
  let minDistance = Infinity;
  let center: [number, number] = mid12.geometry.coordinates as [number, number];
  
  for (let d1 = -10000; d1 <= 10000; d1 += 100) {
    const p1 = turf.destination(mid12.geometry.coordinates as [number, number], d1, perpBearing12, { units: 'kilometers' });
    
    for (let d2 = -10000; d2 <= 10000; d2 += 100) {
      const p2 = turf.destination(mid23.geometry.coordinates as [number, number], d2, perpBearing23, { units: 'kilometers' });
      
      const dist = turf.distance(p1, p2, { units: 'kilometers' });
      if (dist < minDistance) {
        minDistance = dist;
        center = p1.geometry.coordinates as [number, number];
      }
    }
  }
  
  const radius = turf.distance(center, point1, { units: 'kilometers' });
  
  const coordinates: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (360 / steps) * i;
    const point = turf.destination(center, radius, angle, { units: 'kilometers' });
    coordinates.push(point.geometry.coordinates as [number, number]);
  }

  return {
    geometry: { type: 'LineString', coordinates },
    center,
    radius,
  };
}

/**
 * 구역 원 생성
 */
export function generateZoneCircle(
  center: [number, number],
  radius: number,
  steps: number = 64
): GeoJSON.Polygon {
  const circle = turf.circle(center, radius, { steps, units: 'kilometers' });
  return circle.geometry;
}

/**
 * 선 색상 랜덤 생성
 */
export function getRandomLineColor(): string {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3',
    '#a29bfe', '#fd79a8', '#00cec9', '#fab1a0',
    '#74b9ff', '#00d4aa', '#ff7675', '#fdcb6e',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 두 점 사이의 방향각 계산
 */
export function calculateBearing(from: [number, number], to: [number, number]): number {
  return turf.bearing(from, to);
}

/**
 * 두 점 사이의 거리 계산 (km)
 */
export function calculateDistance(from: [number, number], to: [number, number]): number {
  return turf.distance(from, to, { units: 'kilometers' });
}

/**
 * 선 위의 가장 가까운 점 찾기
 */
export function findNearestPointOnLine(
  point: [number, number],
  lineCoordinates: [number, number][]
): { point: [number, number]; distance: number; index: number } {
  let minDist = Infinity;
  let nearestPoint: [number, number] = lineCoordinates[0];
  let nearestIndex = 0;

  lineCoordinates.forEach((coord, index) => {
    const dist = turf.distance(point, coord, { units: 'kilometers' });
    if (dist < minDist) {
      minDist = dist;
      nearestPoint = coord;
      nearestIndex = index;
    }
  });

  return { point: nearestPoint, distance: minDist, index: nearestIndex };
}

/**
 * 드래그 방향으로부터 축소 방향 결정
 */
export function determineShrinkDirection(
  origin: [number, number],
  dragPoint: [number, number],
  bearing: number
): 'left' | 'right' {
  const dragBearing = turf.bearing(origin, dragPoint);
  
  let diff = dragBearing - bearing;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  
  return diff >= 0 ? 'right' : 'left';
}

/**
 * offset 값을 "반경"처럼 표시하기 위한 변환
 * offset이 클수록 원이 작아지므로, 표시용 반경은 역수 관계
 */
export function offsetToDisplayRadius(offset: number): number {
  if (offset < 10) return EARTH_HALF_CIRCUMFERENCE;
  // offset이 커질수록 표시 반경이 줄어듦
  const maxOffset = 10000; // 최대 offset
  const ratio = Math.min(offset / maxOffset, 1);
  return EARTH_HALF_CIRCUMFERENCE * (1 - ratio * 0.95); // 최소 5%까지
}

// 상수 export
export { EARTH_HALF_CIRCUMFERENCE, MIN_RADIUS };
