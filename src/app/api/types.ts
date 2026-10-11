export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiQueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions<TBody = unknown> {
    path: string;
    method?: ApiMethod;
    query?: object;
    /**
     * A plain body value, or a thunk that resolves one. `client.ts`'s `apiRequest` retries a
     * 401 by re-invoking `performFetch` with the SAME `options` object once a token refresh has
     * completed -- a plain object body captured before the first attempt would still hold
     * whatever was true before the refresh (e.g. a now-rotated refresh token). Pass a thunk for
     * any field that must reflect storage/state as of actual send time; it is invoked once per
     * attempt (initial and retry alike).
     */
    body?: TBody | (() => TBody | Promise<TBody>);
    headers?: HeadersInit;
    signal?: AbortSignal;
}

export interface ApiErrorPayload {
    message?: string;
    status?: number;
    details?: unknown;
}

export class ApiError extends Error {
    status: number;
    details?: unknown;
    /** Seconds the caller should wait before retrying, from the response's `Retry-After` header (status 429). */
    retryAfter?: number;

    constructor(message: string, status: number, details?: unknown, retryAfter?: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
        this.retryAfter = retryAfter;
    }
}

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}