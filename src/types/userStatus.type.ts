import { CategoryKey } from "@/constants/categories";
import { ImageSourcePropType } from "react-native";

export interface UserStatus {
    id: string;
    /** The post owner's customer id -- needed to start a chat with them (a post id is not a customer id). */
    customerId: string;
    name: string;
    avatarUrl: string;
    latitude: number;
    longitude: number;
    category: CategoryKey;
    color: string;
    is_live: boolean;
    /** ISO timestamp the live window ends; null/undefined if this post was never live. */
    liveUntil?: string | null;
    /** Seconds left while live, as of when the server responded; null once expired. */
    liveSecondsRemaining?: number | null;
    created_at: string; // ISO string untuk waktu posting status
    aspect_ratio: [number, number]; // Rasio aspek dari gambar status, misalnya [9, 16] untuk rasio 9:16
    statusImageUrls: ImageSourcePropType[]; // Array URL gambar status
    title: string | null;
    caption: string;
    location_name?: string;
    is_liked: boolean;
    is_selling: boolean;
    price: number | null;
    currency_symbol: string;
    like_count: number;
    viewCount?: number;

    /** Independent of `is_live`/`liveUntil` -- governs the Post screen's own "Aktif"/"Riwayat" split. */
    postType?: 'one_time' | 'repeat';
    /** Computed server-side: for `one_time`, whether `durationMinutes`' window hasn't elapsed; for `repeat`, whether now falls inside today's scheduled window. */
    isActive?: boolean;
    /** `one_time` only -- the chosen preset's minutes, from `GET /post-durations`. */
    durationMinutes?: number | null;
    /** `one_time` only, during creation -- the chosen `PostDuration` id before submit. */
    postDurationId?: string;
    /** `repeat` only -- one entry per enabled day; `dayOfWeek` is ISO (1=Senin..7=Minggu). */
    schedule?: { dayOfWeek: number; startTime: string; endTime: string }[];
}