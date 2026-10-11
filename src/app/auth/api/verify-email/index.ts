import { apiRequest } from "../../../api/client";
import { AuthSession } from "../login";

export interface VerifyEmailRequest {
    email: string;
    code: string;
}

// Security fix: an already-verified email no longer gets a free session from this endpoint --
// it gets a plain acknowledgement with no tokens instead. Callers must narrow on
// `alreadyVerified` before treating the response as an `AuthSession`.
export interface EmailAlreadyVerifiedResponse {
    message: string;
    alreadyVerified: true;
}

export type VerifyEmailResponse = EmailAlreadyVerifiedResponse | AuthSession;

export const verifyEmail = (payload: VerifyEmailRequest) => {
    return apiRequest<VerifyEmailResponse, VerifyEmailRequest>({
        path: "/auth/verify-email",
        method: "POST",
        body: payload,
    });
};
