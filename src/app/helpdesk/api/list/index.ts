import { apiRequest } from "../../../api/client";

/**
 * Different response shape from Help Center's topics: the backend uses an INTEGER `id` and
 * snake_case fields here, not the string-id/camelCase convention Help Center uses.
 */
export interface HelpdeskTicket {
    id: number;
    no_ticket: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
}

/** Returns the authenticated customer's own tickets, newest first, as a plain array. */
export const listMyTickets = () => {
    return apiRequest<HelpdeskTicket[]>({
        path: "/helpdesk",
        method: "GET",
    });
};
