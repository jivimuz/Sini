import { apiRequest } from "../../../api/client";
import { HelpdeskTicket } from "../list";

export interface CreateTicketRequest {
    title: string;
    description: string;
}

/** Creates a new ticket with `status: "Open"` and a server-generated `no_ticket`. */
export const createTicket = (payload: CreateTicketRequest) => {
    return apiRequest<HelpdeskTicket, CreateTicketRequest>({
        path: "/helpdesk",
        method: "POST",
        body: payload,
    });
};
