import { apiRequest } from "../../../api/client";
import { Coordinates, PaginationQuery } from "../../../api/types";
import { UserStatus } from "@/types/userStatus.type";
import { CategoryKey, LiveFilterStatus } from "@/constants/categories";

export interface FeedQuery extends Coordinates, PaginationQuery {
    radius?: number;
    categories?: CategoryKey[];
    liveStatus?: LiveFilterStatus;
}

export const getFeed = (query: FeedQuery) => {
    return apiRequest<UserStatus[], never>({
        path: "/posts/feed",
        method: "GET",
        query,
    });
};