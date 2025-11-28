import * as turf from '@turf/turf';

export interface GreatCircleOptions {
  origin: [number, number]; // [lng, lat]
  bearing: number; // 0-360 degrees
  steps?: number; // Number of points (default: 200)
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
 * 더미 선 데이터 생성
 */
export function generateDummyLines(): GeoJSON.FeatureCollection {
  const dummyOrigins: Array<{ origin: [number, number]; bearing: number; color: string }> = [
    { origin: [126.978, 37.5665], bearing: 45, color: '#ff6b6b' },   // Seoul → NE
    { origin: [-74.006, 40.7128], bearing: 90, color: '#4ecdc4' },   // NYC → E
    { origin: [139.6917, 35.6895], bearing: 270, color: '#ffe66d' }, // Tokyo → W
    { origin: [-43.1729, -22.9068], bearing: 30, color: '#95e1d3' }, // Rio → NE
  ];

  const features = dummyOrigins.map((item, index) => ({
    type: 'Feature' as const,
    properties: {
      id: `dummy-${index}`,
      color: item.color,
    },
    geometry: generateGreatCircleLine({
      origin: item.origin,
      bearing: item.bearing,
    }),
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
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

