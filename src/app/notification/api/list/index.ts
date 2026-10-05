import { apiRequest } from "../../../api/client";
import { PaginationQuery } from "../../../api/types";

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    type?: string;
    [key: string]: unknown;
}

export const getNotifications = (query: PaginationQuery = {}) => {
    return apiRequest<NotificationItem[]>({
        path: "/notifications",
        method: "GET",
        query,
    });
};