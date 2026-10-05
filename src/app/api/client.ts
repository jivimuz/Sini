import * as SecureStore from "expo-secure-store";
import { ApiError, ApiErrorPayload, ApiRequestOptions } from "./types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
const ACCESS_TOKEN_KEY = "sini.access-token";
const REFRESH_TOKEN_KEY = "sini.refresh-token";

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

export async function apiRequest<T, TBody = unknown>(options: ApiRequestOptions<TBody>): Promise<T> {
    const accessToken = await tokenStorage.get();
    const method = options.method ?? "GET";

    // PHP only populates $_FILES for POST requests, so a multipart body sent as PUT/PATCH/DELETE
    // never reaches Laravel's file validation (the field looks "missing" even though it was sent).
    // Spoof it the same way Laravel's own HTML forms do: send POST and let `_method` carry the verb.
    const isMultipart = options.body instanceof FormData;
    const spoofMethod = isMultipart && method !== "GET" && method !== "POST";

    if (spoofMethod && options.body instanceof FormData) {
        options.body.append("_method", method);
    }

    const response = await fetch(buildUrl(options.path, options.query), {
        method: spoofMethod ? "POST" : method,
        headers: {
            Accept: "application/json",
            ...(isPlainJsonBody(options.body) ? { "Content-Type": "application/json" } : {}),
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(options.headers ?? {}),
        },
        body:
            options.body === null || options.body === undefined
                ? undefined
                : options.body instanceof FormData || options.body instanceof Blob || options.body instanceof URLSearchParams || options.body instanceof ArrayBuffer
                    ? options.body
                    : isPlainJsonBody(options.body)
                        ? JSON.stringify(options.body)
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
}