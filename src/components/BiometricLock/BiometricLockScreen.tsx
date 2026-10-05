import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/stores/auth.store';

/**
 * Shown instead of the app when a session is restored from storage but the user has
 * biometric login turned on -- the stored token is not trusted until Face ID/Touch ID
 * (or device passcode fallback) succeeds.
 */
export default function BiometricLockScreen() {
    const { unlockWithBiometrics, logout } = useAuth();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [wasDenied, setWasDenied] = useState(false);

    const attemptUnlock = useCallback(async () => {
        setIsAuthenticating(true);
        setWasDenied(false);

        const success = await unlockWithBiometrics();

        if (!success) {
            setWasDenied(true);
        }

        setIsAuthenticating(false);
    }, [unlockWithBiometrics]);

    // Langsung minta Face ID/Touch ID begitu layar ini muncul, supaya pengguna tidak
    // perlu menyentuh apa pun dulu pada kondisi normal.
    useEffect(() => {
        attemptUnlock();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center px-8">
            <Image source={require('@/../assets/images/Sini-icon.png')} className="w-20 h-20" resizeMode="contain" />
            <Text className="text-2xl font-extrabold text-black tracking-tight mt-4">Sini</Text>

            <View className="w-20 h-20 rounded-full bg-amber-50 items-center justify-center mt-10 mb-6">
                <Ionicons name="finger-print" size={40} color="#F6C431" />
            </View>

            <Text className="text-base font-semibold text-neutral-800 text-center">
                {isAuthenticating ? 'Memverifikasi...' : wasDenied ? 'Verifikasi gagal' : 'Terkunci'}
            </Text>
            <Text className="text-sm text-neutral-400 text-center mt-1 mb-8">
                {wasDenied
                    ? 'Coba lagi, atau masuk dengan password.'
                    : 'Gunakan Face ID / Touch ID untuk melanjutkan.'}
            </Text>

            {isAuthenticating ? (
                <ActivityIndicator color="#F6C431" />
            ) : (
                <>
                    <TouchableOpacity
                        onPress={attemptUnlock}
                        className="bg-amber-400 h-14 w-full rounded-2xl flex-row items-center justify-center shadow-lg shadow-amber-400/30 mb-4"
                        activeOpacity={0.8}
                    >
                        <Ionicons name="finger-print" size={18} color="#171717" className="mr-2" />
                        <Text className="text-neutral-900 font-bold text-base tracking-wide">Coba Lagi</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => logout()}>
                        <Text className="text-sm font-semibold text-amber-600">Masuk dengan password</Text>
                    </TouchableOpacity>
                </>
            )}
        </SafeAreaView>
    );
}
