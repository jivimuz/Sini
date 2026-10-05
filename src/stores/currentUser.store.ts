import { create } from 'zustand';
import { getMe, ProfileResponse } from '@/app/profile/api/me';

interface CurrentUserState {
    customer: ProfileResponse | null;
    isLoading: boolean;
    /** Fetches once and caches; safe to call repeatedly (e.g. from every screen that needs it). */
    ensureLoaded: () => Promise<ProfileResponse | null>;
    clear: () => void;
}

export const useCurrentUser = create<CurrentUserState>((set, get) => ({
    customer: null,
    isLoading: false,

    ensureLoaded: async () => {
        const { customer, isLoading } = get();
        if (customer) return customer;
        if (isLoading) return null;

        set({ isLoading: true });

        try {
            const data = await getMe();
            set({ customer: data, isLoading: false });
            return data;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    clear: () => set({ customer: null }),
}));
