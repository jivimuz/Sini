import { apiRequest } from "../../../api/client";
import { Coordinates } from "../../../api/types";

export interface ReverseGeocodeResponse {
    city?: string;
    country?: string;
    formattedAddress?: string;
    latitude: number;
    longitude: number;
    [key: string]: unknown;
}

export const reverseGeocode = (payload: Coordinates) => {
    return apiRequest<ReverseGeocodeResponse, Coordinates>({
        path: "/location/reverse-geocode",
        method: "POST",
        body: payload,
    });
};