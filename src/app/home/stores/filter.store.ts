import { create } from 'zustand';
import { ALL_CATEGORIES, CategoryKey, LiveFilterStatus } from '@/constants/categories';
import { FilterState } from '../types/filter';


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