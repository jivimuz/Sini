// Pastikan isi file types/chat.ts Anda mendukung skema ini:
export interface ChatMessage {
    id: string;
    senderId: string;
    receiverId: string;
    type: "text" | "location" | "date";
    text?: string;
    label?: string; // Untuk tipe 'date'
    createdAt: string;
    seen: boolean;
    location?: {
        latitude: number;
        longitude: number;
        title: string;
        distance?: string;
    };
}
