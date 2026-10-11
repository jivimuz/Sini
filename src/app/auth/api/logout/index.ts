import { apiRequest, tokenStorage } from "../../../api/client";

export interface LogoutRequest {
    refreshToken?: string;
}

export interface LogoutResponse {
    success: boolean;
    message?: string;
}

export const logout = (payload: LogoutRequest = {}) => {
    return apiRequest<LogoutResponse, LogoutRequest>({
        path: "/auth/logout",
        method: "POST",
        // A thunk, not a plain object -- same reasoning as change-password's body: if this
        // request's access token happens to be expired, client.ts's 401 interceptor refreshes it
        // (rotating the refresh token server-side) and retries this same request. Reading
        // `tokenStorage.getRefresh()` up front (or baking an explicit refreshToken captured
        // before the call into a plain object) would resend the now-stale, pre-rotation refresh
        // token on the retry, so the backend revokes an already-dead token and leaves the
        // device's actually-current refresh token live for up to 30 days. The thunk is
        // re-invoked on the retry too, so it always defaults to the device's CURRENT stored
        // refresh token unless the caller explicitly passed one.
        body: async () => ({
            ...payload,
            refreshToken: payload.refreshToken ?? (await tokenStorage.getRefresh()) ?? undefined,
        }),
    });
};