import { create } from 'zustand';
import { Line, UserLocation, LineCreationMode, LineCreationConfig, LineZone } from '@/types';

interface LinesState {
  // 선 데이터
  lines: Line[];
  
  // 사용자 위치
  userLocation: UserLocation | null;
  
  // 선 생성 상태
  creationMode: LineCreationMode;
  creationConfig: LineCreationConfig;
  previewBearing: number;
  
  // 사이드바 상태
  isSidebarOpen: boolean;
  
  // Actions - 선 관리
  addLine: (line: Line) => void;
  removeLine: (id: string) => void;
  
  // Actions - 사용자 위치
  setUserLocation: (location: UserLocation) => void;
  
  // Actions - 선 생성
  setCreationMode: (mode: LineCreationMode) => void;
  setPreviewBearing: (bearing: number) => void;
  
  // Actions - 선 생성 설정
  setCreationConfigMode: (mode: 'direction' | 'points') => void;
  addSelectedPoint: (point: [number, number]) => void;
  removeSelectedPoint: (index: number) => void;
  clearSelectedPoints: () => void;
  setMaxRiders: (count: number) => void;
  setCustomRadius: (radius: number | undefined) => void;
  
  // Actions - 구역 설정
  addZone: (zone: LineZone) => void;
  removeZone: (id: string) => void;
  updateZone: (id: string, updates: Partial<LineZone>) => void;
  clearZones: () => void;
  
  // Actions - 사이드바
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Actions - 리셋
  resetCreation: () => void;
}

const initialCreationConfig: LineCreationConfig = {
  mode: 'direction',
  selectedPoints: [],
  maxRiders: 10,
  zones: [],
};

export const useLines = create<LinesState>((set) => ({
  lines: [],
  userLocation: null,
  creationMode: 'idle',
  creationConfig: initialCreationConfig,
  previewBearing: 0,
  isSidebarOpen: false,

  // 선 관리
  addLine: (line) =>
    set((state) => ({ lines: [...state.lines, line] })),

  removeLine: (id) =>
    set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),

  // 사용자 위치
  setUserLocation: (location) =>
    set({ userLocation: location }),

  // 선 생성 모드
  setCreationMode: (mode) =>
    set({ creationMode: mode }),

  setPreviewBearing: (bearing) =>
    set({ previewBearing: bearing }),

  // 선 생성 설정
  setCreationConfigMode: (mode) =>
    set((state) => ({
      creationConfig: { ...state.creationConfig, mode },
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

  setCustomRadius: (radius) =>
    set((state) => ({
      creationConfig: { ...state.creationConfig, customRadius: radius },
    })),

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

  // 사이드바
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (open) =>
    set({ isSidebarOpen: open }),

  // 리셋
  resetCreation: () =>
    set({
      creationMode: 'idle',
      creationConfig: initialCreationConfig,
      previewBearing: 0,
    }),
}));
