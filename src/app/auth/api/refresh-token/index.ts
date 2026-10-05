import { apiRequest } from "../../../api/client";
import { AuthSession } from "../login";

export interface RefreshTokenRequest {
    refreshToken: string;
}

export const refreshToken = (payload: RefreshTokenRequest) => {
    return apiRequest<AuthSession, RefreshTokenRequest>({
        path: "/auth/refresh-token",
        method: "POST",
        body: payload,
    });
};