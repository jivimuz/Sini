import { apiRequest } from "../../../api/client";

export interface ResendVerificationCodeRequest {
    email: string;
}

export interface ResendVerificationCodeResponse {
    message: string;
}

export const resendVerificationCode = (payload: ResendVerificationCodeRequest) => {
    return apiRequest<ResendVerificationCodeResponse, ResendVerificationCodeRequest>({
        path: "/auth/resend-verification-code",
        method: "POST",
        body: payload,
    });
};
