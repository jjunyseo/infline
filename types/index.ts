export interface Line {
  id: string;
  creatorId: string;
  createdAt: string;
  expiresAt: string;
  geometry: GeoJSON.LineString;
  color: string;
  name?: string;
  
  // 선 설정
  maxRiders: number;           // 최대 탑승 인원
  riderCount: number;          // 현재 탑승 인원
  
  // 원의 정보
  center: [number, number];    // 원의 중심점 [lng, lat]
  radius: number;              // 원의 반경 (km)
  
  // 구역 설정 (선택적)
  zones: LineZone[];
}

export interface LineZone {
  id: string;
  center: [number, number];    // 구역 중심점 [lng, lat]
  radius: number;              // 반경 (km, 최대 5km)
}

export interface UserLocation {
  lat: number;
  lon: number;
}

export interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

// 선 생성 모드
export type LineCreationMode = 
  | 'idle'           // 대기
  | 'direction'      // 방향 선택 모드
  | 'points'         // 2점 선택 모드
  | 'configuring'    // 설정 중
  | 'zone-select';   // 구역 설정 중

// 선 생성 설정
export interface LineCreationConfig {
  mode: 'direction' | 'points';
  
  // 방향 모드용
  bearing?: number;
  
  // 2점 모드용
  selectedPoints: [number, number][];  // 최대 2개
  
  // 공통 설정
  maxRiders: number;
  zones: LineZone[];
  
  // 원 설정 (3점으로 계산되거나 사용자 지정)
  customRadius?: number;  // km (선택적)
}

// 사이드바 탭
export type SidebarTab = 'create' | 'lines' | 'settings';
