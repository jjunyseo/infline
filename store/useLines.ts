import { create } from 'zustand';
import { Line, UserLocation, LineCreationStep, LineCreationConfig, LineZone, SearchPin } from '@/types';

// 반경 범위: 대원(20037.5km) ~ 반바퀴 원(50km)
const EARTH_HALF_CIRCUMFERENCE = 20037.5;
const MIN_RADIUS = 50; // 최소 반경

interface LinesState {
  lines: Line[];
  userLocation: UserLocation | null;
  searchPin: SearchPin | null;
  creationStep: LineCreationStep;
  creationConfig: LineCreationConfig;
  previewGeometry: GeoJSON.LineString | null;
  previewCenter: [number, number] | null;
  shrinkDirection: 'left' | 'right' | null;
  
  addLine: (line: Line) => void;
  removeLine: (id: string) => void;
  setUserLocation: (location: UserLocation) => void;
  setSearchPin: (pin: SearchPin | null) => void;
  setCreationStep: (step: LineCreationStep) => void;
  goBack: () => void;
  setCreationMode: (mode: 'direction' | 'points') => void;
  setBearing: (bearing: number) => void;
  setRadius: (radius: number) => void;
  setShrinkDirection: (direction: 'left' | 'right' | null) => void;
  addSelectedPoint: (point: [number, number]) => void;
  removeSelectedPoint: (index: number) => void;
  clearSelectedPoints: () => void;
  setMaxRiders: (count: number) => void;
  setPreviewGeometry: (geometry: GeoJSON.LineString | null, center: [number, number] | null) => void;
  addZone: (zone: LineZone) => void;
  removeZone: (id: string) => void;
  updateZone: (id: string, updates: Partial<LineZone>) => void;
  clearZones: () => void;
  resetCreation: () => void;
  startCreation: () => void;
}

const initialCreationConfig: LineCreationConfig = {
  mode: 'direction',
  bearing: 0,
  selectedPoints: [],
  maxRiders: 10,
  radius: EARTH_HALF_CIRCUMFERENCE,
  zones: [],
};

export const useLines = create<LinesState>((set, get) => ({
  lines: [],
  userLocation: null,
  searchPin: null,
  creationStep: 'select-mode',
  creationConfig: initialCreationConfig,
  previewGeometry: null,
  previewCenter: null,
  shrinkDirection: null,

  addLine: (line) =>
    set((state) => ({ lines: [...state.lines, line] })),

  removeLine: (id) =>
    set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),

  setUserLocation: (location) =>
    set({ userLocation: location }),

  setSearchPin: (pin) =>
    set({ searchPin: pin }),

  setCreationStep: (step) =>
    set({ creationStep: step }),

  goBack: () => {
    const { creationStep, creationConfig } = get();
    switch (creationStep) {
      case 'select-direction':
      case 'select-points':
        set({ 
          creationStep: 'select-mode',
          creationConfig: { ...initialCreationConfig },
          previewGeometry: null,
          previewCenter: null,
          shrinkDirection: null,
        });
        break;
      case 'customize':
        set({ 
          creationStep: creationConfig.mode === 'direction' ? 'select-direction' : 'select-points',
          shrinkDirection: null,
          creationConfig: { ...get().creationConfig, radius: EARTH_HALF_CIRCUMFERENCE },
        });
        break;
      case 'add-zone':
        set({ creationStep: 'customize' });
        break;
      default:
        set({ creationStep: 'select-mode' });
    }
  },

  setCreationMode: (mode) =>
    set((state) => ({
      creationConfig: { ...state.creationConfig, mode },
    })),

  setBearing: (bearing) =>
    set((state) => ({
      creationConfig: { ...state.creationConfig, bearing },
    })),

  setRadius: (radius) =>
    set((state) => ({
      creationConfig: { 
        ...state.creationConfig, 
        radius: Math.max(MIN_RADIUS, Math.min(radius, EARTH_HALF_CIRCUMFERENCE)) 
      },
    })),

  setShrinkDirection: (direction) =>
    set({ shrinkDirection: direction }),

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

  addZone: (zone) =>
    set((state) => ({
      creationConfig: {
        ...state.creationConfig,
        zones: [...state.creationConfig.zones, zone],
      },
    })),

  removeZone: (id) =>
    set((state) => ({
      creationConfig: {
        ...state.creationConfig,
        zones: state.creationConfig.zones.filter((z) => z.id !== id),
      },
    })),

  updateZone: (id, updates) =>
    set((state) => ({
      creationConfig: {
        ...state.creationConfig,
        zones: state.creationConfig.zones.map((z) =>
          z.id === id ? { ...z, ...updates } : z
        ),
      },
    })),

  clearZones: () =>
    set((state) => ({
      creationConfig: { ...state.creationConfig, zones: [] },
    })),

  resetCreation: () =>
    set({
      creationStep: 'select-mode',
      creationConfig: initialCreationConfig,
      previewGeometry: null,
      previewCenter: null,
      shrinkDirection: null,
    }),

  startCreation: () =>
    set({
      creationStep: 'select-mode',
      creationConfig: initialCreationConfig,
      previewGeometry: null,
      previewCenter: null,
      shrinkDirection: null,
    }),
}));
