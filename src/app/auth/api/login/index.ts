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

// Shape of the JSON body on a 403 response when the account's email isn't verified yet.
// `client.ts`'s `extractErrorMessage` falls back to the whole error payload for `ApiError.details`
// when the backend doesn't nest it under a `details` key, so callers read this off `error.details`.
export interface LoginVerificationRequiredPayload {
    message: string;
    email: string;
    requiresVerification: true;
}

export const login = (payload: LoginRequest) => {
    return apiRequest<AuthSession, LoginRequest>({
        path: "/auth/login",
        method: "POST",
        body: payload,
    });
};