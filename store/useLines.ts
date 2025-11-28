import { create } from 'zustand';
import { Line, UserLocation, LineCreationStep, LineCreationConfig, LineZone, SearchPin } from '@/types';

interface LinesState {
  lines: Line[];
  userLocation: UserLocation | null;
  searchPin: SearchPin | null;
  creationStep: LineCreationStep;
  creationConfig: LineCreationConfig;
  previewGeometry: GeoJSON.LineString | null;
  previewCenter: [number, number] | null;
  tilt: number; // -90 ~ 0 ~ 90 (0 = 대원)
  
  addLine: (line: Line) => void;
  removeLine: (id: string) => void;
  setUserLocation: (location: UserLocation) => void;
  setSearchPin: (pin: SearchPin | null) => void;
  setCreationStep: (step: LineCreationStep) => void;
  goBack: () => void;
  setCreationMode: (mode: 'direction' | 'points') => void;
  setBearing: (bearing: number) => void;
  setTilt: (tilt: number) => void;
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
  radius: 20037.5,
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
  tilt: 0, // 0 = 대원 (중앙)

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
          tilt: 0,
        });
        break;
      case 'customize':
        set({ 
          creationStep: creationConfig.mode === 'direction' ? 'select-direction' : 'select-points',
          tilt: 0,
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

  setTilt: (tilt) =>
    set({ tilt: Math.max(-90, Math.min(90, tilt)) }),

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
      tilt: 0,
    }),

  startCreation: () =>
    set({
      creationStep: 'select-mode',
      creationConfig: initialCreationConfig,
      previewGeometry: null,
      previewCenter: null,
      tilt: 0,
    }),
}));
