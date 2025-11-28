import * as turf from '@turf/turf';

export interface CircleLineOptions {
  origin: [number, number]; // [lng, lat] - 사용자 위치
  bearing: number; // 방향각 (0-360)
  radius: number; // 반경 (km)
  steps?: number;
}

/**
 * 사용자 위치를 지나고 특정 방향/반경의 원 생성
 * - origin: 사용자 위치 (원이 지나가는 점)
 * - bearing: 원의 방향 (사용자 위치에서 원의 중심 방향)
 * - radius: 원의 반경
 */
export function generateCircleLine(options: CircleLineOptions): {
  geometry: GeoJSON.LineString;
  center: [number, number];
} {
  const { origin, bearing, radius, steps = 200 } = options;
  
  // 원의 중심 계산: 사용자 위치에서 bearing 방향으로 radius만큼 떨어진 점
  const centerPoint = turf.destination(origin, radius, bearing, { units: 'kilometers' });
  const center = centerPoint.geometry.coordinates as [number, number];
  
  // 원 생성
  const coordinates: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (360 / steps) * i;
    const point = turf.destination(center, radius, angle, { units: 'kilometers' });
    coordinates.push(point.geometry.coordinates as [number, number]);
  }

  return {
    geometry: {
      type: 'LineString',
      coordinates,
    },
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

  return {
    type: 'LineString',
    coordinates,
  };
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
  // 3점이 한 직선 위에 있는지 확인
  const bearing12 = turf.bearing(point1, point2);
  const bearing13 = turf.bearing(point1, point3);
  
  const bearingDiff = Math.abs(bearing12 - bearing13);
  if (bearingDiff < 5 || (bearingDiff > 175 && bearingDiff < 185) || bearingDiff > 355) {
    return null;
  }

  // 두 점의 수직이등분선 교점 찾기 (근사)
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
 * 구역 원 생성 (최대 5km)
 */
export function generateZoneCircle(
  center: [number, number],
  radius: number,
  steps: number = 64
): GeoJSON.Polygon {
  const clampedRadius = Math.min(radius, 5);
  const circle = turf.circle(center, clampedRadius, { steps, units: 'kilometers' });
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
