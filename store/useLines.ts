import { create } from 'zustand';
import { Line, UserLocation, CreationStep, CreationConfig, LineZone, SearchPin, CreationScope, CreationType, Zone } from '@/types';
import { EARTH_HALF_CIRCUMFERENCE } from '@/lib/lineGenerator';

interface LinesState {
  lines: Line[];
  zones: Zone[]; // 독립적인 구역들
  userLocation: UserLocation | null;
  searchPin: SearchPin | null;
  creationStep: CreationStep;
  creationConfig: CreationConfig;
  previewGeometry: GeoJSON.LineString | null;
  previewCenter: [number, number] | null;
  offset: number; // -1 ~ 0 ~ +1 (0 = 대원)
  
  // Lines
  addLine: (line: Line) => void;
  removeLine: (id: string) => void;
  
  // Independent Zones
  addStandaloneZone: (zone: Zone) => void;
  removeStandaloneZone: (id: string) => void;
  updateStandaloneZone: (id: string, updates: Partial<Zone>) => void;
  
  // Location & Search
  setUserLocation: (location: UserLocation) => void;
  setSearchPin: (pin: SearchPin | null) => void;
  
  // Creation Flow
  setCreationStep: (step: CreationStep) => void;
  setScope: (scope: CreationScope) => void;
  setCreationType: (type: CreationType) => void;
  goBack: () => void;
  
  // Line Creation
  setLineMode: (mode: 'direction' | 'points') => void;
  setBearing: (bearing: number) => void;
  setOffset: (offset: number) => void;
  addSelectedPoint: (point: [number, number]) => void;
  removeSelectedPoint: (index: number) => void;
  clearSelectedPoints: () => void;
  setMaxRiders: (count: number) => void;
  setPreviewGeometry: (geometry: GeoJSON.LineString | null, center: [number, number] | null) => void;
  
  // Line Zones (구역 in line context)
  addLineZone: (zone: LineZone) => void;
  removeLineZone: (id: string) => void;
  updateLineZone: (id: string, updates: Partial<LineZone>) => void;
  clearLineZones: () => void;
  
  // Creation Zone (구역 만들기에서 사용)
  addCreationZone: (zone: Zone) => void;
  removeCreationZone: (id: string) => void;
  updateCreationZone: (id: string, updates: Partial<Zone>) => void;
  clearCreationZones: () => void;
  
  // Reset
  resetCreation: () => void;
  startCreation: () => void;
}

const initialCreationConfig: CreationConfig = {
  scope: 'globe',
  type: 'line',
  lineMode: 'direction',
  bearing: 0,
  selectedPoints: [],
  maxRiders: 10,
  radius: EARTH_HALF_CIRCUMFERENCE,
  lineZones: [],
  zones: [],
};

export const useLines = create<LinesState>((set, get) => ({
  lines: [],
  zones: [],
  userLocation: null,
  searchPin: null,
  creationStep: 'select-scope',
  creationConfig: initialCreationConfig,
  previewGeometry: null,
  previewCenter: null,
  offset: 0,

  // Lines
  addLine: (line) =>
    set((state) => ({ lines: [...state.lines, line] })),

  removeLine: (id) =>
    set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),

  // Independent Zones
  addStandaloneZone: (zone) =>
    set((state) => ({ zones: [...state.zones, zone] })),

  removeStandaloneZone: (id) =>
    set((state) => ({ zones: state.zones.filter((z) => z.id !== id) })),

  updateStandaloneZone: (id, updates) =>
    set((state) => ({
      zones: state.zones.map((z) =>
        z.id === id ? { ...z, ...updates } : z
      ),
    })),

  // Location & Search
  setUserLocation: (location) =>
    set({ userLocation: location }),

  setSearchPin: (pin) =>
    set({ searchPin: pin }),

  // Creation Flow
  setCreationStep: (step) =>
    set({ creationStep: step }),

  setScope: (scope) =>
    set((state) => ({
      creationConfig: { ...state.creationConfig, scope },
    })),

  setCreationType: (type) =>
    set((state) => ({
      creationConfig: { ...state.creationConfig, type },
    })),

  goBack: () => {
    const { creationStep, creationConfig } = get();
    switch (creationStep) {
      case 'select-type':
        set({ 
          creationStep: 'select-scope',
        });
        break;
      case 'select-mode':
        set({ 
          creationStep: 'select-type',
        });
        break;
      case 'select-direction':
      case 'select-points':
        set({ 
          creationStep: 'select-mode',
          previewGeometry: null,
          previewCenter: null,
          offset: 0,
        });
        break;
      case 'customize':
        if (creationConfig.type === 'line') {
          set({ 
            creationStep: creationConfig.lineMode === 'direction' ? 'select-direction' : 'select-points',
            offset: 0,
          });
        } else {
          set({ creationStep: 'zone-place' });
        }
        break;
      case 'add-zone':
        set({ creationStep: 'customize' });
        break;
      case 'zone-place':
        set({ creationStep: 'select-type' });
        break;
      case 'zone-customize':
        set({ creationStep: 'zone-place' });
        break;
      default:
        set({ creationStep: 'select-scope' });
    }
  },

  // Line Creation
  setLineMode: (lineMode) =>
    set((state) => ({
      creationConfig: { ...state.creationConfig, lineMode },
    })),

  setBearing: (bearing) =>
    set((state) => ({
      creationConfig: { ...state.creationConfig, bearing },
    })),

  setOffset: (offset) =>
    set({ offset: Math.max(-1, Math.min(1, offset)) }),

  addSelectedPoint: (point) =>
    set((state) => ({
      creationConfig: {
        ...state.creationConfig,
        selectedPoints: [...state.creationConfig.selectedPoints.slice(0, 1), point],
      },
    })),

  removeSelectedPoint: (index) =>
    set((state) => ({
      creationConfig: {
        ...state.creationConfig,
        selectedPoints: state.creationConfig.selectedPoints.filter((_, i) => i !== index),
      },
    })),

  clearSelectedPoints: () =>
    set((state) => ({
      creationConfig: { ...state.creationConfig, selectedPoints: [] },
    })),

  setMaxRiders: (count) =>
    set((state) => ({
      creationConfig: { ...state.creationConfig, maxRiders: count },
    })),

  setPreviewGeometry: (geometry, center) =>
    set({ previewGeometry: geometry, previewCenter: center }),

  // Line Zones
  addLineZone: (zone) =>
    set((state) => ({
      creationConfig: {
        ...state.creationConfig,
        lineZones: [...state.creationConfig.lineZones, zone],
      },
    })),

  removeLineZone: (id) =>
    set((state) => ({
      creationConfig: {
        ...state.creationConfig,
        lineZones: state.creationConfig.lineZones.filter((z) => z.id !== id),
      },
    })),

  updateLineZone: (id, updates) =>
    set((state) => ({
      creationConfig: {
        ...state.creationConfig,
        lineZones: state.creationConfig.lineZones.map((z) =>
          z.id === id ? { ...z, ...updates } : z
        ),
      },
    })),

  clearLineZones: () =>
    set((state) => ({
      creationConfig: { ...state.creationConfig, lineZones: [] },
    })),

  // Creation Zones (구역 만들기에서 사용)
  addCreationZone: (zone) =>
    set((state) => ({
      creationConfig: {
        ...state.creationConfig,
        zones: [...state.creationConfig.zones, zone],
      },
    })),

  removeCreationZone: (id) =>
    set((state) => ({
      creationConfig: {
        ...state.creationConfig,
        zones: state.creationConfig.zones.filter((z) => z.id !== id),
      },
    })),

  updateCreationZone: (id, updates) =>
    set((state) => ({
      creationConfig: {
        ...state.creationConfig,
        zones: state.creationConfig.zones.map((z) =>
          z.id === id ? { ...z, ...updates } : z
        ),
      },
    })),

  clearCreationZones: () =>
    set((state) => ({
      creationConfig: { ...state.creationConfig, zones: [] },
    })),

  // Reset
  resetCreation: () =>
    set({
      creationStep: 'select-scope',
      creationConfig: initialCreationConfig,
      previewGeometry: null,
      previewCenter: null,
      offset: 0,
    }),

  startCreation: () =>
    set({
      creationStep: 'select-scope',
      creationConfig: initialCreationConfig,
      previewGeometry: null,
      previewCenter: null,
      offset: 0,
    }),
}));

// Legacy exports for compatibility
export const useCreation = useLines;
