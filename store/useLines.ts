import { create } from 'zustand';
import { Line, UserLocation, LineCreationMode } from '@/types';

interface LinesState {
  lines: Line[];
  userLocation: UserLocation | null;
  creationMode: LineCreationMode;
  previewBearing: number;

  // Actions
  addLine: (line: Line) => void;
  removeLine: (id: string) => void;
  setUserLocation: (location: UserLocation) => void;
  setCreationMode: (mode: LineCreationMode) => void;
  setPreviewBearing: (bearing: number) => void;
}

export const useLines = create<LinesState>((set) => ({
  lines: [],
  userLocation: null,
  creationMode: 'idle',
  previewBearing: 0,

  addLine: (line) =>
    set((state) => ({ lines: [...state.lines, line] })),

  removeLine: (id) =>
    set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),

  setUserLocation: (location) =>
    set({ userLocation: location }),

  setCreationMode: (mode) =>
    set({ creationMode: mode }),

  setPreviewBearing: (bearing) =>
    set({ previewBearing: bearing }),
}));

