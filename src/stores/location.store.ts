import { create } from "zustand";

interface LocationState {
    latitude: number | null;
    longitude: number | null;

    hasPermission: boolean;
    currentCity: string | null;
    currentCountry: string | null;

    setLocation: (
        latitude: number,
        longitude: number
    ) => void;
    setCurrentCity: (city: string) => void;
    setCurrentCountry: (country: string) => void;
    setPermission: (
        status: boolean
    ) => void;
}

export const useLocationStore =
    create<LocationState>((set) => ({
        latitude: null,
        longitude: null,

        hasPermission: false,
        currentCity: null,
        currentCountry: null,

        setLocation: (
            latitude,
            longitude
        ) =>
            set({
                latitude,
                longitude,
            }),
        setCurrentCity: (city) =>
            set({
                currentCity: city,
            }),
        setCurrentCountry: (country) =>
            set({
                currentCountry: country,
            }),

        setPermission: (status) =>
            set({
                hasPermission: status,
            }),
    }));