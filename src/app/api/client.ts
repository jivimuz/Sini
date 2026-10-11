import * as SecureStore from "expo-secure-store";
import { ApiError, ApiErrorPayload, ApiRequestOptions } from "./types";
import { refreshToken as refreshTokenRequest } from "../auth/api/refresh-token";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
const ACCESS_TOKEN_KEY = "sini.access-token";
const REFRESH_TOKEN_KEY = "sini.refresh-token";

// Public/unauthenticated auth endpoints never carry a meaningful access token, so a 401 from
// them is a real credential/validation failure (e.g. wrong password), not an expired access
// token -- never route these through the refresh-and-retry flow, or a bad login would be
// masked by a confusing "session expired" error.
const AUTH_EXEMPT_PATHS = new Set([
    "/auth/login",
    "/auth/register",
    "/auth/refresh-token",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-email",
    "/auth/resend-verification-code",
]);

const isAuthExemptPath = (path: string) => AUTH_EXEMPT_PATHS.has(path.startsWith("/") ? path : `/${path}`);

// Tracks which multipart bodies already had `_method` appended, so retrying the same request
// object after a token refresh doesn't append it a second time.
const spoofedMultipartBodies = new WeakSet<FormData>();

const normalizeBaseUrl = (value: string) => {
    const trimmedValue = value.trim().replace(/\/+$/, "");

    if (!trimmedValue || /^https?:\/\//i.test(trimmedValue)) {
        return trimmedValue;
    }

    return `http://${trimmedValue}`;
};

const buildUrl = (path: string, query?: ApiRequestOptions["query"]) => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const queryString = new URLSearchParams();

    if (query) {
        Object.entries(query).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                // PHP only groups repeated query keys into an array when the key itself ends
                // in `[]` (e.g. `categories[]=a&categories[]=b`) -- without it, each repeat
                // just overwrites the last one, so Laravel sees a single string and rejects
                // an `array` validation rule. Matches API_CONTRACT.md's documented `categories[]=`.
                value.forEach((item) => {
                    if (item !== null && item !== undefined) {
                        queryString.append(`${key}[]`, String(item));
                    }
                });
                return;
            }

            if (value !== null && value !== undefined) {
                queryString.append(key, String(value));
            }
        });
    }

    const baseUrl = normalizeBaseUrl(API_BASE_URL);
    const url = baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
    const qs = queryString.toString();

    return qs ? `${url}?${qs}` : url;
};

const isPlainJsonBody = (body: unknown) => {
    if (body === null || body === undefined) return false;
    if (body instanceof FormData) return false;
    if (body instanceof Blob) return false;
    if (body instanceof URLSearchParams) return false;
    if (body instanceof ArrayBuffer) return false;
    return typeof body === "object" || typeof body === "string" || typeof body === "number" || typeof body === "boolean";
};

const parseResponse = async <T>(response: Response): Promise<T> => {
    if (response.status === 204) {
        return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        return (await response.json()) as T;
    }

    return (await response.text()) as T;
};

const extractErrorMessage = async (response: Response) => {
    try {
        const payload = await parseResponse<Partial<ApiErrorPayload> | string>(response);

        if (typeof payload === "string") {
            return { message: payload, details: undefined };
        }

        return {
            message: payload.message ?? `Request failed with status ${response.status}`,
            details: payload.details ?? payload,
        };
    } catch {
        return {
            message: `Request failed with status ${response.status}`,
            details: undefined,
        };
    }
};

export const tokenStorage = {
    get: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    set: (token: string) => SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
    getRefresh: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    setRefresh: (token: string) => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token),
    setSession: async (session: { accessToken: string; refreshToken?: string }) => {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken);
        if (session.refreshToken) {
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken);
        }
    },
    clear: async () => {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    },
};

// Performs a single HTTP attempt with no retry/refresh behavior. `accessTokenOverride` lets the
// post-refresh retry use the freshly issued access token instead of re-reading SecureStore.
const performFetch = async <T, TBody = unknown>(options: ApiRequestOptions<TBody>, accessTokenOverride?: string): Promise<T> => {
    const accessToken = accessTokenOverride ?? (await tokenStorage.get());
    const method = options.method ?? "GET";

    // Resolve a thunk body fresh on every call -- `apiRequest`'s 401 retry re-invokes
    // `performFetch` with this same `options` object, so a thunk (unlike a plain object
    // captured once up front) picks up whatever the just-completed token refresh wrote to
    // storage instead of resending a value captured before the refresh.
    const body = typeof options.body === "function" ? await (options.body as () => TBody | Promise<TBody>)() : options.body;

    // PHP only populates $_FILES for POST requests, so a multipart body sent as PUT/PATCH/DELETE
    // never reaches Laravel's file validation (the field looks "missing" even though it was sent).
    // Spoof it the same way Laravel's own HTML forms do: send POST and let `_method` carry the verb.
    const isMultipart = body instanceof FormData;
    const spoofMethod = isMultipart && method !== "GET" && method !== "POST";

    if (spoofMethod && body instanceof FormData && !spoofedMultipartBodies.has(body)) {
        body.append("_method", method);
        spoofedMultipartBodies.add(body);
    }

    const response = await fetch(buildUrl(options.path, options.query), {
        method: spoofMethod ? "POST" : method,
        headers: {
            Accept: "application/json",
            ...(isPlainJsonBody(body) ? { "Content-Type": "application/json" } : {}),
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(options.headers ?? {}),
        },
        body:
            body === null || body === undefined
                ? undefined
                : body instanceof FormData || body instanceof Blob || body instanceof URLSearchParams || body instanceof ArrayBuffer
                    ? body
                    : isPlainJsonBody(body)
                        ? JSON.stringify(body)
                        : undefined,
        signal: options.signal,
    });

    if (!response.ok) {
        const error = await extractErrorMessage(response);
        const retryAfterHeader = response.headers.get("Retry-After");
        const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
        throw new ApiError(error.message, response.status, error.details, Number.isFinite(retryAfter) ? retryAfter : undefined);
    }

    return parseResponse<T>(response);
};

/** In-flight refresh call shared by every concurrent 401, so only one refresh request ever fires. */
let refreshPromise: Promise<string> | null = null;

const clearSessionAndFail = async (): Promise<never> => {
    await tokenStorage.clear();
    throw new ApiError("Your session has expired. Please log in again.", 401);
};

const performTokenRefresh = async (): Promise<string> => {
    const storedRefreshToken = await tokenStorage.getRefresh();

    if (!storedRefreshToken) {
        return clearSessionAndFail();
    }

    try {
        const session = await refreshTokenRequest({ refreshToken: storedRefreshToken });
        await tokenStorage.setSession(session);
        return session.accessToken;
    } catch (error) {
        // Per API_CONTRACT.md, the session is dropped only when the refresh call itself comes
        // back 401 -- that specifically means the refresh token is expired/revoked/orphaned, so
        // there is no valid session left to retry with. A network error, a 429 (the refresh
        // endpoint is throttled server-side), or a 5xx is a transient failure, not proof the
        // session is invalid -- rethrow as-is so the caller sees a normal retryable error
        // instead of being logged out while the backend/network hiccups.
        if (error instanceof ApiError && error.status === 401) {
            return clearSessionAndFail();
        }

        throw error;
    }
};

// Several screens can fetch in parallel and hit a 401 at the same moment (e.g. feed, profile,
// and notifications all firing on app foreground). Without this single-flight guard each would
// start its own refresh call, racing the backend's refresh-token rotation and invalidating one
// another. Every concurrent caller awaits the same in-flight promise instead, and retries with
// whatever access token it resolves to.
const getRefreshedAccessToken = (): Promise<string> => {
    if (!refreshPromise) {
        refreshPromise = performTokenRefresh().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
};

export async function apiRequest<T, TBody = unknown>(options: ApiRequestOptions<TBody>): Promise<T> {
    try {
        return await performFetch<T, TBody>(options);
    } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401 || isAuthExemptPath(options.path)) {
            throw error;
        }

        // getRefreshedAccessToken rejects with a session-expired ApiError only when the refresh
        // token is missing or the refresh call itself came back 401 (invalid/revoked/orphaned).
        // For any other refresh failure (network error, 429, 5xx) it rejects with that original
        // error instead, leaving the session intact -- both cases propagate here unchanged,
        // through the same error path callers already handle.
        const newAccessToken = await getRefreshedAccessToken();

        // Retry exactly once, going straight through performFetch rather than back through
        // apiRequest -- if this retry also comes back 401, it surfaces as a genuine auth
        // failure instead of triggering another refresh and looping.
        return performFetch<T, TBody>(options, newAccessToken);
    }
}