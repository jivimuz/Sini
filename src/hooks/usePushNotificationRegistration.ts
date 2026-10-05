import { useEffect } from 'react';
import { useAuth } from '@/stores/auth.store';
import {
    configureForegroundNotificationHandler,
    notificationPreference,
    registerDeviceForPush,
} from '@/utils/pushNotifications';

/**
 * Registers this device's FCM/APNs token with the backend once the customer is logged in,
 * so admin broadcasts (see Sini-Backend's /admin/broadcast) can actually reach this device.
 *
 * Skips registration entirely if the user turned notifications off in Settings. Silently
 * does nothing if permission is denied or the native push module isn't fully wired up yet
 * (e.g. Android without `google-services.json`) -- the rest of the app does not depend on
 * push notifications working.
 */
export const usePushNotificationRegistration = () => {
    const { isLoggedIn } = useAuth();

    useEffect(() => {
        configureForegroundNotificationHandler();
    }, []);

    useEffect(() => {
        if (!isLoggedIn) return;

        let isMounted = true;

        (async () => {
            const enabled = await notificationPreference.isEnabled();
            if (!enabled || !isMounted) return;

            try {
                await registerDeviceForPush();
            } catch (error) {
                console.warn('[Push] Gagal mendaftarkan device token ke server:', error);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [isLoggedIn]);
};
