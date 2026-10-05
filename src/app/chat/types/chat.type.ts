// UI-facing message shape consumed by the presentational components (MessageBubble,
// LocationBubble, DateSeparator). Raw API rows (see ../api/messages.ts: ApiChatMessage) are
// mapped into this shape in chat.store.ts -- components never see the backend's field names.
export interface ChatMessage {
    id: string;
    senderId: string;
    receiverId: string;
    type: "text" | "location" | "date";
    text?: string;
    label?: string; // Untuk tipe 'date'
    createdAt: string;
    /** Raw ISO timestamp, kept alongside the formatted `createdAt` display string so day
     * boundaries can be computed for date separators (absent on synthetic "date" rows). */
    createdAtIso?: string;
    seen: boolean;
    location?: {
        latitude: number;
        longitude: number;
        title: string;
        distance?: string;
    };
}
