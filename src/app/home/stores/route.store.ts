import { create } from "zustand";

export interface RoutePoint {
    latitude: number;
    longitude: number;
}

interface RouteState {
    isRouteMode: boolean;
    destination: RoutePoint | null;
    routeCoordinates: [number, number][];

    startRoute: (
        destination: RoutePoint,
        coordinates: [number, number][]
    ) => void;

    exitRoute: () => void;
}

export const useRouteStore = create<RouteState>((set) => ({
    isRouteMode: false,

    destination: null,

    routeCoordinates: [],

    startRoute: (destination, coordinates) =>
        set({
            isRouteMode: true,
            destination,
            routeCoordinates: coordinates,
        }),

    exitRoute: () =>
        set({
            isRouteMode: false,
            destination: null,
            routeCoordinates: [],
        }),
}));