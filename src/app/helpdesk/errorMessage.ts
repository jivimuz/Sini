import { ApiError } from "../api/types";

/**
 * Shared by the list and create screens so a 429/5xx/network failure reads the same way in
 * both places. 401 is intentionally NOT handled here -- `client.ts` already retried it once
 * after a token refresh, so a 401 reaching the screen means the session is genuinely gone and
 * callers should log the user out instead of rendering this as a retryable error.
 */
export interface HelpdeskErrorMessages {
    rateLimitTitle: string;
    rateLimitMessage: string;
    serverErrorTitle: string;
    networkErrorTitle: string;
    networkErrorMessage: string;
}

export interface HelpdeskErrorState {
    title: string;
    message: string;
}

export const classifyHelpdeskError = (error: unknown, t: HelpdeskErrorMessages): HelpdeskErrorState => {
    if (error instanceof ApiError) {
        if (error.status === 429) {
            return { title: t.rateLimitTitle, message: t.rateLimitMessage };
        }

        // Any other ApiError (5xx, or an unexpected 4xx) -- show the server's own message so
        // it's not hidden behind one generic string.
        return { title: t.serverErrorTitle, message: error.message };
    }

    // Not an ApiError at all -- the request never got a response (offline, DNS, timeout, etc).
    return { title: t.networkErrorTitle, message: t.networkErrorMessage };
};
