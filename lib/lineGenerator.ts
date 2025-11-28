import * as turf from '@turf/turf';

const EARTH_HALF_CIRCUMFERENCE = 20037.5; // km

/**
 * 대원과 접하면서 사용자 위치를 지나는 원 생성
 * 
 * - origin: 사용자 위치 (원이 지나는 점)
 * - bearing: 대원의 방향
 * - radius: 원의 반경 (대원일 때 EARTH_HALF_CIRCUMFERENCE)
 * - shrinkDirection: 축소 방향 ('left' = bearing-90, 'right' = bearing+90)
 * 
 * 원리:
 * - 대원: 사용자 위치를 지나며 bearing 방향으로 진행
 * - 축소된 원: 대원의 접선 방향으로 사용자 위치에서 벗어나지 않으며 축소
 * - 원의 중심은 사용자 위치에서 접선에 수직인 방향(축소 방향)으로 이동
 */
export function generateCircleWithDirection(
  origin: [number, number],
  bearing: number,
  radius: number,
  shrinkDirection: 'left' | 'right' | null,
  steps: number = 200
): {
  geometry: GeoJSON.LineString;
  center: [number, number];
} {
  // 대원인 경우 (radius가 최대에 가까움)
  if (radius >= EARTH_HALF_CIRCUMFERENCE - 100) {
    return {
      geometry: generateGreatCircleLine(origin, bearing, steps),
      center: origin,
    };
  }

  // 축소 방향이 없으면 기본 대원 반환
  if (!shrinkDirection) {
    return {
      geometry: generateGreatCircleLine(origin, bearing, steps),
      center: origin,
    };
  }

  // 원의 중심 방향 계산
  // 접선 방향 = bearing (대원을 따라가는 방향)
  // 수직 방향 = bearing ± 90도 (축소 방향)
  const centerBearing = shrinkDirection === 'right' 
    ? (bearing + 90) % 360 
    : (bearing - 90 + 360) % 360;
  
  // 원의 중심: 사용자 위치에서 centerBearing 방향으로 radius만큼 이동
  const centerPoint = turf.destination(origin, radius, centerBearing, { units: 'kilometers' });
  const center = centerPoint.geometry.coordinates as [number, number];
  
  // 원 생성 (중심에서 radius 거리에 있는 점들)
  const coordinates: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (360 / steps) * i;
    const point = turf.destination(center, radius, angle, { units: 'kilometers' });
    coordinates.push(point.geometry.coordinates as [number, number]);
  }

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
  const earthCircumference = 40075; // km
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
 * bearing 기준으로 왼쪽/오른쪽 판단
 */
export function determineShrinkDirection(
  origin: [number, number],
  dragPoint: [number, number],
  bearing: number
): 'left' | 'right' {
  const dragBearing = turf.bearing(origin, dragPoint);
  
  // bearing과 dragBearing의 차이 계산 (-180 ~ 180)
  let diff = dragBearing - bearing;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  
  // 양수면 오른쪽, 음수면 왼쪽
  return diff >= 0 ? 'right' : 'left';
}
