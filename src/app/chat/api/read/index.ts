import { apiRequest } from "../../../api/client";

export const markConversationRead = (conversationId: string) => {
    return apiRequest<{ success: boolean }, { conversationId: string }>({
        path: "/chat/read",
        method: "POST",
        body: { conversationId },
    });
};
