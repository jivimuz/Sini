import { create } from "zustand";
import { ChatMessage, ChatStore } from "../types/chat.type";



export const useChatStore = create<ChatStore>((set) => ({
    typing: false,

    messages: [
        {
            id: "1",
            senderId: "1",
            receiverId: "2",
            type: "text",
            text: "Lagi dimana?",
            createdAt: "09:21",
            seen: true,
        },
        {
            id: "2",
            senderId: "2",
            receiverId: "1",
            type: "text",
            text: "Di Senayan 👀",
            createdAt: "09:22",
            seen: true,
        },
        {
            id: "3",
            senderId: "2",
            receiverId: "1",
            type: "location",
            location: {
                latitude: -6.225,
                longitude: 106.809,
                title: "Senayan City",
                distance: "120 m",
            },
            createdAt: "09:23",
            seen: true,
        },
        {
            id: "4",
            senderId: "2",
            receiverId: "1",
            type: "text",
            text: "Lagi ngopi ☕",
            createdAt: "09:23",
            seen: true,
        },
    ],

    addMessage: (message) =>
        set((state) => ({
            messages: [...state.messages, message],
        })),

    sendMessage: (text) =>
        set((state) => ({
            messages: [
                ...state.messages,
                {
                    id: Date.now().toString(),
                    senderId: "1",
                    receiverId: "2",
                    type: "text",
                    text,
                    createdAt: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    seen: false,
                },
            ],
        })),

    sendLocation: () =>
        set((state) => ({
            messages: [
                ...state.messages,
                {
                    id: Date.now().toString(),
                    senderId: "1",
                    receiverId: "2",
                    type: "location",
                    location: {
                        latitude: -6.2,
                        longitude: 106.8,
                        title: "Lokasi Saya",
                        distance: "0 m",
                    },
                    createdAt: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    seen: false,
                },
            ],
        })),

    markSeen: (id) =>
        set((state) => ({
            messages: state.messages.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        seen: true,
                    }
                    : item
            ),
        })),

    setTyping: (typing) =>
        set({
            typing,
        }),
}));