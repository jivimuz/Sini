import { create } from 'zustand';
import { router } from 'expo-router'; // Perbaiki impor ke 'expo-router'
import { tokenStorage } from '@/app/api/client';
import { logout as logoutRequest } from '@/app/auth/api/logout';
import { biometricPreference, biometricAuth } from '@/utils/biometricAuth';
import { unregisterDeviceFromPush } from '@/utils/pushNotifications';
import { useChatStore } from '@/app/chat/stores/chat.store';
import { useCurrentUser } from '@/stores/currentUser.store';
import { disconnectEcho } from '@/hooks/echo';

interface AuthState {
    isLoggedIn: boolean;
    /** Startup token restore (SecureStore + biometric preference check) has finished. */
    isHydrated: boolean;
    /** A session token exists but biometric login is enabled, so it must be unlocked first. */
    needsBiometricUnlock: boolean;
    login: () => void;
    logout: () => Promise<void>;
    /** Call once at app startup, before deciding whether to show the login screen. */
    hydrate: () => Promise<void>;
    /** Prompts Face ID/Touch ID; resolves true and restores the session on success. */
    unlockWithBiometrics: () => Promise<boolean>;
}

export const useAuth = create<AuthState>((set) => ({
    isLoggedIn: false,
    isHydrated: false,
    needsBiometricUnlock: false,

    login: () => {
        set({ isLoggedIn: true, needsBiometricUnlock: false });
        // Redirect ke halaman utama / dashboard setelah login
        router.replace('/home' as any);
    },

    logout: async () => {
        const refreshToken = await tokenStorage.getRefresh();

        try {
            await logoutRequest(refreshToken ? { refreshToken } : {});
        } catch {
            // Best-effort: tetap hapus sesi lokal meski request logout ke server gagal
            // (misalnya token sudah kedaluwarsa atau tidak ada koneksi).
        }

        // Supaya device ini berhenti menerima broadcast untuk akun yang baru logout.
        await unregisterDeviceFromPush();

        await tokenStorage.clear();
        // Lepas semua subscription channel chat dan tutup koneksi websocket -- tanpa ini,
        // Echo tetap hidup mencoba re-auth dengan token yang baru saja dihapus.
        useChatStore.getState().teardownRealtimeSubscriptions();
        disconnectEcho();
        useCurrentUser.getState().clear();
        set({ isLoggedIn: false, needsBiometricUnlock: false });
        // Redirect ke halaman login setelah logout
        router.replace('/auth/login' as any);
    },

    hydrate: async () => {
        const accessToken = await tokenStorage.get();

        if (!accessToken) {
            set({ isLoggedIn: false, needsBiometricUnlock: false, isHydrated: true });
            return;
        }

        // Ada sesi tersimpan dari sebelumnya -- kalau biometrik diaktifkan di layar Keamanan,
        // jangan langsung masuk; tahan dulu di gerbang kunci sampai Face ID/Touch ID berhasil.
        const biometricEnabled = await biometricPreference.isEnabled();
        set({
            isLoggedIn: !biometricEnabled,
            needsBiometricUnlock: biometricEnabled,
            isHydrated: true,
        });
    },

    unlockWithBiometrics: async () => {
        const result = await biometricAuth.authenticate('Masuk ke Sini');

        if (result.success) {
            set({ isLoggedIn: true, needsBiometricUnlock: false });
            router.replace('/home' as any);
            return true;
        }

        return false;
    },
}));
