import { DummyMarker } from "../stores/marker.store";

export interface ClusterItem<T extends DummyMarker = DummyMarker> {
    id: string;
    latitude: number;
    longitude: number;
    members: T[];
}

// Generic over T so callers passing a richer type (e.g. UserStatus, which structurally
// satisfies DummyMarker) get that full type back out of non-cluster items, instead of
// every member being narrowed down to just DummyMarker's fields.
export type MapItem<T extends DummyMarker = DummyMarker> = T | ClusterItem<T>;

function getClusterRadius(zoom: number) {
    if (zoom >= 19) return 12;
    if (zoom >= 18) return 15;
    if (zoom >= 17) return 25;
    if (zoom >= 16) return 40;
    if (zoom >= 15) return 70;
    if (zoom >= 14) return 120;
    if (zoom >= 13) return 200;
    if (zoom >= 12) return 350;
    if (zoom >= 11) return 750;
    if (zoom >= 10) return 1500;
    if (zoom >= 9) return 3000;

    return 10000; // Default radius for zoom levels below 5
}

function getDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) {
    const R = 6371000;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function clusterMarkers<T extends DummyMarker>(
    markers: T[],
    zoom: number
): MapItem<T>[] {

    const radius = getClusterRadius(zoom);

    const visited = new Set<string>();

    const result: MapItem<T>[] = [];

    for (const marker of markers) {

        if (visited.has(marker.id))
            continue;

        const queue: T[] = [marker];

        const cluster: T[] = [];

        visited.add(marker.id);

        while (queue.length > 0) {

            const current = queue.shift()!;

            cluster.push(current);

            for (const candidate of markers) {

                if (visited.has(candidate.id))
                    continue;

                const distance = getDistance(
                    current.latitude,
                    current.longitude,
                    candidate.latitude,
                    candidate.longitude
                );

                if (distance <= radius) {

                    visited.add(candidate.id);

                    queue.push(candidate);

                }

            }

        }

        if (cluster.length === 1) {

            result.push(cluster[0]);

            continue;

        }

        const latitude =
            cluster.reduce((a, b) => a + b.latitude, 0) /
            cluster.length;

        const longitude =
            cluster.reduce((a, b) => a + b.longitude, 0) /
            cluster.length;

        result.push({
            id: `cluster-${cluster.map(x => x.id).join("-")}`,
            latitude,
            longitude,
            members: cluster,
        });

    }

    return result;
}