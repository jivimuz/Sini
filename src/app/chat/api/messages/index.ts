import { apiRequest } from "../../../api/client";

export interface ApiChatSender {
    id: number;
    name: string;
    username?: string;
    avatarUrl?: string | null;
    [key: string]: unknown;
}

/** Raw `Message` row shape as the backend actually returns it (see API_CONTRACT.md). */
export interface ApiChatMessage {
    id: number;
    conversation_id: number;
    sender_id: number;
    receiver_id: number;
    text: string | null;
    type: "text" | "location";
    latitude: number | null;
    longitude: number | null;
    location_title: string | null;
    distance: string | null;
    read_at: string | null;
    created_at: string;
    updated_at: string;
    sender?: ApiChatSender;
}

export interface GetMessagesQuery {
    conversationId: string;
    /** Cursor: return the page before this message id, for loading older history. */
    beforeId?: number;
    /** Default 50, max 100 (enforced server-side). */
    limit?: number;
}

export interface SendMessageRequest {
    conversationId: string;
    receiverId: string;
    text: string;
}

export const getMessages = ({ conversationId, beforeId, limit }: GetMessagesQuery) => {
    return apiRequest<ApiChatMessage[]>({
        path: "/chat/messages",
        method: "GET",
        query: { conversationId, beforeId, limit },
    });
};

export const sendMessage = (payload: SendMessageRequest) => {
    return apiRequest<ApiChatMessage, SendMessageRequest>({
        path: "/chat/messages",
        method: "POST",
        body: payload,
    });
};
