import { apiRequest } from "../../../api/client";

export interface ForgotPasswordRequest {
    email: string;
}

export interface ForgotPasswordResponse {
    message: string;
}

export const forgotPassword = (payload: ForgotPasswordRequest) => {
    return apiRequest<ForgotPasswordResponse, ForgotPasswordRequest>({
        path: "/auth/forgot-password",
        method: "POST",
        body: payload,
    });
};