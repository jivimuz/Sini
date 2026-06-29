export interface RoutePoint {
    latitude: number;
    longitude: number;
}

export interface RouteState {
    isRouteMode: boolean;
    destination: RoutePoint | null;
    routeCoordinates: [number, number][];

    startRoute: (
        destination: RoutePoint,
        coordinates: [number, number][]
    ) => void;

    exitRoute: () => void;
}