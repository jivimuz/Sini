import { CategoryKey, LiveFilterStatus } from "@/constants/categories";

export interface FilterState {
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
