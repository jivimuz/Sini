import { apiRequest } from "../../../api/client";

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    username: string;
    phone?: string;
}

// Registration no longer returns a session -- the backend sends a 6-digit verification code to
// the given email instead, and the account is only promoted to a full session once that code is
// confirmed via /auth/verify-email.
export interface RegisterResponse {
    message: string;
    email: string;
}

export const register = (payload: RegisterRequest) => {
    return apiRequest<RegisterResponse, RegisterRequest>({
        path: "/auth/register",
        method: "POST",
        body: payload,
    });
};