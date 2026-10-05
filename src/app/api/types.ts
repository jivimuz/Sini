export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiQueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions<TBody = unknown> {
    path: string;
    method?: ApiMethod;
    query?: object;
    body?: TBody;
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