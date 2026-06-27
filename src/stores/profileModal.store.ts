import { create } from 'zustand';

interface ProfileModalState {
    selectedUserId: string | null;
    openProfile: (userId: string) => void;
    closeProfile: () => void;
}

export const useProfileModalStore = create<ProfileModalState>((set) => ({
    selectedUserId: null,
    openProfile: (userId) => set({ selectedUserId: userId }),
    closeProfile: () => set({ selectedUserId: null }),
}));