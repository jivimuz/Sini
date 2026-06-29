import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../stores/auth.store';
import { useShowNavbar } from '@/stores/showNavBar.store';
import { useRouter } from 'expo-router';
import { AppleButton } from '@/components/Auth/AppleButton/AppleButton';
import { GoogleButton } from '@/components/Auth/GoogleButton/GoogleButton';
import { useLang } from '@/stores/lang.store';
import locales from './locales';
import { LanguageSwitch } from '@/components/Lang/SwitchLangButton';

export default function LoginScreen() {
    const { login } = useAuth();
    const { setNavbar } = useShowNavbar();
    const [showPassword, setShowPassword] = React.useState(false);
    const router = useRouter();
    const { lang } = useLang();

    const t = locales[lang].login;

    useEffect(() => {
        setNavbar(false);
    }, []);


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
                        <Text className="text-[#F6C431] ml-1"> Sini.</Text>
                    </Text>
                </View>
                <Text className="text-base text-neutral-400 mt-4 font-medium text-center px-4">
                    {t.textTitle}
                </Text>
            </View>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>


                {/* Bagian Formulir Input Interaktif */}
                <View className="w-full my-auto px-2">
                    <Text className="text-sm font-semibold text-neutral-700 mb-2 ml-1">
                        {t.textLog}
                    </Text>

                    {/* Input Email Dummy */}
                    <View className="bg-neutral-50 border border-neutral-100 rounded-2xl h-14 px-4 mb-4 flex-row items-center">
                        <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                        <TextInput className="text-black ml-3 text-sm flex-1" placeholder={t.textEmail} />
                    </View>

                    {/* Input Password Dummy */}
                    <View className="bg-neutral-50 border border-neutral-100 rounded-2xl h-14 px-4 mb-3 flex-row items-center">
                        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                        <TextInput className="text-black ml-3 text-sm flex-1" placeholder={t.textPassword} secureTextEntry={!showPassword} />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="ml-2">
                            <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Lupa Password Link */}
                    <TouchableOpacity onPress={() => router.push('/auth/forgot-password')} className="align-self-end mb-6 ml-auto">
                        <Text className="text-xs font-semibold text-amber-600">{t.textForgotPassword}</Text>
                    </TouchableOpacity>

                    {/* Tombol Utama Login */}
                    <TouchableOpacity
                        onPress={login}
                        className="bg-amber-400 h-14 w-full rounded-2xl flex-row items-center justify-center shadow-lg shadow-amber-400/30"
                        activeOpacity={0.8}
                    >
                        <Text className="text-neutral-900 font-bold text-base tracking-wide">
                            {t.textLogin}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#171717" className="ml-2" />
                    </TouchableOpacity>

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

                {/* Bagian Bawah: Navigasi Daftar */}
                <View className="flex-row justify-center items-center mt-6">
                    <Text className="text-sm text-neutral-500 font-medium">{t.textNoAccount}</Text>
                    <TouchableOpacity onPress={() => router.push('/auth/register')}>
                        <Text className="text-sm font-bold text-amber-600 ml-1">{t.textRegister}</Text>
                    </TouchableOpacity>
                </View>
                <LanguageSwitch style={{}} className="items-center justify-center mt-3 mb-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
