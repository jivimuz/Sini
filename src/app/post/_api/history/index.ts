import { apiRequest } from "../../../api/client";
import { UserStatus } from "@/types/userStatus.type";
import { PaginationQuery } from "../../../api/types";

export interface HistoryQuery extends PaginationQuery {
    userId?: string;
}

export const getPostHistory = (query: HistoryQuery = {}) => {
    return apiRequest<UserStatus[]>({
        path: "/posts/history",
        method: "GET",
        query,
    });
};