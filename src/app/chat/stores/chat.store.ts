import { create } from "zustand";
import { ChatMessage } from "../types/chat.type";
import {
    ChatConversationSummary,
    getConversations,
    startConversation as apiStartConversation,
} from "../api/conversations";
import { ApiChatMessage, getMessages, sendMessage as apiSendMessage } from "../api/messages";
import { sendChatLocation } from "../api/location";
import { markConversationRead } from "../api/read";
import { getEcho } from "@/hooks/echo";
import { useCurrentUser } from "@/stores/currentUser.store";

const formatTime = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const mapApiMessage = (api: ApiChatMessage): ChatMessage => ({
    id: String(api.id),
    senderId: String(api.sender_id),
    receiverId: String(api.receiver_id),
    type: api.type,
    text: api.text ?? undefined,
    createdAt: formatTime(api.created_at),
    createdAtIso: api.created_at,
    seen: !!api.read_at,
    location:
        api.type === "location" && api.latitude != null && api.longitude != null
            ? {
                latitude: api.latitude,
                longitude: api.longitude,
                title: api.location_title ?? "Lokasi",
                distance: api.distance ?? undefined,
            }
            : undefined,
});

/** Insert, or replace in place if a message with the same id already exists (idempotent). */
const upsertMessage = (list: ChatMessage[], incoming: ChatMessage): ChatMessage[] => {
    const index = list.findIndex((item) => item.id === incoming.id);
    if (index === -1) return [...list, incoming];
    const next = [...list];
    next[index] = incoming;
    return next;
};

interface ChatState {
    conversations: ChatConversationSummary[];
    isLoadingConversations: boolean;
    loadConversations: () => Promise<void>;
    startConversationWith: (customerId: string) => Promise<ChatConversationSummary>;

    messagesByConversation: Record<string, ChatMessage[]>;
    isLoadingMessages: Record<string, boolean>;
    loadMessages: (conversationId: string) => Promise<void>;

    typingByConversation: Record<string, boolean>;

    /** Which conversation's room screen is currently focused -- its unread count is not bumped locally. */
    activeConversationId: string | null;
    setActiveConversation: (conversationId: string | null) => void;

    sendMessage: (conversationId: string, receiverId: string, text: string) => Promise<void>;
    sendLocation: (
        conversationId: string,
        receiverId: string,
        coords: { latitude: number; longitude: number },
        title: string,
        distance?: string
    ) => Promise<void>;

    markRead: (conversationId: string) => Promise<void>;

    /** Subscribes to every known conversation's channel; safe to call repeatedly (diffs internally). */
    ensureRealtimeSubscriptions: () => void;
    teardownRealtimeSubscriptions: () => void;
}

const subscribedConversationIds = new Set<string>();

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    isLoadingConversations: false,
    messagesByConversation: {},
    isLoadingMessages: {},
    typingByConversation: {},
    activeConversationId: null,

    setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),

    loadConversations: async () => {
        set({ isLoadingConversations: true });
        try {
            const data = await getConversations();
            set({ conversations: data, isLoadingConversations: false });
            get().ensureRealtimeSubscriptions();
        } catch (error) {
            set({ isLoadingConversations: false });
            throw error;
        }
    },

    startConversationWith: async (customerId) => {
        const conversation = await apiStartConversation(customerId);
        set((state) => {
            const exists = state.conversations.some((c) => c.id === conversation.id);
            return {
                conversations: exists
                    ? state.conversations.map((c) => (c.id === conversation.id ? conversation : c))
                    : [conversation, ...state.conversations],
            };
        });
        get().ensureRealtimeSubscriptions();
        return conversation;
    },

    loadMessages: async (conversationId) => {
        set((state) => ({ isLoadingMessages: { ...state.isLoadingMessages, [conversationId]: true } }));
        try {
            const data = await getMessages({ conversationId });
            set((state) => ({
                messagesByConversation: { ...state.messagesByConversation, [conversationId]: data.map(mapApiMessage) },
                isLoadingMessages: { ...state.isLoadingMessages, [conversationId]: false },
            }));
        } catch (error) {
            set((state) => ({ isLoadingMessages: { ...state.isLoadingMessages, [conversationId]: false } }));
            throw error;
        }
    },

    sendMessage: async (conversationId, receiverId, text) => {
        const currentUserId = useCurrentUser.getState().customer?.id ?? "";
        const tempId = `temp-${Date.now()}`;
        const nowIso = new Date().toISOString();
        const optimistic: ChatMessage = {
            id: tempId,
            senderId: currentUserId,
            receiverId,
            type: "text",
            text,
            createdAt: formatTime(nowIso),
            createdAtIso: nowIso,
            seen: false,
        };

        set((state) => ({
            messagesByConversation: {
                ...state.messagesByConversation,
                [conversationId]: [...(state.messagesByConversation[conversationId] ?? []), optimistic],
            },
        }));

        try {
            const apiMessage = await apiSendMessage({ conversationId, receiverId, text });
            const real = mapApiMessage(apiMessage);
            set((state) => ({
                messagesByConversation: {
                    ...state.messagesByConversation,
                    [conversationId]: upsertMessage(
                        (state.messagesByConversation[conversationId] ?? []).filter((m) => m.id !== tempId),
                        real
                    ),
                },
                conversations: state.conversations.map((c) =>
                    c.id === conversationId ? { ...c, lastMessage: text, lastMessageAt: apiMessage.created_at } : c
                ),
            }));
        } catch (error) {
            set((state) => ({
                messagesByConversation: {
                    ...state.messagesByConversation,
                    [conversationId]: (state.messagesByConversation[conversationId] ?? []).filter((m) => m.id !== tempId),
                },
            }));
            throw error;
        }
    },

    sendLocation: async (conversationId, receiverId, coords, title, distance) => {
        const apiMessage = await sendChatLocation({
            conversationId,
            receiverId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            title,
            distance,
        });
        const real = mapApiMessage(apiMessage);
        set((state) => ({
            messagesByConversation: {
                ...state.messagesByConversation,
                [conversationId]: upsertMessage(state.messagesByConversation[conversationId] ?? [], real),
            },
            conversations: state.conversations.map((c) =>
                c.id === conversationId ? { ...c, lastMessage: title, lastMessageAt: apiMessage.created_at } : c
            ),
        }));
    },

    markRead: async (conversationId) => {
        const myId = useCurrentUser.getState().customer?.id;
        set((state) => ({
            conversations: state.conversations.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
            messagesByConversation: {
                ...state.messagesByConversation,
                // Only messages the OTHER party sent become "seen" -- this reflects what *I*
                // just read. Messages I sent myself track whether THEY read them, which this
                // action has no signal for and must not overwrite.
                [conversationId]: (state.messagesByConversation[conversationId] ?? []).map((m) =>
                    m.senderId !== String(myId) ? { ...m, seen: true } : m
                ),
            },
        }));
        try {
            await markConversationRead(conversationId);
        } catch {
            // Best-effort -- local state already reflects "read"; a retry on next open will reconcile.
        }
    },

    ensureRealtimeSubscriptions: () => {
        const echo = getEcho();

        for (const conversation of get().conversations) {
            if (subscribedConversationIds.has(conversation.id)) continue;
            subscribedConversationIds.add(conversation.id);

            const channel = echo.private(`conversation.${conversation.id}`);

            channel.listen(".message.sent", (payload: { message: ApiChatMessage }) => {
                const incoming = mapApiMessage(payload.message);
                const conversationId = String(payload.message.conversation_id);
                const isMine = String(payload.message.sender_id) === String(useCurrentUser.getState().customer?.id);
                const isActive = get().activeConversationId === conversationId;

                set((state) => ({
                    messagesByConversation: {
                        ...state.messagesByConversation,
                        [conversationId]: upsertMessage(state.messagesByConversation[conversationId] ?? [], incoming),
                    },
                    conversations: state.conversations.map((c) =>
                        c.id === conversationId
                            ? {
                                ...c,
                                lastMessage: payload.message.text ?? (payload.message.type === "location" ? payload.message.location_title : c.lastMessage),
                                lastMessageAt: payload.message.created_at,
                                unreadCount: !isMine && !isActive ? c.unreadCount + 1 : c.unreadCount,
                            }
                            : c
                    ),
                }));
            });

            channel.listen(".typing.updated", (payload: { conversationId: number; senderId: number; isTyping: boolean }) => {
                if (String(payload.senderId) === String(useCurrentUser.getState().customer?.id)) return;
                set((state) => ({
                    typingByConversation: { ...state.typingByConversation, [String(payload.conversationId)]: payload.isTyping },
                }));
            });
        }
    },

    teardownRealtimeSubscriptions: () => {
        if (subscribedConversationIds.size === 0) return;

        const echo = getEcho();
        for (const id of subscribedConversationIds) {
            echo.leaveChannel(`conversation.${id}`);
        }
        subscribedConversationIds.clear();
    },
}));
