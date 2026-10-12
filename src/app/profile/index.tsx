import { View, Text, TouchableOpacity, ScrollView, Image, RefreshControl, ActivityIndicator } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLang } from '@/stores/lang.store'
import locales from './locales'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/theme'
import { useShowNavbar } from '@/stores/showNavBar.store'
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import Toast from '@/utils/Toast'
import { useAuth } from '@/stores/auth.store'
import { router, useFocusEffect } from 'expo-router'
import { getMe, ProfileResponse } from './api/me'
import { updateAvatar } from './api/avatar'
import { ApiError } from '../api/types'

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

const DEFAULT_AVATAR = require('@/../assets/images/default-user.png');

/**
 * Laravel lumps every avatar validation failure under one 422, but the underlying
 * message tells apart "too large" from "wrong format" from "no file at all" -- surface
 * that instead of one generic "foto tidak valid" for every case.
 */
const describeAvatarValidationError = (error: ApiError): [string, string] => {
    const message = error.message.toLowerCase();

    if (message.includes('failed to upload') || message.includes('greater than') || message.includes('kilobytes')) {
        return ['Foto terlalu besar', 'Gunakan foto berukuran lebih kecil (maksimal 5MB).'];
    }

    if (message.includes('must be an image') || message.includes('type:')) {
        return ['Format foto tidak didukung', 'Gunakan foto berformat jpg, jpeg, png, atau webp.'];
    }

    if (message.includes('required')) {
        return ['Foto belum dipilih', 'Pilih foto terlebih dahulu.'];
    }

    return ['Foto tidak valid', error.message];
};

const ProfileScreen = () => {
    const { lang, setLang } = useLang();
    const t = locales[lang].profileScreen;
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const { logout } = useAuth();

    const loadProfile = useCallback(async () => {
        try {
            const data = await getMe();
            setProfile(data);
            if (data.language && data.language !== lang) {
                setLang(data.language);
            }
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                // Sesi sudah tidak valid, kembalikan ke login.
                logout();
                return;
            }

            Toast.error(
                'Gagal memuat profil',
                error instanceof ApiError ? error.message : 'Periksa koneksi dan coba lagi.'
            );
        }
    }, [lang, logout, setLang]);

    const hasLoadedOnceRef = useRef(false);

    // Muat ulang setiap kali layar ini kembali fokus (mis. setelah kembali dari halaman
    // edit profil), tapi loader besar cuma tampil sekali di pemuatan pertama -- setelah itu
    // refresh berjalan diam-diam di belakang supaya tidak kedip tiap kali balik ke sini.
    useFocusEffect(
        useCallback(() => {
            if (!hasLoadedOnceRef.current) setIsLoading(true);
            loadProfile().finally(() => {
                hasLoadedOnceRef.current = true;
                setIsLoading(false);
            });
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [loadProfile])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadProfile();
        setRefreshing(false);
    }, [loadProfile]);

    const { setNavbar } = useShowNavbar();

    useEffect(() => {
        setNavbar(true);
    }, []);

    const handleChangeProfilePicture = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Toast.info('Izin Diperlukan', 'Anda perlu memberikan izin galeri untuk mengubah foto profil.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Rasio aspek 1:1 untuk foto profil
            quality: 0.5,
        });

        if (result.canceled) {
            return;
        }

        const asset = result.assets[0];

        setIsUploadingAvatar(true);

        // Kompres di perangkat dulu: foto asli dari galeri/kamera bisa beberapa MB,
        // jauh di atas batas upload PHP (`upload_max_filesize`) di server dev lokal,
        // sehingga request gagal sebelum sempat dibalas. Backend tetap mengompres lagi
        // sebagai pengaman kedua, tapi upload itu sendiri harus kecil sejak awal.
        let uploadUri = asset.uri;
        try {
            const manipulated = await ImageManipulator.manipulate(asset.uri)
                .resize({ width: 512 })
                .renderAsync();
            const saved = await manipulated.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
            uploadUri = saved.uri;
        } catch (manipulateError) {
            // Jika gagal dikompres di perangkat, kirim saja aslinya; backend akan mengompresnya.
            console.warn('[Profile] gagal mengompres foto di perangkat, kirim file asli:', manipulateError);
        }

        // Expo SDK 57's global `fetch` has its own FormData encoder that does NOT understand
        // React Native's classic `{ uri, name, type }` file shorthand (it only accepts a real
        // Blob/File) -- passing the shorthand throws "Unsupported FormDataPart implementation".
        const formData = new FormData();
        formData.append('avatar', new File(uploadUri) as unknown as Blob);

        try {
            const updated = await updateAvatar(formData);
            setProfile(updated);
            Toast.success('Foto profil diperbarui');
        } catch (error) {
            if (error instanceof ApiError && error.status === 413) {
                // Body ditolak sebelum masuk Laravel (melebihi post_max_size di server).
                Toast.error('Foto terlalu besar', 'Ukuran foto melebihi kapasitas server. Coba pilih foto lain.');
            } else if (error instanceof ApiError && error.status === 422) {
                Toast.error(...describeAvatarValidationError(error));
            } else if (error instanceof ApiError && error.status === 401) {
                logout();
            } else if (error instanceof ApiError) {
                // Status selain di atas (mis. 500) -- tampilkan apa adanya supaya tidak perlu
                // menebak dari pesan generik saat men-debug.
                Toast.error('Gagal memperbarui foto', `${error.message} (${error.status})`);
            } else {
                // Request tidak pernah dibalas server (ApiError tidak terbentuk) -- biasanya
                // berarti fetch gagal di sisi perangkat sendiri (file tidak terbaca, dsb),
                // bukan benar-benar soal koneksi. Catat detailnya supaya kelihatan di console.
                console.error('[Profile] upload avatar gagal sebelum dapat respons server:', error);
                const detail = error instanceof Error ? error.message : String(error);
                Toast.error('Gagal memperbarui foto', `Periksa koneksi dan coba lagi. (${detail})`);
            }
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color={Colors.light.accent} />
            </SafeAreaView>
        );
    }

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
                                source={profile?.avatarUrl ? { uri: profile.avatarUrl } : DEFAULT_AVATAR}
                                className="
                                w-28
                                h-28
                                rounded-full
                                border-4
                                border-[#FFD84D]
                                "
                            />

                            <TouchableOpacity
                                onPress={handleChangeProfilePicture}
                                disabled={isUploadingAvatar}
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
                                {isUploadingAvatar ? (
                                    <ActivityIndicator size="small" color="#171717" />
                                ) : (
                                    <Ionicons
                                        name="camera"
                                        size={18}
                                    />
                                )}
                            </TouchableOpacity>

                        </View>

                        <Text
                            className="
        mt-5
        text-2xl
        font-bold
        "
                        >
                            {profile?.name ?? '-'}
                        </Text>

                        <Text className="text-neutral-500">
                            {profile?.username ? `@${profile.username}` : profile?.email ?? ''}
                        </Text>

                    </View>

                    {/* Gunakan SafeAreaView di sini untuk melindungi konten di bawah header */}
                    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
                        <View className="p-5">
                            {/* --- Bagian Pengaturan Akun --- */}
                            <Text className="text-sm font-bold text-gray-500 uppercase mb-2 px-2">{t.accountSection}</Text>
                            <View className="mb-6">
                                <MenuItem icon="person-outline" label={t.editProfile} onPress={() => router.push('/profile/edit')} />
                                <MenuItem icon="settings-outline" label={t.settingsMenu} onPress={() => router.push('/profile/settings')} />
                            </View>

                            {/* --- Bagian Lainnya --- */}
                            <Text className="text-sm font-bold text-gray-500 uppercase mb-2 px-2">{t.otherSection}</Text>
                            <View className="mb-6">
                                <MenuItem icon="help-circle-outline" onPress={() => router.push('/help')} label={t.helpCenter} />
                                <MenuItem icon="ticket-outline" onPress={() => router.push('/helpdesk')} label={t.supportTickets} />
                                <MenuItem icon="information-circle-outline" onPress={() => router.push('/about')} label={t.aboutApp} />
                            </View>

                            {/* --- Tombol Logout --- */}
                            <MenuItem icon="log-out-outline" label={t.logout} isLogout={true} onPress={() => { logout() }} />
                        </View>
                    </SafeAreaView>
                    <View className="h-20" />
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

export default ProfileScreen
