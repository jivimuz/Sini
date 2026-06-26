import React from "react";

import * as GeoJSON from 'geojson';
import {
    GeoJSONSource,
    Layer,
} from "@maplibre/maplibre-react-native";

type Coordinate = [number, number];

interface Props {
    coordinates: Coordinate[];
}

export default function RouteLine({
    coordinates,
}: Props) {
    if (coordinates.length < 2) {
        return null;
    }

    const route: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: {
            type: "LineString",
            coordinates,
        },
    };

    return (
        <GeoJSONSource
            id="route-source"
            data={route}

        >
            <Layer
                id="route-line"
                type="line"
                style={{
                    lineColor: "#FFD84D",
                    lineWidth: 6,
                    lineCap: "round",
                    lineJoin: "round",
                }}
            />
        </GeoJSONSource>
    );
}