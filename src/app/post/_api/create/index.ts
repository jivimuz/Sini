import { apiRequest } from "../../../api/client";
import { UserStatus } from "@/types/userStatus.type";
import { CategoryKey } from "@/constants/categories";

export interface CreatePostRequest {
    caption: string;
    title?: string | null;
    category: CategoryKey;
    latitude: number;
    longitude: number;
    isLive?: boolean;
    /** 1-1440; defaults to 480 (8 jam) server-side if omitted. */
    liveDurationMinutes?: number;
    isSelling?: boolean;
    price?: number | null;
    aspectRatio?: [number, number];
    locationName?: string;
    imageUrls?: string[];
    /** Independent of `isLive` above -- governs the Post screen's own "Aktif"/"Riwayat" split. */
    postType: 'one_time' | 'repeat';
    /** Required when `postType` is `one_time`, an id from `GET /post-durations`. */
    postDurationId?: string;
    /** Required when `postType` is `repeat` -- one entry per enabled day. */
    schedule?: { dayOfWeek: number; startTime: string; endTime: string }[];
}

export const createPost = (payload: CreatePostRequest | FormData) => {
    return apiRequest<UserStatus, CreatePostRequest | FormData>({
        path: "/posts",
        method: "POST",
        body: payload,
    });
};