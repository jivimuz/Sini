import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useShowNavbar } from '@/stores/showNavBar.store';
import { useRouter } from 'expo-router';
import locales from './locales';
import { useLang } from '@/stores/lang.store';
import { LanguageSwitch } from '@/components/Lang/SwitchLangButton';

export default function ForgotPasswordScreen() {
    const { setNavbar } = useShowNavbar();
    const router = useRouter();
    const { lang } = useLang();

    const t = locales[lang].forgotPassword;
    useEffect(() => {
        setNavbar(false);
    }, []);

    const handleResetPassword = () => {
        // Logika untuk mengirim link reset password
        console.log("Mengirim link reset...");
        // Setelah berhasil, mungkin navigasi ke halaman konfirmasi atau kembali ke login
        router.back();
    };

    return (
        <SafeAreaView className="flex-1 bg-white px-6 justify-between pt-5">
            {/* Bagian Atas: Dekorasi Ornamen Gradasi Halus */}
            <View className="absolute top-0 left-0 right-0 h-64 bg-amber-500/5 rounded-b-[100px] -z-10 blur-3xl" />

            {/* Bagian Hero / Identitas Aplikasi */}
            <View className="items-center mt-3">
                <Image source={require('@/../assets/images/Sini-icon.png')} className="w-24 h-24" resizeMode="contain" />
                <Text className="text-4xl font-extrabold text-black tracking-tight mt-2">
                    {t.textTitle}
                </Text>
                <Text className="text-base text-neutral-400 mt-2 font-medium text-center px-4">
                    {t.textDescription}
                </Text>
            </View>

            {/* Bagian Formulir Input Interaktif */}
            <View className="w-full my-auto px-2">
                <Text className="text-sm font-semibold text-neutral-700 mb-2 ml-1">
                    {t.resetPasswordLabel}
                </Text>

                {/* Input Email */}
                <View className="bg-neutral-50 border border-neutral-100 rounded-2xl h-14 px-4 mb-6 flex-row items-center">
                    <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                    <TextInput className="text-neutral-400 ml-3 text-sm flex-1" placeholder={t.emailPlaceholder} keyboardType="email-address" autoCapitalize="none" />
                </View>

                {/* Tombol Utama Kirim Link */}
                <TouchableOpacity
                    onPress={handleResetPassword}
                    className="bg-amber-400 h-14 w-full rounded-2xl flex-row items-center justify-center shadow-lg shadow-amber-400/30"
                    activeOpacity={0.8}
                >
                    <Text className="text-neutral-900 font-bold text-base tracking-wide">
                        {t.sendResetLink}
                    </Text>
                    <Ionicons name="send-outline" size={18} color="#171717" className="ml-2" />
                </TouchableOpacity>
            </View>

            {/* Bagian Bawah: Navigasi Kembali ke Login */}
            <View className="flex-row justify-center items-center mt-6">
                <Text className="text-sm text-neutral-500 font-medium">{t.textBackToLogin}</Text>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                    <Text className="text-sm font-bold text-amber-600 ml-1">{t.textLogin}</Text>
                </TouchableOpacity>
            </View>
            <LanguageSwitch style={{}} className="items-center justify-center mt-3 mb-20" />

        </SafeAreaView>
    );
}