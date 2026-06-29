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
    aspect_ratio: [number, number]; // Rasio aspek dari gambar status, misalnya [9, 16] untuk rasio 9:16
    statusImageUrl: ImageSourcePropType;
    title: string | null;
    caption: string;
    location_name?: string;
    is_liked: boolean;
    is_selling: boolean;
    price: number | null;
    currency_symbol: string | 'Rp';
    like_count: number;
}