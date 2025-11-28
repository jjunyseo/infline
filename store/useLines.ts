import { create } from 'zustand';
import { Line, UserLocation, LineCreationStep, LineCreationConfig, LineZone, SearchPin } from '@/types';

interface LinesState {
  // 선 데이터
  lines: Line[];
  
  // 사용자 위치
  userLocation: UserLocation | null;
  
  // 검색 핀
  searchPin: SearchPin | null;
  
  // 선 생성 상태
  creationStep: LineCreationStep;
  creationConfig: LineCreationConfig;
  
  // 프리뷰 (별도 관리 - 무한 루프 방지)
  previewGeometry: GeoJSON.LineString | null;
  previewCenter: [number, number] | null;
  
  // Actions - 선 관리
  addLine: (line: Line) => void;
  removeLine: (id: string) => void;
  
  // Actions - 사용자 위치
  setUserLocation: (location: UserLocation) => void;
  
  // Actions - 검색 핀
  setSearchPin: (pin: SearchPin | null) => void;
  
  // Actions - 선 생성 단계
  setCreationStep: (step: LineCreationStep) => void;
  goBack: () => void;
  
  // Actions - 선 생성 설정
  setCreationMode: (mode: 'direction' | 'points') => void;
  setBearing: (bearing: number) => void;
  setRadius: (radius: number) => void;
  addSelectedPoint: (point: [number, number]) => void;
  removeSelectedPoint: (index: number) => void;
  clearSelectedPoints: () => void;
  setMaxRiders: (count: number) => void;
  
  // Actions - 프리뷰 (별도)
  setPreviewGeometry: (geometry: GeoJSON.LineString | null, center: [number, number] | null) => void;
  
  // Actions - 구역 설정
  addZone: (zone: LineZone) => void;
  removeZone: (id: string) => void;
  updateZone: (id: string, updates: Partial<LineZone>) => void;
  clearZones: () => void;
  
  // Actions - 리셋
  resetCreation: () => void;
  startCreation: () => void;
}

const EARTH_HALF_CIRCUMFERENCE = 20037.5; // km

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

  // 선 관리
  addLine: (line) =>
    set((state) => ({ lines: [...state.lines, line] })),

  removeLine: (id) =>
    set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),

  // 사용자 위치
  setUserLocation: (location) =>
    set({ userLocation: location }),

  // 검색 핀
  setSearchPin: (pin) =>
    set({ searchPin: pin }),

  // 선 생성 단계
  setCreationStep: (step) =>
    set({ creationStep: step }),

  goBack: () => {
    const { creationStep } = get();
    switch (creationStep) {
      case 'select-direction':
      case 'select-points':
        set({ 
          creationStep: 'select-mode',
          creationConfig: { ...initialCreationConfig },
          previewGeometry: null,
          previewCenter: null,
        });
        break;
      case 'customize':
        const mode = get().creationConfig.mode;
        set({ 
          creationStep: mode === 'direction' ? 'select-direction' : 'select-points'
        });
        break;
      case 'add-zone':
        set({ creationStep: 'customize' });
        break;
      default:
        set({ creationStep: 'select-mode' });
    }
  },

  // 선 생성 설정
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
      creationConfig: { ...state.creationConfig, radius: Math.max(100, Math.min(radius, EARTH_HALF_CIRCUMFERENCE)) },
    })),

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

  // 프리뷰 (별도 상태로 관리)
  setPreviewGeometry: (geometry, center) =>
    set({ previewGeometry: geometry, previewCenter: center }),

  // 구역 설정
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

  // 리셋
  resetCreation: () =>
    set({
      creationStep: 'select-mode',
      creationConfig: initialCreationConfig,
      previewGeometry: null,
      previewCenter: null,
    }),

  startCreation: () =>
    set({
      creationStep: 'select-mode',
      creationConfig: initialCreationConfig,
      previewGeometry: null,
      previewCenter: null,
    }),
}));
