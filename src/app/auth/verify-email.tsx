import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useShowNavbar } from '@/stores/showNavBar.store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLang } from '@/stores/lang.store';
import locales from './locales';
import { LanguageSwitch } from '@/components/Lang/SwitchLangButton';
import { useAuth } from '../../stores/auth.store';
import { verifyEmail as verifyEmailRequest } from './api/verify-email';
import { resendVerificationCode } from './api/resend-verification-code';
import { tokenStorage } from '../api/client';
import { ApiError } from '../api/types';

export default function VerifyEmailScreen() {
    const { setNavbar } = useShowNavbar();
    const router = useRouter();
    const { lang } = useLang();
    const t = locales[lang].verifyEmail;

    // register.tsx navigates here with `params: { email }` -- Expo Router can hand back a
    // string or a string[] depending on how the route was entered, so normalize it.
    const params = useLocalSearchParams<{ email?: string | string[] }>();
    const email = Array.isArray(params.email) ? params.email[0] ?? '' : params.email ?? '';

    const { login: setLoggedIn } = useAuth();
    const [code, setCode] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [retryAfter, setRetryAfter] = useState(0);
    const [resendRetryAfter, setResendRetryAfter] = useState(0);

    useEffect(() => {
        setNavbar(false);
    }, []);

    useEffect(() => {
        if (retryAfter <= 0) return;

        const timer = setInterval(() => {
            setRetryAfter((current) => (current <= 1 ? 0 : current - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [retryAfter > 0]);

    useEffect(() => {
        if (resendRetryAfter <= 0) return;

        const timer = setInterval(() => {
            setResendRetryAfter((current) => (current <= 1 ? 0 : current - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [resendRetryAfter > 0]);

    const handleVerify = async () => {
        if (retryAfter > 0) return;

        setErrorMessage('');
        setInfoMessage('');

        if (!code.trim()) {
            setErrorMessage('Kode verifikasi wajib diisi.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await verifyEmailRequest({ email, code: code.trim() });

            if ('alreadyVerified' in response) {
                // No tokens were issued -- the account was already verified, so there's no
                // session to store. Surface the backend's message and send the user to log in
                // normally instead of calling tokenStorage.setSession() on a tokenless response.
                setInfoMessage(response.message);
                router.replace('/auth/login');
                return;
            }

            await tokenStorage.setSession(response);
            setLoggedIn();
        } catch (error) {
            if (error instanceof ApiError && error.status === 422) {
                // Backend distinguishes a wrong code ("Kode verifikasi tidak valid.", retryable)
                // from an expired one ("Kode verifikasi sudah kedaluwarsa.") -- both are plain
                // 422s, so surface the exact backend message rather than a generic one.
                setErrorMessage(error.message);
            } else if (error instanceof ApiError && error.status === 401) {
                // A correct code submitted for a deactivated account is a genuine 401 (not an
                // expired/missing access token -- this screen runs pre-session). Surface the
                // backend's actual message instead of falling through to the generic one.
                setErrorMessage(error.message);
            } else if (error instanceof ApiError && error.status === 429) {
                setRetryAfter(error.retryAfter ?? 60);
            } else if (error instanceof ApiError && error.status >= 500) {
                setErrorMessage('Server sedang bermasalah. Coba lagi nanti.');
            } else {
                setErrorMessage('Verifikasi gagal. Periksa koneksi dan coba lagi.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (resendRetryAfter > 0 || isResending) return;

        setErrorMessage('');
        setInfoMessage('');
        setIsResending(true);

        try {
            await resendVerificationCode({ email });
            setInfoMessage(t.resendSent);
        } catch (error) {
            if (error instanceof ApiError && error.status === 429) {
                setResendRetryAfter(error.retryAfter ?? 60);
                setErrorMessage('Tunggu sebentar sebelum meminta kode baru.');
            } else if (error instanceof ApiError && error.status === 422) {
                setErrorMessage(error.message);
            } else if (error instanceof ApiError && error.status >= 500) {
                setErrorMessage('Server sedang bermasalah. Coba lagi nanti.');
            } else {
                setErrorMessage('Gagal mengirim ulang kode. Periksa koneksi dan coba lagi.');
            }
        } finally {
            setIsResending(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white px-6 justify-between pt-5" edges={['top', 'left', 'right']}>
            {/* Bagian Atas: Dekorasi Ornamen Gradasi Halus */}
            <View className="absolute top-0 left-0 right-0 h-64 bg-amber-500/5 rounded-b-[100px] -z-10 blur-3xl" />

            {/* Bagian Hero / Identitas Aplikasi */}
            <View className="items-center mt-3">
                <Image source={require('@/../assets/images/Sini-icon.png')} className="w-24 h-24" resizeMode="contain" />
                <Text className="text-4xl font-extrabold text-black tracking-tight mt-2">
                    {t.textTitle}
                </Text>
                <Text className="text-base text-neutral-400 mt-4 font-medium text-center px-4">
                    {t.textDescription}{email ? ` ${email}` : ''}
                </Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                <View className="w-full my-auto px-2 mt-4">
                    <Text className="text-sm font-semibold text-neutral-700 mb-2 ml-1">
                        {t.codeLabel}
                    </Text>

                    {/* Input Kode Verifikasi */}
                    <View className="bg-neutral-50 border border-neutral-100 rounded-2xl h-14 px-4 mb-6 flex-row items-center">
                        <Ionicons name="shield-checkmark-outline" size={20} color="#9CA3AF" />
                        <TextInput
                            className="text-neutral-900 ml-3 text-sm flex-1 tracking-[4px]"
                            placeholder={t.codePlaceholder}
                            placeholderTextColor="#9CA3AF"
                            value={code}
                            onChangeText={(value) => setCode(value.replace(/[^0-9]/g, '').slice(0, 6))}
                            keyboardType="number-pad"
                            maxLength={6}
                            editable={!isSubmitting}
                        />
                    </View>

                    {/* Tombol Utama Verifikasi */}
                    <TouchableOpacity
                        onPress={handleVerify}
                        disabled={isSubmitting || retryAfter > 0}
                        className={`bg-amber-400 h-14 w-full rounded-2xl flex-row items-center justify-center shadow-lg shadow-amber-400/30 ${isSubmitting || retryAfter > 0 ? 'opacity-70' : ''}`}
                        activeOpacity={0.8}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#171717" />
                        ) : (
                            <>
                                <Text className="text-neutral-900 font-bold text-base tracking-wide">
                                    {retryAfter > 0 ? `Coba lagi dalam ${retryAfter}s` : t.verifyButton}
                                </Text>
                                {retryAfter === 0 && <Ionicons name="arrow-forward" size={18} color="#171717" className="ml-2" />}
                            </>
                        )}
                    </TouchableOpacity>

                    {retryAfter > 0 ? (
                        <Text className="text-red-600 text-sm text-center mt-3">
                            Terlalu banyak percobaan. Coba lagi dalam {retryAfter} detik.
                        </Text>
                    ) : !!errorMessage && (
                        <Text className="text-red-600 text-sm text-center mt-3">{errorMessage}</Text>
                    )}

                    {!!infoMessage && !errorMessage && (
                        <Text className="text-emerald-600 text-sm text-center mt-3">{infoMessage}</Text>
                    )}

                    {/* Kirim Ulang Kode */}
                    <View className="flex-row justify-center items-center mt-6">
                        <Text className="text-sm text-neutral-500 font-medium">{t.noCode}</Text>
                        <TouchableOpacity onPress={handleResend} disabled={isResending || resendRetryAfter > 0} className="ml-1">
                            {isResending ? (
                                <ActivityIndicator color="#D97706" size="small" />
                            ) : (
                                <Text className="text-sm font-bold text-amber-600">
                                    {resendRetryAfter > 0 ? `${t.resendCode} (${resendRetryAfter}s)` : t.resendCode}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bagian Bawah: Navigasi Kembali ke Daftar */}
                <View className="flex-row justify-center items-center mt-6">
                    <Text className="text-sm text-neutral-500 font-medium">{t.textBackToRegister}</Text>
                    <TouchableOpacity onPress={() => router.replace('/auth/register')}>
                        <Text className="text-sm font-bold text-amber-600 ml-1">{t.textRegister}</Text>
                    </TouchableOpacity>
                </View>
                <LanguageSwitch style={{}} className="items-center justify-center mt-3 mb-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
