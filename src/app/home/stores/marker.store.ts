import { create } from "zustand";

export interface DummyMarker {
    id: string;
    latitude: number;
    longitude: number;
    avatarUrl: string;
    name: string;
    category: string;
    color: string;
}

interface MarkerStoreState {
    markers: DummyMarker[];
    setMarkers: (markers: DummyMarker[]) => void;
}

export const useMarkerStore = create<MarkerStoreState>((set) => ({
    markers: [],
    setMarkers: (markers) => set({ markers }),
}));