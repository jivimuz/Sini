import { CategoryKey } from "@/constants/categories";
import { ImageSourcePropType } from "react-native";

export interface UserStatus {
    id: string;
    name: string;
    avatarUrl: string;
    latitude: number;
    longitude: number;
    category: CategoryKey;
    color: string;
    is_live: boolean;
    created_at: string; // ISO string untuk waktu posting status
    statusImageUrl: ImageSourcePropType;
    caption: string;
    location_name?: string;
    is_liked: boolean;
    like_count: number;
}