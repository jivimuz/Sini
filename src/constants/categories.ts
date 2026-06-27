import { Ionicons } from "@expo/vector-icons";

export const CATEGORY_DATA = {
    one: { color: '#3498db', icon: 'people-outline' as const },
    two: { color: '#2ecc71', icon: 'home-outline' as const },
    three: { color: '#e67e22', icon: 'briefcase-outline' as const },
} as const;

export const CATEGORIES = {
    one: { name: "Event", ...CATEGORY_DATA.one },
    two: { name: "Selling", ...CATEGORY_DATA.two },
    three: { name: "Work", ...CATEGORY_DATA.three },
};

export type CategoryKey = keyof typeof CATEGORY_DATA;
export type LiveFilterStatus = 'all' | 'live' | 'regular';

export const ALL_CATEGORIES = Object.keys(CATEGORY_DATA) as CategoryKey[];