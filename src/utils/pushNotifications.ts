import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { registerDeviceToken, unregisterDeviceToken } from '@/app/notification/api/device-token';

export type DevicePlatform = 'ios' | 'android';

const REGISTERED_DEVICE_TOKEN_KEY = 'sini.registered-device-token';
const NOTIFICATIONS_ENABLED_KEY = 'sini.notifications-enabled';

/**
 * Remembers which device token was last successfully registered with the backend, so we
 * don't re-POST the same token every time the app opens, and so logout knows which token
 * to unregister.
 */
export const registeredDeviceTokenStorage = {
    get: () => SecureStore.getItemAsync(REGISTERED_DEVICE_TOKEN_KEY),
    set: (token: string) => SecureStore.setItemAsync(REGISTERED_DEVICE_TOKEN_KEY, token),
    clear: () => SecureStore.deleteItemAsync(REGISTERED_DEVICE_TOKEN_KEY),
};

/**
 * Opt-out model: notifications are on by default (matches the existing startup hook's
 * behavior) unless the user explicitly turns them off from the Settings screen.
 */
export const notificationPreference = {
    isEnabled: async (): Promise<boolean> => {
        const value = await SecureStore.getItemAsync(NOTIFICATIONS_ENABLED_KEY);
        return value !== '0';
    },
    setEnabled: (enabled: boolean): Promise<void> => {
        return SecureStore.setItemAsync(NOTIFICATIONS_ENABLED_KEY, enabled ? '1' : '0');
    },
};

/**
 * Show incoming notifications as a banner even while the app is in the foreground
 * (expo-notifications' default is to show nothing unless a handler is set).
 */
export const configureForegroundNotificationHandler = () => {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
        }),
    });
};

export const requestNotificationPermission = async (): Promise<boolean> => {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;

    const result = await Notifications.requestPermissionsAsync();
    return result.granted;
};

/**
 * The raw native FCM (Android) or APNs (iOS) token -- sent straight to our own backend,
 * which talks to Firebase Cloud Messaging directly. This is NOT an Expo push token, so no
 * Expo push service account is involved.
 *
 * Returns null if permission was never granted, the platform doesn't support it (web), or
 * the native module isn't actually wired up yet (e.g. Android without `google-services.json`
 * linked into the native project) -- callers should treat null as "not available right now"
 * rather than an error.
 */
export const getDeviceToken = async (): Promise<{ token: string; platform: DevicePlatform } | null> => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;

    try {
        const pushToken = await Notifications.getDevicePushTokenAsync();
        if (pushToken.type !== 'ios' && pushToken.type !== 'android') return null;

        return { token: String(pushToken.data), platform: pushToken.type };
    } catch (error) {
        console.warn('[Push] Gagal mengambil device token (Firebase/APNs belum siap di perangkat ini):', error);
        return null;
    }
};

/**
 * Requests permission (if needed) and registers this device's token with the backend.
 * Shared by the startup hook and the Settings screen's manual toggle, so both follow the
 * exact same rules. Returns true if the device ends up registered (including "already was").
 */
export const registerDeviceForPush = async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    const device = await getDeviceToken();
    if (!device) return false;

    const alreadyRegistered = await registeredDeviceTokenStorage.get();
    if (alreadyRegistered === device.token) return true;

    await registerDeviceToken({ token: device.token, platform: device.platform });
    await registeredDeviceTokenStorage.set(device.token);
    return true;
};

/** Unregisters this device's token from the backend (best-effort) and clears the local record. */
export const unregisterDeviceFromPush = async (): Promise<void> => {
    const token = await registeredDeviceTokenStorage.get();
    if (!token) return;

    try {
        await unregisterDeviceToken(token);
    } catch {
        // Best-effort -- the local record is cleared below regardless, so we stop trying to
        // re-register this token on next launch even if the server call failed.
    }
    await registeredDeviceTokenStorage.clear();
};
