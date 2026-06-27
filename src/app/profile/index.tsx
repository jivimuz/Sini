import { View, Text, TouchableOpacity, ScrollView, Image, RefreshControl } from 'react-native'
import React, { useCallback, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Lang, useLang } from '@/stores/lang.store'
import locales from './locales'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/theme'
import { useBarColor } from '@/stores/barColor.store'

// --- Komponen untuk item menu ---
type MenuItemProps = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
    isLogout?: boolean;
};

const MenuItem = ({ icon, label, onPress, isLogout = false }: MenuItemProps) => (

    <TouchableOpacity
        onPress={onPress}
        className={`flex-row items-center p-4 rounded-xl mb-3 ${isLogout ? 'bg-orange-100' : 'bg-white'}`}
        activeOpacity={0.8}
    >
        <Ionicons
            name={icon}
            size={22}
            color={isLogout ? Colors.light.accent : '#60646C'} // text-gray-500
        />
        <Text className={`ml-4 text-base font-semibold ${isLogout ? 'text-orange-500' : 'text-gray-800'}`}>
            {label}
        </Text>
        {!isLogout && (
            <Ionicons
                name="chevron-forward"
                size={20}
                color="#60646C" // text-gray-500
                style={{ marginLeft: 'auto' }}
            />
        )}
    </TouchableOpacity>
);

const ProfileScreen = () => {
    const { lang, setLang } = useLang();
    const t = locales[lang].profileScreen;
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Di sini Anda bisa menambahkan logika untuk memuat ulang data profil dari API
        // Contoh: fetchProfileData().then(() => setRefreshing(false));
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    // --- Komponen untuk tombol pilihan bahasa ---
    const LanguageButton = ({ targetLang, label }: { targetLang: Lang, label: string }) => (
        <TouchableOpacity
            onPress={() => setLang(targetLang)}
            className={`flex-1 p-3 rounded-lg ${lang === targetLang ? 'bg-primary' : 'bg-gray-200'}`}
        >
            <Text className={`text-center font-semibold ${lang === targetLang ? 'text-black' : 'text-gray-600'}`}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
            <View className="flex-1 bg-gray-50">
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9CA3AF" />
                    }>
                    <View className="items-center pt-12 pb-8">

                        <View className="relative">

                            <Image
                                source={{
                                    uri: "https://i.pravatar.cc/200",
                                }}
                                className="
                                w-28    
                                h-28
                                rounded-full
                                border-4
                                border-[#FFD84D]
                                "
                            />

                            <TouchableOpacity
                                className="
                                absolute
                                bottom-0
                                right-0
                                w-10
                                h-10
                                rounded-full
                                bg-[#FFD84D]
                                items-center
                                justify-center
                                "
                            >
                                <Ionicons
                                    name="camera"
                                    size={18}
                                />
                            </TouchableOpacity>

                        </View>

                        <Text
                            className="
        mt-5
        text-2xl
        font-bold
        "
                        >
                            Jivi Muz
                        </Text>

                        <Text className="text-neutral-500">
                            @jivimuz
                        </Text>

                    </View>

                    {/* Gunakan SafeAreaView di sini untuk melindungi konten di bawah header */}
                    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
                        <View className="p-5">
                            {/* --- Bagian Pengaturan Akun --- */}
                            <Text className="text-sm font-bold text-gray-500 uppercase mb-2 px-2">{t.accountSection}</Text>
                            <View className="mb-6">
                                <MenuItem icon="person-outline" label={t.editProfile} />
                                <MenuItem icon="notifications-outline" label={t.notifications} />
                                <MenuItem icon="shield-checkmark-outline" label={t.security} />
                            </View>

                            {/* --- Bagian Pengaturan Aplikasi --- */}
                            <Text className="text-sm font-bold text-gray-500 uppercase mb-2 px-2">{t.settingsSection}</Text>
                            <View className="bg-white p-4 rounded-xl mb-6">
                                <View className="flex-row items-center">
                                    <Ionicons name="language-outline" size={22} color="#60646C" />
                                    <Text className="ml-4 text-base font-semibold text-gray-800">{t.languageSection.title}</Text>
                                </View>
                                <Text className="text-sm text-gray-500 mt-1 mb-4 ml-10">{t.languageSection.description}</Text>
                                <View className="flex-row space-x-3 ml-10 gap-2">
                                    <LanguageButton targetLang="idID" label={t.languageSection.id} />
                                    <LanguageButton targetLang="enGB" label={t.languageSection.en} />
                                </View>
                            </View>

                            {/* --- Bagian Lainnya --- */}
                            <Text className="text-sm font-bold text-gray-500 uppercase mb-2 px-2">{t.otherSection}</Text>
                            <View className="mb-6">
                                <MenuItem icon="help-circle-outline" label={t.helpCenter} />
                                <MenuItem icon="information-circle-outline" label={t.aboutApp} />
                            </View>

                            {/* --- Tombol Logout --- */}
                            <MenuItem icon="log-out-outline" label={t.logout} isLogout={true} />
                        </View>
                    </SafeAreaView>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

export default ProfileScreen