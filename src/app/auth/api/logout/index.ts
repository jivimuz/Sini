import { apiRequest } from "../../../api/client";

export interface LogoutRequest {
    refreshToken?: string;
}

export interface LogoutResponse {
    success: boolean;
    message?: string;
}

export const logout = (payload: LogoutRequest = {}) => {
    return apiRequest<LogoutResponse, LogoutRequest>({
        path: "/auth/logout",
        method: "POST",
        body: payload,
    });
};