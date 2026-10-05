import { apiRequest } from "../../../api/client";
import { Coordinates } from "../../../api/types";

export interface CurrentLocationRequest extends Coordinates {
    accuracy?: number;
}

export interface CurrentLocationResponse {
    city?: string;
    country?: string;
    formattedAddress?: string;
    latitude: number;
    longitude: number;
    [key: string]: unknown;
}

export const getCurrentLocationData = (payload: CurrentLocationRequest) => {
    return apiRequest<CurrentLocationResponse, CurrentLocationRequest>({
        path: "/location/current",
        method: "POST",
        body: payload,
    });
};