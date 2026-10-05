import { apiRequest } from "../../../api/client";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthUser {
    id?: string;
    name?: string;
    email?: string;
    username?: string;
    avatarUrl?: string;
    [key: string]: unknown;
}

export interface AuthSession {
    accessToken: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
    user?: AuthUser;
}

export const login = (payload: LoginRequest) => {
    return apiRequest<AuthSession, LoginRequest>({
        path: "/auth/login",
        method: "POST",
        body: payload,
    });
};