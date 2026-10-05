import { create } from "zustand";
import { getNotifications, NotificationItem } from "../api/list";
import { markNotificationRead } from "../api/read";
import { useIsNewNotif } from "@/app/home/stores/notification.store";

// Dipegang di store (bukan state lokal di screen list) supaya halaman detail (push
// terpisah, lihat screens/detail/[id].tsx) bisa membaca item yang sama tanpa fetch ulang --
// sama seperti pola conversations/messagesByConversation di chat.store.ts.
interface NotificationListState {
    items: NotificationItem[];
    isLoading: boolean;
    loadNotifications: () => Promise<void>;
    markRead: (id: string) => Promise<void>;
}

export const useNotificationListStore = create<NotificationListState>((set, get) => ({
    items: [],
    isLoading: false,

    loadNotifications: async () => {
        set({ isLoading: true });
        try {
            const data = await getNotifications();
            set({ items: data, isLoading: false });
            // Sinkronkan dot merah di bell icon Home dengan data asli -- sebelumnya
            // `setIsNewNotif` tidak pernah dipanggil sama sekali di mana pun.
            useIsNewNotif.getState().setIsNewNotif(data.some((item) => !item.isRead));
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    markRead: async (id) => {
        set((state) => ({
            items: state.items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
        }));
        useIsNewNotif.getState().setIsNewNotif(get().items.some((item) => !item.isRead));

        try {
            await markNotificationRead({ notificationId: id });
        } catch {
            // Best-effort, mirip markRead di chat.store.ts -- state lokal sudah mencerminkan
            // "read"; percobaan reload list berikutnya akan menyelaraskan ulang kalau gagal.
        }
    },
}));
