import { apiRequest } from "../../../api/client";

export interface ChatConversationSummary {
    id: string;
    otherCustomerId: string | null;
    name: string;
    avatarUrl?: string | null;
    lastMessage?: string | null;
    unreadCount: number;
    isOnline: boolean;
    lastMessageAt?: string | null;
}

export const getConversations = () => {
    return apiRequest<ChatConversationSummary[]>({
        path: "/chat/conversations",
        method: "GET",
    });
};

/**
 * Finds the existing 1:1 conversation with this customer, or creates one. This is the only
 * way to obtain a conversationId before the first message -- there is no other lookup.
 */
export const startConversation = (customerId: string) => {
    return apiRequest<ChatConversationSummary, { customerId: string }>({
        path: "/chat/conversations",
        method: "POST",
        body: { customerId },
    });
};
