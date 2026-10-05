import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useShowNavbar } from '@/stores/showNavBar.store';
import { useRouter } from 'expo-router';
import { GoogleButton } from '@/components/Auth/GoogleButton/GoogleButton';
import { AppleButton } from '@/components/Auth/AppleButton/AppleButton';
import { useLang } from '@/stores/lang.store';
import locales from './locales';
import { LanguageSwitch } from '@/components/Lang/SwitchLangButton';
import { useAuth } from '../../stores/auth.store';
import { register as registerRequest } from './api/register';
import { tokenStorage } from '../api/client';
import { ApiError } from '../api/types';

export default function RegisterScreen() {
    const { setNavbar } = useShowNavbar();
    const router = useRouter();
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const { lang } = useLang();
    const t = locales[lang].register;

    useEffect(() => {
        setNavbar(false);
    }, []);

    const { login: setLoggedIn } = useAuth();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [retryAfter, setRetryAfter] = useState(0);

    useEffect(() => {
        if (retryAfter <= 0) return;

        const timer = setInterval(() => {
            setRetryAfter((current) => (current <= 1 ? 0 : current - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [retryAfter > 0]);

    const handleRegister = async () => {
        if (retryAfter > 0) return;

        setErrorMessage('');

        if (!name.trim() || !username.trim() || !email.trim() || !password) {
            setErrorMessage('Semua kolom wajib diisi.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Konfirmasi password tidak sama.');
            return;
        }

        setIsSubmitting(true);

        try {
            const session = await registerRequest({
                name: name.trim(),
                username: username.trim(),
                email: email.trim(),
                password,
                password_confirmation: confirmPassword,
            });
            await tokenStorage.setSession(session);
            setLoggedIn();
        } catch (error) {
            if (error instanceof ApiError && error.status === 422) {
                const errors = (error.details as { errors?: Record<string, string[]> } | undefined)?.errors;
                const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
                setErrorMessage(firstError ?? 'Periksa kembali data pendaftaran Anda.');
            } else if (error instanceof ApiError && error.status === 429) {
                setRetryAfter(error.retryAfter ?? 60);
            } else if (error instanceof ApiError && error.status >= 500) {
                setErrorMessage('Server sedang bermasalah. Coba lagi nanti.');
            } else {
                setErrorMessage('Pendaftaran gagal. Periksa koneksi dan coba lagi.');
            }
        } finally {
            setIsSubmitting(false);
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
                    Sini
                </Text>
                <View className="items-center flex-row">
                    <Text className=" font-black text-neutral-900 shadow-sm shadow-amber-500">
                        Stay
                        <Text className="text-[#F6C431]"> Close.</Text>
                    </Text>

                    <Text className=" font-black text-neutral-900 shadow-sm shadow-amber-500 ml-1">
                        Stay
                        <Text className="text-[#F6C431]"> Sini.</Text>
                    </Text>
                </View>
                <Text className="text-base text-neutral-400 mt-4 font-medium text-center px-4">
                    {t.textTitle}
                </Text>
            </View>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

                {/* Bagian Formulir Input Interaktif */}
                <View className="w-full my-auto px-2 mt-4">
                    <Text className="text-sm font-semibold text-neutral-700 mb-2 ml-1">
                        {t.textRegister}
                    </Text>

                    {/* Input Nama Lengkap */}
                    <View className="bg-neutral-50 border border-neutral-100 rounded-2xl h-14 px-4 mb-4 flex-row items-center">
                        <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                        <TextInput className="text-neutral-900 ml-3 text-sm flex-1" placeholder={t.textFullName} placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} editable={!isSubmitting} />
                    </View>

                    {/* Input Username */}
                    <View className="bg-neutral-50 border border-neutral-100 rounded-2xl h-14 px-4 mb-4 flex-row items-center">
                        <Ionicons name="at-outline" size={20} color="#9CA3AF" />
                        <TextInput className="text-neutral-900 ml-3 text-sm flex-1" placeholder={t.textUsername} placeholderTextColor="#9CA3AF" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} editable={!isSubmitting} />
                    </View>

                    {/* Input Email */}
                    <View className="bg-neutral-50 border border-neutral-100 rounded-2xl h-14 px-4 mb-4 flex-row items-center">
                        <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                        <TextInput className="text-neutral-900 ml-3 text-sm flex-1" placeholder={t.textEmail} placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={setEmail} editable={!isSubmitting} />
                    </View>

                    {/* Input Password */}
                    <View className="bg-neutral-50 border border-neutral-100 rounded-2xl h-14 px-4 mb-4 flex-row items-center">
                        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                        <TextInput className="text-neutral-900 ml-3 text-sm flex-1" placeholder={t.textPassword} placeholderTextColor="#9CA3AF" secureTextEntry={!showPassword} autoCapitalize="none" value={password} onChangeText={setPassword} editable={!isSubmitting} />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="ml-2">
                            <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Input Konfirmasi Password */}
                    <View className="bg-neutral-50 border border-neutral-100 rounded-2xl h-14 px-4 mb-6 flex-row items-center">
                        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                        <TextInput className="text-neutral-900 ml-3 text-sm flex-1" placeholder={t.textConfirmPassword} placeholderTextColor="#9CA3AF" secureTextEntry={!showConfirmPassword} autoCapitalize="none" value={confirmPassword} onChangeText={setConfirmPassword} editable={!isSubmitting} />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="ml-2">
                            <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Tombol Utama Daftar */}
                    <TouchableOpacity
                        onPress={handleRegister}
                        disabled={isSubmitting || retryAfter > 0}
                        className={`bg-amber-400 h-14 w-full rounded-2xl flex-row items-center justify-center shadow-lg shadow-amber-400/30 ${isSubmitting || retryAfter > 0 ? 'opacity-70' : ''}`}
                        activeOpacity={0.8}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#171717" />
                        ) : (
                            <>
                                <Text className="text-neutral-900 font-bold text-base tracking-wide">
                                    {retryAfter > 0 ? `Coba lagi dalam ${retryAfter}s` : t.textRegister}
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

                    {/* Pembatas Or Konten */}
                    <View className="flex-row items-center my-6">
                        <View className="flex-1 h-[1px] bg-neutral-200" />
                        <Text className="text-xs text-neutral-400 font-semibold uppercase mx-4">{t.textOr}</Text>
                        <View className="flex-1 h-[1px] bg-neutral-200" />
                    </View>

                    {/* Pilihan Login Sosial Medial */}
                    <View className="flex-row justify-center gap-4">
                        <GoogleButton onPress={() => { }} />
                        {Platform.OS === 'ios' && <AppleButton onPress={() => { }} />}
                    </View>
                </View>

                {/* Bagian Bawah: Navigasi ke Login */}
                <View className="flex-row justify-center items-center mt-6">
                    <Text className="text-sm text-neutral-500 font-medium">{t.textAlreadyHaveAccount}</Text>
                    <TouchableOpacity onPress={() => router.push('/auth/login')}>
                        <Text className="text-sm font-bold text-amber-600 ml-1">{t.textLogin}</Text>
                    </TouchableOpacity>
                </View>
                <LanguageSwitch style={{}} className="items-center justify-center mt-3 mb-20" />
            </ScrollView>
        </SafeAreaView>
    );
}