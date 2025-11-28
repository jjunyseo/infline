import * as turf from '@turf/turf';

const EARTH_RADIUS_KM = 6371; // Mean Earth radius
const EARTH_HALF_CIRCUMFERENCE = Math.PI * EARTH_RADIUS_KM; // ≈ 20,037 km
const MAX_OFFSET_ANGLE = Math.PI / 2 - 1e-4; // Prevent singularity at exactly ±90°
const EPSILON = 1e-9;

type Vector3 = [number, number, number];

interface CircleGeometryParams {
  normal: Vector3;
  pointOnPlane: Vector3;
  steps: number;
  startCoordinate?: [number, number];
}

interface CircleGeometryResult {
  geometry: GeoJSON.LineString;
  radiusKm: number;
  planeOffset: number;
}

interface LocalFrame {
  point: Vector3;
  tangent: Vector3;
  normal: Vector3;
  startCoordinate: [number, number];
}

/**
 * Converts longitude/latitude (degrees) to a 3D unit vector on the unit sphere.
 */
function latLonToVector([lng, lat]: [number, number]): Vector3 {
  const lonRad = degToRad(lng);
  const latRad = degToRad(lat);
  const cosLat = Math.cos(latRad);
  return [Math.cos(lonRad) * cosLat, Math.sin(lonRad) * cosLat, Math.sin(latRad)];
}

/**
 * Converts a 3D unit vector back to longitude/latitude (degrees).
 */
function vectorToLonLat([x, y, z]: Vector3): [number, number] {
  const lon = Math.atan2(y, x);
  const lat = Math.asin(clamp(z, -1, 1));
  return [radToDeg(lon), radToDeg(lat)];
}

const degToRad = (deg: number) => (deg * Math.PI) / 180;
const radToDeg = (rad: number) => (rad * 180) / Math.PI;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const add = (a: Vector3, b: Vector3): Vector3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const subtract = (a: Vector3, b: Vector3): Vector3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (v: Vector3, s: number): Vector3 => [v[0] * s, v[1] * s, v[2] * s];
const dot = (a: Vector3, b: Vector3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vector3, b: Vector3): Vector3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const length = (v: Vector3) => Math.hypot(v[0], v[1], v[2]);
const normalize = (v: Vector3): Vector3 => {
  const len = length(v);
  if (len < EPSILON) {
    return [0, 0, 0];
  }
  return [v[0] / len, v[1] / len, v[2] / len];
};

function rotateVectorAroundAxis(vector: Vector3, axis: Vector3, angle: number): Vector3 {
  const unitAxis = normalize(axis);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const term1 = scale(vector, cos);
  const term2 = scale(cross(unitAxis, vector), sin);
  const term3 = scale(unitAxis, dot(unitAxis, vector) * (1 - cos));
  return normalize(add(add(term1, term2), term3));
}

function buildCircleGeometry({
  normal,
  pointOnPlane,
  steps,
  startCoordinate,
}: CircleGeometryParams): CircleGeometryResult {
  const unitNormal = normalize(normal);
  const clampedSteps = Math.max(3, Math.floor(steps));
  const planeOffset = clamp(dot(unitNormal, pointOnPlane), -1, 1);
  const radiusFactor = Math.max(0, Math.sqrt(Math.max(0, 1 - planeOffset * planeOffset)));

  // Degenerate case: plane tangent to sphere, the circle collapses to the reference point.
  if (radiusFactor < 1e-6) {
    const coordinate = startCoordinate ?? vectorToLonLat(pointOnPlane);
    const coordinates = Array.from({ length: clampedSteps + 1 }, () => coordinate);
    return {
      geometry: { type: 'LineString', coordinates },
      radiusKm: 0,
      planeOffset,
    };
  }

  const centerVec = scale(unitNormal, planeOffset);
  const u = normalize(subtract(pointOnPlane, centerVec));
  let v = normalize(cross(unitNormal, u));
  if (length(v) < EPSILON) {
    // Fallback: use cross with an arbitrary axis if u is parallel to the normal.
    v = normalize(cross(unitNormal, [1, 0, 0]));
  }

  const coordinates: [number, number][] = [];
  for (let i = 0; i <= clampedSteps; i++) {
    const angle = (2 * Math.PI * i) / clampedSteps;
    let pointVec = add(
      centerVec,
      add(scale(u, radiusFactor * Math.cos(angle)), scale(v, radiusFactor * Math.sin(angle)))
    );
    pointVec = normalize(pointVec);
    coordinates.push(vectorToLonLat(pointVec));
  }

  const enforcedStart = startCoordinate ?? vectorToLonLat(pointOnPlane);
  coordinates[0] = enforcedStart;
  coordinates[coordinates.length - 1] = enforcedStart;

  return {
    geometry: { type: 'LineString', coordinates },
    radiusKm: EARTH_HALF_CIRCUMFERENCE * radiusFactor,
    planeOffset,
  };
}

function getLocalFrame(origin: [number, number], bearing: number): LocalFrame {
  const startCoordinate: [number, number] = [origin[0], origin[1]];
  const point = normalize(latLonToVector(origin));
  const lonRad = degToRad(origin[0]);
  const latRad = degToRad(origin[1]);

  let north: Vector3 = [
    -Math.cos(lonRad) * Math.sin(latRad),
    -Math.sin(lonRad) * Math.sin(latRad),
    Math.cos(latRad),
  ];
  if (length(north) < EPSILON) {
    north = [0, 0, origin[1] >= 0 ? -1 : 1];
  }
  north = normalize(north);

  let east: Vector3 = [-Math.sin(lonRad), Math.cos(lonRad), 0];
  if (length(east) < EPSILON) {
    east = [0, 1, 0];
  }
  east = normalize(east);

  const bearingRad = degToRad(((bearing % 360) + 360) % 360);
  let tangent = add(scale(north, Math.cos(bearingRad)), scale(east, Math.sin(bearingRad)));
  if (length(tangent) < EPSILON) {
    tangent = east;
  }
  tangent = normalize(tangent);

  let normal = normalize(cross(point, tangent));
  if (length(normal) < EPSILON) {
    // If origin is at a pole, fall back to a plane normal aligned with longitude.
    normal = normalize(cross(point, [0, 1, 0]));
  }

  return { point, tangent, normal, startCoordinate };
}

/**
 * Generates the great circle defined by the user's location (P) and an initial bearing.
 *
 * - The returned LineString is a closed loop whose first/last coordinate equals `origin`.
 * - The curve lies entirely on the sphere and passes through `origin`.
 */
export function generateGreatCircleLine(
  origin: [number, number],
  bearing: number,
  steps: number = 360
): GeoJSON.LineString {
  const frame = getLocalFrame(origin, bearing);
  const circle = buildCircleGeometry({
    normal: frame.normal,
    pointOnPlane: frame.point,
    steps,
    startCoordinate: frame.startCoordinate,
  });
  return circle.geometry;
}

/**
 * Generates a member of set A: the intersection of the sphere with a plane that
 * passes through the current location P. The plane is derived by rotating the
 * great-circle plane around the tangent vector at P.
 *
 * @param origin  Current user location (P) in [lng, lat].
 * @param bearing Initial bearing (clockwise from north) defining the reference great circle.
 * @param offset  Slider position in [-1, 1]. 0 → great circle, +1 → N-hemisphere tangent, -1 → S-hemisphere tangent.
 * @param steps   Number of samples for the resulting LineString.
 *
 * The returned LineString is always closed, always contains `origin`, and shrinks
 * smoothly as |offset| increases. When |offset| → 1 the circle converges to the point P.
 */
export function generateCircleThroughPoint(
  origin: [number, number],
  bearing: number,
  offset: number,
  steps: number = 360
): {
  geometry: GeoJSON.LineString;
  center: [number, number];
  radiusKm: number;
  planeOffset: number;
} {
  const frame = getLocalFrame(origin, bearing);
  const clampedOffset = clamp(offset, -1, 1);

  if (Math.abs(clampedOffset) < 1e-4) {
    return {
      geometry: generateGreatCircleLine(origin, bearing, steps),
      center: origin,
      radiusKm: EARTH_HALF_CIRCUMFERENCE,
      planeOffset: 0,
    };
  }

  const theta = clampedOffset * MAX_OFFSET_ANGLE;
  const rotatedNormal = rotateVectorAroundAxis(frame.normal, frame.tangent, theta);
  const circle = buildCircleGeometry({
    normal: rotatedNormal,
    pointOnPlane: frame.point,
    steps,
    startCoordinate: frame.startCoordinate,
  });

  return {
    geometry: circle.geometry,
    center: origin,
    radiusKm: circle.radiusKm,
    planeOffset: circle.planeOffset,
  };
}

/**
 * Generates the unique circle passing through the user location and two picked points.
 * The three points define a plane; the returned LineString is the intersection of
 * that plane with the sphere, producing a closed curve that contains all three points.
 */
export function generateCircleFromThreePoints(
  point1: [number, number],
  point2: [number, number],
  point3: [number, number],
  steps: number = 360
): { geometry: GeoJSON.LineString; center: [number, number]; radius: number } | null {
  const a = latLonToVector(point1);
  const b = latLonToVector(point2);
  const c = latLonToVector(point3);

  const normal = cross(subtract(b, a), subtract(c, a));
  if (length(normal) < EPSILON) {
    return null;
  }

  const circle = buildCircleGeometry({
    normal,
    pointOnPlane: a,
    steps,
    startCoordinate: point1,
  });

  return {
    geometry: circle.geometry,
    center: point1,
    radius: circle.radiusKm,
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
 * offset 값에서 표시용 반경 계산
 * offset = 0: 대원 (20037 km)
 * offset = ±1: 점 (0 km)
 */
export function offsetToDisplayRadius(offset: number): number {
  const clampedOffset = clamp(offset, -1, 1);
  const theta = Math.abs(clampedOffset) * MAX_OFFSET_ANGLE;
  const radiusFactor = Math.max(0, Math.cos(theta));
  return EARTH_HALF_CIRCUMFERENCE * radiusFactor;
}

// 상수 export
export { EARTH_HALF_CIRCUMFERENCE, EARTH_RADIUS_KM, MAX_OFFSET_ANGLE };
