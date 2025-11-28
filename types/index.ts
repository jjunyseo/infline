export interface Line {
  id: string;
  creatorId: string;
  createdAt: string;
  expiresAt: string;
  geometry: GeoJSON.LineString;
  color: string;
  name?: string;
  
  // 선 설정
  maxRiders: number;
  riderCount: number;
  
  // 원의 정보
  center: [number, number];
  radius: number; // km
  bearing: number; // 방향각
  
  // 구역 설정
  zones: LineZone[];
}

export interface LineZone {
  id: string;
  center: [number, number];
  radius: number; // km, 최대 5km
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
  id: string;
  center: [number, number];
  name: string;
}

// 선 생성 단계
export type LineCreationStep = 
  | 'idle'           // 대기 (아무것도 안함)
  | 'select-mode'    // 모드 선택 (방향/위치)
  | 'select-direction' // 방향 선택 중
  | 'select-points'    // 2점 선택 중
  | 'customize'        // 선 커스터마이징 (반경, 구역 조절)
  | 'add-zone'         // 구역 추가 중

// 선 생성 설정
export interface LineCreationConfig {
  mode: 'direction' | 'points';
  
  // 방향 모드용
  bearing: number;
  
  // 2점 모드용
  selectedPoints: [number, number][];
  
  // 공통 설정
  maxRiders: number;
  radius: number; // km (기본값: 지구 둘레 절반)
  zones: LineZone[];
  
  // 프리뷰 선 geometry
  previewGeometry: GeoJSON.LineString | null;
  previewCenter: [number, number] | null;
}

export type SidebarTab = 'create' | 'lines' | 'settings';
