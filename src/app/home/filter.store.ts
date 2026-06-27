import { create } from 'zustand';
import { ALL_CATEGORIES, CategoryKey, LiveFilterStatus } from '@/constants/categories';

interface FilterState {
    visibleCategories: CategoryKey[];
    liveFilterStatus: LiveFilterStatus;
    filterRadius: number; // in meters
    setFilters: (
        categories: CategoryKey[],
        liveStatus: LiveFilterStatus,
        radius: number
    ) => void;
    resetFilters: () => void;
}

const INITIAL_RADIUS = 5000; // Default to 5km

export const useFilterStore = create<FilterState>((set) => ({
    visibleCategories: ALL_CATEGORIES,
    liveFilterStatus: 'all',
    filterRadius: INITIAL_RADIUS,
    setFilters: (categories, liveStatus, radius) => set({
        visibleCategories: categories,
        liveFilterStatus: liveStatus,
        filterRadius: radius,
    }),
    resetFilters: () => set({
        visibleCategories: ALL_CATEGORIES,
        liveFilterStatus: 'all',
        filterRadius: INITIAL_RADIUS,
    }),
}));