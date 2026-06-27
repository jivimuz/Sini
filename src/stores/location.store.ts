import { create } from "zustand";

interface LocationState {
    latitude: number | null;
    longitude: number | null;

    hasPermission: boolean;

    setLocation: (
        latitude: number,
        longitude: number
    ) => void;

    setPermission: (
        status: boolean
    ) => void;
}

export const useLocationStore =
    create<LocationState>((set) => ({
        latitude: null,
        longitude: null,

        hasPermission: false,

        setLocation: (
            latitude,
            longitude
        ) =>
            set({
                latitude,
                longitude,
            }),

        setPermission: (status) =>
            set({
                hasPermission: status,
            }),
    }));