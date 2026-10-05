import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const BIOMETRIC_ENABLED_KEY = 'sini.biometric-enabled';

export type BiometricCapability = 'unsupported' | 'not-enrolled' | 'available';

/**
 * Whether the user has opted into "login with biometrics" from the Security screen.
 * This is separate from device capability -- a capable device can still have it off.
 */
export const biometricPreference = {
    isEnabled: async (): Promise<boolean> => {
        return (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === '1';
    },
    setEnabled: async (enabled: boolean): Promise<void> => {
        if (enabled) {
            await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, '1');
        } else {
            await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
        }
    },
};

export const biometricAuth = {
    /**
     * Whether this device can even offer biometric login at all -- checked before showing
     * the toggle as usable, since enabling a preference the device can't honor would just
     * lock the user out at the next app start.
     */
    getCapability: async (): Promise<BiometricCapability> => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) return 'unsupported';

        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) return 'not-enrolled';

        return 'available';
    },

    authenticate: (promptMessage: string): Promise<LocalAuthentication.LocalAuthenticationResult> => {
        return LocalAuthentication.authenticateAsync({
            promptMessage,
            cancelLabel: 'Batal',
            disableDeviceFallback: false,
        });
    },
};
