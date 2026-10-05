import { apiRequest } from "../../../api/client";

export interface TypingRequest {
    conversationId: string;
    receiverId: string;
    isTyping: boolean;
}

export interface TypingResponse {
    success: boolean;
}

export const sendTypingStatus = (payload: TypingRequest) => {
    return apiRequest<TypingResponse, TypingRequest>({
        path: "/chat/typing",
        method: "POST",
        body: payload,
    });
};