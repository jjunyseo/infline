import * as turf from '@turf/turf';

const EARTH_HALF_CIRCUMFERENCE = 20037.5; // km

/**
 * 대원의 평면을 회전시켜 원을 생성
 * 
 * - origin: 사용자 위치 (원이 항상 지나는 점)
 * - bearing: 대원의 방향
 * - tilt: 평면 회전 각도 (-90 ~ 0 ~ 90)
 *   - 0: 대원 (지구 한 바퀴)
 *   - +90: 오른쪽으로 90도 회전 → 점
 *   - -90: 왼쪽으로 90도 회전 → 점
 */
export function generateTiltedCircle(
  origin: [number, number],
  bearing: number,
  tilt: number,
  steps: number = 200
): {
  geometry: GeoJSON.LineString;
  center: [number, number];
} {
  const absTilt = Math.abs(tilt);
  
  // tilt가 거의 0이면 대원
  if (absTilt < 1) {
    return {
      geometry: generateGreatCircleLine(origin, bearing, steps),
      center: origin,
    };
  }
  
  // tilt 방향 (bearing에 수직)
  const tiltDirection = tilt > 0 
    ? (bearing + 90) % 360 
    : (bearing - 90 + 360) % 360;
  
  // tilt 강도 (0 ~ 1)
  // 0: 대원, 1: 점
  const tiltStrength = absTilt / 90;
  
  const coordinates: [number, number][] = [];
  const earthCircumference = 40075;
  const stepDistance = earthCircumference / steps;
  
  for (let i = 0; i <= steps; i++) {
    // 대원 위의 점
    const distance = stepDistance * i;
    const greatCirclePoint = turf.destination(origin, distance, bearing, { units: 'kilometers' });
    const gcCoord = greatCirclePoint.geometry.coordinates as [number, number];
    
    // 대원에서의 진행도 (0 → 1 → 0, 중간에서 최대)
    const t = i / steps;
    const progress = Math.sin(t * Math.PI);
    
    // === 평면 회전 효과 ===
    // 1. 대원의 점을 tiltDirection 방향으로 밀기
    // 2. 동시에 origin 쪽으로 수축 (점으로 수렴)
    
    // 밀리는 양 (중간 지점에서 최대)
    const maxPush = 8000 * tiltStrength; // 최대 밀림
    const pushDistance = progress * maxPush;
    
    // tiltDirection 방향으로 밀기
    let coord: [number, number];
    
    if (pushDistance > 10) {
      const pushedPoint = turf.destination(gcCoord, pushDistance, tiltDirection, { units: 'kilometers' });
      coord = pushedPoint.geometry.coordinates as [number, number];
    } else {
      coord = gcCoord;
    }
    
    // 점으로 수렴하기 위해 origin 쪽으로 당기기
    // tiltStrength가 커질수록 더 많이 당김
    // 수렴점: origin에서 tiltDirection 방향으로 약간 떨어진 점
    const convergenceDistance = 100 * (1 - tiltStrength); // tilt=90일 때 0
    const convergencePoint = turf.destination(origin, convergenceDistance, tiltDirection, { units: 'kilometers' });
    const convergence = convergencePoint.geometry.coordinates as [number, number];
    
    // 현재 위치에서 수렴점 쪽으로 보간
    // tiltStrength^2를 사용해서 끝에서 급격히 수렴
    const pullFactor = Math.pow(tiltStrength, 1.5) * progress;
    
    const finalLng = coord[0] + (convergence[0] - coord[0]) * pullFactor;
    const finalLat = coord[1] + (convergence[1] - coord[1]) * pullFactor;
    
    coordinates.push([finalLng, finalLat]);
  }
  
  // 중심 계산 (중간 지점)
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
 * tilt 값에서 표시용 반경 계산
 */
export function tiltToDisplayRadius(tilt: number): number {
  const absTilt = Math.abs(tilt);
  if (absTilt < 1) return EARTH_HALF_CIRCUMFERENCE;
  
  // tilt가 커질수록 반경이 줄어듦
  const tiltStrength = absTilt / 90;
  return EARTH_HALF_CIRCUMFERENCE * (1 - tiltStrength * 0.99);
}

// 상수 export
export { EARTH_HALF_CIRCUMFERENCE };
