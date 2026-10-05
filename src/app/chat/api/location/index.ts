import { apiRequest } from "../../../api/client";
import { Coordinates } from "../../../api/types";
import { ApiChatMessage } from "../messages";

export interface ChatLocationRequest extends Coordinates {
    conversationId: string;
    receiverId: string;
    title: string;
    distance?: string;
}

/** Backend returns the full created message (same shape as sendMessage), not a bare ack. */
export const sendChatLocation = (payload: ChatLocationRequest) => {
    return apiRequest<ApiChatMessage, ChatLocationRequest>({
        path: "/chat/location",
        method: "POST",
        body: payload,
    });
};
