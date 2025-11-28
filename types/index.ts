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

export type LineCreationStep = 
  | 'select-mode'
  | 'select-direction'
  | 'select-points'
  | 'customize'
  | 'add-zone';

export interface LineCreationConfig {
  mode: 'direction' | 'points';
  bearing: number;
  selectedPoints: [number, number][];
  maxRiders: number;
  radius: number;
  zones: LineZone[];
}

export type SidebarTab = 'create' | 'lines';
