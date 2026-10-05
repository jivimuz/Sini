import { apiRequest } from "../../../api/client";

export interface ChangePasswordRequest {
    currentPassword: string;
    password: string;
    password_confirmation: string;
}

export interface ChangePasswordResponse {
    message: string;
}

export const changePassword = (payload: ChangePasswordRequest) => {
    return apiRequest<ChangePasswordResponse, ChangePasswordRequest>({
        path: "/auth/change-password",
        method: "POST",
        body: payload,
    });
};
