import { create } from "zustand";

interface ViewersStore {
    viewersPostId: string | null;
    openViewers: (postId: string) => void;
    closeViewers: () => void;
}

// Sama seperti status.store.ts -- disimpan di store global (bukan state lokal di dalam
// PostScreen) supaya ViewersBottomSheet bisa dipasang di root _layout.tsx, SETELAH
// FloatingNavbar dalam urutan sibling, sehingga kelihatan DI ATAS navbar yang mengambang
// (bukan ketutupan navbar seperti waktu sheet-nya dipasang di dalam PostScreen sendiri).
export const useViewersStore = create<ViewersStore>((set) => ({
    viewersPostId: null,
    openViewers: (postId) => set({ viewersPostId: postId }),
    closeViewers: () => set({ viewersPostId: null }),
}));
