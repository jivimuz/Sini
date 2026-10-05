import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLang } from '@/stores/lang.store';
import locales from './locales';

import Constants from "expo-constants";
import { useShowNavbar } from '@/stores/showNavBar.store';

const AboutScreen = () => {
    const { lang } = useLang();
    const t = locales[lang].aboutScreen;
    const currentYear = new Date().getFullYear();
    const { setNavbar } = useShowNavbar();
    useEffect(() => {
        setNavbar(false);
    }, []);

    // Peningkatan CreditItem: Desain baris list modern yang menyatu dengan aksen inisial avatar
    const CreditItem = ({ role, name }: { role: string, name: string }) => (
        <View className="flex-row justify-between items-center py-3.5 px-1 border-b border-gray-100 last:border-b-0">
            <View className="flex-row items-center space-x-3 gap-3">
                {/* Visual Avatar Bulat Kecil Berdasarkan Inisial */}
                <View className="w-8 h-8 rounded-full bg-amber-100 items-center justify-center">
                    <Text className="text-xs font-bold text-amber-600">{name.charAt(0)}</Text>
                </View>
                <View>
                    <Text className="text-xs font-medium text-gray-400 uppercase tracking-wider">{role}</Text>
                    <Text className="text-base font-semibold text-gray-800 mt-0.5">{name}</Text>
                </View>
            </View>
            <Ionicons name="checkmark-circle-outline" size={18} color="#A78BFA" />
        </View>
    );

    const credits = [
        { role: t.developer, name: 'Jivi M.G' },
        { role: t.designer, name: 'Jivi M.G' },
        { role: t.productManager, name: 'Jivi M.G' },
        { role: t.qaTester, name: 'Jivi M.G' },
        { role: t.copywriter, name: 'Jivi M.G' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
            {/* Header: Dibuat lebih clean dengan efek minimalis */}
            <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100 shadow-sm z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="p-2 -ml-2 rounded-full active:bg-gray-100"
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-xl font-extrabold text-gray-900 ml-3 tracking-tight">{t.title}</Text>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
                className="flex-1"
            >
                {/* Hero Section: Didesain ulang agar fokus pada branding aplikasi */}
                <View className="items-center pt-10 pb-8 px-6 bg-white border-b border-gray-100 rounded-b-[32px] shadow-sm">
                    <View className="p-4 bg-gray-50 rounded-3xl shadow-inner border border-gray-100/50 mb-4">
                        <Image
                            source={require('@/../assets/images/Sini-icon.png')}
                            className="w-24 h-24"
                            resizeMode='contain'
                        />
                    </View>
                    <Text className="text-3xl font-black text-gray-900 tracking-tight">{t.appName}</Text>

                    {/* Badge Versi Modern */}
                    <View className="bg-violet-50 px-3 py-1 rounded-full mt-2 border border-violet-100">
                        <Text className="text-xs font-bold text-amber-600 tracking-wide">
                            {t.version} {Constants.expoConfig?.version}
                        </Text>
                    </View>

                    {/* Deskripsi Aplikasi dengan Spasi Lebih Nyaman */}
                    <Text className="text-sm text-gray-500 text-center mt-6 leading-relaxed max-w-[85%]">
                        {t.description}
                    </Text>
                </View>

                {/* Credits Section: Dikelompokkan ke dalam satu kartu kontainer elegan */}
                <View className="px-6 mt-8">
                    <View className="flex-row items-center mb-3 px-1 space-x-2 gap-2">
                        <Ionicons name="people-outline" size={16} color="#6B7280" />
                        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {t.creditsTitle}
                        </Text>
                    </View>

                    {/* Kartu Kredit Utama */}
                    <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        {credits.map((credit, index) => (
                            <CreditItem key={index} role={credit.role} name={credit.name} />
                        ))}
                    </View>
                </View>

            </ScrollView>

            {/* Footer: Lebih tipis dan menyatu sempurna */}
            <View className="py-4 items-center border-t border-gray-100 bg-white shadow-lg">
                <Text className="text-xs font-medium text-gray-400 tracking-wide">
                    {t.copyright.replace('{year}', currentYear.toString())}
                </Text>
            </View>
        </SafeAreaView>
    )
}

export default AboutScreen;
