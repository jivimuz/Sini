import { apiRequest } from "../../../api/client";

export interface MarkNotificationReadRequest {
    notificationId: string;
}

export interface MarkNotificationReadResponse {
    success: boolean;
}

export const markNotificationRead = (payload: MarkNotificationReadRequest) => {
    return apiRequest<MarkNotificationReadResponse, MarkNotificationReadRequest>({
        path: "/notifications/read",
        method: "POST",
        body: payload,
    });
};