export interface Line {
  id: string;
  creatorId: string;
  createdAt: string;
  expiresAt: string;
  geometry: GeoJSON.LineString;
  color: string;
  name?: string;
  maxRiders: number;
  riderCount: number;
  center: [number, number];
  radius: number;
  bearing: number;
  zones: LineZone[];
}

export interface LineZone {
  id: string;
  center: [number, number];
  radius: number;
}

// 독립적인 구역 (선 없이 만들 수 있는 구역)
export interface Zone {
  id: string;
  creatorId: string;
  createdAt: string;
  center: [number, number];
  radius: number;
  color: string;
  name?: string;
}

export interface UserLocation {
  lat: number;
  lon: number;
}

export interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
}

export interface SearchPin {
  center: [number, number];
  place_name: string;
}

// 생성 범위: 근처, 도시, 국가, 지구
export type CreationScope = 'nearby' | 'city' | 'country' | 'globe';

// 생성 유형: 선 만들기, 구역 만들기
export type CreationType = 'line' | 'zone';

export type CreationStep = 
  | 'select-scope'      // 1. 범위 선택 (근처/도시/국가/지구)
  | 'select-type'       // 2. 유형 선택 (선/구역)
  | 'select-mode'       // 3. 선 만들기: 방식 선택 (방향/위치)
  | 'select-direction'  // 4a. 방향 선택
  | 'select-points'     // 4b. 위치 선택
  | 'customize'         // 5. 커스터마이징
  | 'add-zone'          // 6. 구역 추가 (선에 구역 추가)
  | 'zone-place'        // 구역 만들기: 구역 위치 선택
  | 'zone-customize';   // 구역 만들기: 구역 설정

export interface CreationConfig {
  scope: CreationScope;
  type: CreationType;
  // 선 만들기용
  lineMode: 'direction' | 'points';
  bearing: number;
  selectedPoints: [number, number][];
  maxRiders: number;
  radius: number;
  lineZones: LineZone[];
  // 구역 만들기용
  zones: Zone[];
}

// Legacy 타입 (호환성 유지)
export type LineCreationStep = CreationStep;
export type LineCreationConfig = CreationConfig;

export type SidebarTab = 'create' | 'lines';
