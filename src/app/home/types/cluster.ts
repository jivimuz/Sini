import { DummyMarker } from "../../../stores/marker.store";

export type MarkerCluster = {
    id: string;
    latitude: number;
    longitude: number;
    members: DummyMarker[];
};

export type MapMarkerItem =
    | DummyMarker
    | MarkerCluster;