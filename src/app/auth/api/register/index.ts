import { apiRequest } from "../../../api/client";
import { AuthSession } from "../login";

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    username: string;
    phone?: string;
}

export const register = (payload: RegisterRequest) => {
    return apiRequest<AuthSession, RegisterRequest>({
        path: "/auth/register",
        method: "POST",
        body: payload,
    });
};