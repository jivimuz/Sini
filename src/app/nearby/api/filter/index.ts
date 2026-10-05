import { CategoryKey, LiveFilterStatus } from "@/constants/categories";
import { Coordinates } from "../../../api/types";

export interface NearbyFilterPayload extends Coordinates {
    radius: number;
    categories: CategoryKey[];
    liveStatus: LiveFilterStatus;
}

export const buildNearbyFilterPayload = (payload: NearbyFilterPayload) => ({
    latitude: payload.latitude,
    longitude: payload.longitude,
    radius: payload.radius,
    categories: payload.categories,
    liveStatus: payload.liveStatus,
});