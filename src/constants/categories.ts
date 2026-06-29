import { Ionicons } from "@expo/vector-icons";


export const CATEGORIES = [
    { key: 'chill', name: "Chill", color: '#E57373', icon: 'people-outline' as const },
    { key: 'selling', name: "Selling", color: '#B19CD9', icon: 'home-outline' as const },
    { key: 'work', name: "Work", color: '#F39C12', icon: 'briefcase-outline' as const },
];

export type CategoryKey = typeof CATEGORIES[number]['key'];
export type LiveFilterStatus = 'all' | 'live' | 'regular';

export const ALL_CATEGORIES = CATEGORIES.map(category => category.key);