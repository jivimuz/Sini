import { create } from 'zustand';
import { router } from 'expo-router'; // Perbaiki impor ke 'expo-router'

interface AuthState {
    isLoggedIn: boolean;
    login: () => void;
    logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
    isLoggedIn: false,
    login: () => {
        set({ isLoggedIn: true });
        // Redirect ke halaman utama / dashboard setelah login
        router.replace('/home' as any);
    },
    logout: () => {
        set({ isLoggedIn: false });
        // Redirect ke halaman login setelah logout
        router.replace('/auth/login' as any);
    },
}));
