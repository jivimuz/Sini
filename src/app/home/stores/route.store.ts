import { create } from "zustand";
import { RouteState } from "../types/route";



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