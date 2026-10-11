import { apiRequest, tokenStorage } from "../../../api/client";

export interface ChangePasswordRequest {
    currentPassword: string;
    password: string;
    password_confirmation: string;
    refreshToken?: string;
}

export interface ChangePasswordResponse {
    message: string;
}

export const changePassword = (payload: ChangePasswordRequest) => {
    return apiRequest<ChangePasswordResponse, ChangePasswordRequest>({
        path: "/auth/change-password",
        method: "POST",
        // A thunk, not a plain object: if this request's access token happens to be expired,
        // client.ts's 401 interceptor refreshes it (rotating the refresh token server-side) and
        // retries this same request. Reading `tokenStorage.getRefresh()` up front would bake the
        // now-stale, pre-rotation refresh token into the retried body, causing the backend to
        // spare a dead token and revoke the device's actually-current one instead, forcing a
        // re-login. The thunk is re-invoked on the retry too, so it always sends the calling
        // device's own CURRENT refresh token so the backend can spare it from the
        // revoke-all-other-sessions sweep -- without this the device would be logged out the
        // moment its access token next expires, even though it's the one that just changed the
        // password. See API_CONTRACT.md's `/auth/change-password` section.
        body: async () => ({
            ...payload,
            refreshToken: payload.refreshToken ?? (await tokenStorage.getRefresh()) ?? undefined,
        }),
    });
};
