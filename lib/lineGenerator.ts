import * as turf from '@turf/turf';

export interface GreatCircleOptions {
  origin: [number, number]; // [lng, lat]
  bearing: number; // 0-360 degrees
  steps?: number; // Number of points (default: 200)
}

export interface CircleFromPointsOptions {
  points: [number, number][]; // 3개의 점 [lng, lat]
  steps?: number;
}

export interface SmallCircleOptions {
  center: [number, number]; // 원의 중심점 [lng, lat]
  radius: number; // 반경 (km)
  steps?: number;
}

/**
 * 지구를 한 바퀴 도는 Great Circle 경로 생성
 */
export function generateGreatCircleLine(options: GreatCircleOptions): GeoJSON.LineString {
  const { origin, bearing, steps = 200 } = options;
  const coordinates: [number, number][] = [];

  // 지구 둘레 약 40,075km
  const earthCircumference = 40075;
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
 * 3점을 지나는 원 생성 (구면 기하학)
 * 내 위치 + 선택한 2개 점 = 3점을 지나는 원
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
  
  // 방향이 거의 같거나 정반대면 직선 위에 있음
  const bearingDiff = Math.abs(bearing12 - bearing13);
  if (bearingDiff < 5 || bearingDiff > 175 && bearingDiff < 185 || bearingDiff > 355) {
    return null; // 직선 위에 있으면 원을 만들 수 없음
  }

  // 구면 삼각형의 외심 계산 (근사치)
  // 두 점의 수직이등분선의 교점을 찾음
  const mid12 = turf.midpoint(point1, point2);
  const mid23 = turf.midpoint(point2, point3);
  
  const perpBearing12 = (bearing12 + 90) % 360;
  const perpBearing23 = (turf.bearing(point2, point3) + 90) % 360;
  
  // 두 수직이등분선의 교점 찾기 (근사)
  // 각 선을 따라 여러 점을 생성하고 가장 가까운 점 찾기
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
  
  // 반경 계산 (중심에서 첫 번째 점까지의 거리)
  const radius = turf.distance(center, point1, { units: 'kilometers' });
  
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
    radius,
  };
}

/**
 * 작은 원(Small Circle) 생성 - 지정된 중심과 반경
 */
export function generateSmallCircle(options: SmallCircleOptions): GeoJSON.LineString {
  const { center, radius, steps = 200 } = options;
  const coordinates: [number, number][] = [];

  for (let i = 0; i <= steps; i++) {
    const angle = (360 / steps) * i;
    const point = turf.destination(center, radius, angle, { units: 'kilometers' });
    coordinates.push(point.geometry.coordinates as [number, number]);
  }

  return {
    type: 'LineString',
    coordinates,
  };
}

/**
 * 구역 원 생성 (최대 5km 반경)
 */
export function generateZoneCircle(
  center: [number, number],
  radius: number,
  steps: number = 64
): GeoJSON.Polygon {
  const clampedRadius = Math.min(radius, 5); // 최대 5km
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
 * 두 점 사이의 방향각(bearing) 계산
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
 * 점이 원(선) 위에 있는지 확인 (허용 오차 내)
 */
export function isPointOnLine(
  point: [number, number],
  lineCoordinates: [number, number][],
  toleranceKm: number = 50
): boolean {
  const lineString = turf.lineString(lineCoordinates);
  const pointFeature = turf.point(point);
  const distance = turf.pointToLineDistance(pointFeature, lineString, { units: 'kilometers' });
  return distance <= toleranceKm;
}

/**
 * 점이 구역 내에 있는지 확인
 */
export function isPointInZone(
  point: [number, number],
  zoneCenter: [number, number],
  zoneRadius: number
): boolean {
  const distance = turf.distance(point, zoneCenter, { units: 'kilometers' });
  return distance <= zoneRadius;
}
