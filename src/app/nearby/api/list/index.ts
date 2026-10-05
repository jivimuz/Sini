import { apiRequest } from "../../../api/client";
import { Coordinates, PaginationQuery } from "../../../api/types";
import { UserStatus } from "@/types/userStatus.type";
import { CategoryKey, LiveFilterStatus } from "@/constants/categories";

export interface NearbyQuery extends Coordinates, PaginationQuery {
    radius?: number;
    categories?: CategoryKey[];
    liveStatus?: LiveFilterStatus;
}

export const getNearbyList = (query: NearbyQuery) => {
    return apiRequest<UserStatus[]>({
        path: "/nearby",
        method: "GET",
        query,
    });
};