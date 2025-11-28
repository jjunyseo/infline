export interface Line {
  id: string;
  creatorId: string;
  createdAt: string;
  expiresAt: string;
  geometry: GeoJSON.LineString;
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
  center: [number, number]; // [lng, lat]
}

export type LineCreationMode = 'idle' | 'selecting' | 'preview';

