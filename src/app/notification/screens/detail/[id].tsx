import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { useLang } from '@/stores/lang.store';
import locales from '../../locales';
import { useShowNavbar } from '@/stores/showNavBar.store';
import { useNotificationListStore } from '../../stores/list.store';
import Toast from '@/utils/Toast';

const ICON_BY_TYPE: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    system: { name: 'information-circle', color: '#3B82F6' },
    like: { name: 'heart', color: '#EF4444' },
    message: { name: 'chatbubble-ellipses', color: '#22C55E' },
    follow: { name: 'person-add', color: '#8B5CF6' },
    password_changed: { name: 'lock-closed', color: '#F59E0B' },
};
const DEFAULT_ICON = { name: 'notifications' as const, color: '#FFD84D' };

const NotificationDetailScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { lang } = useLang();
    const t = locales[lang].notificationDetailScreen;
    const tList = locales[lang].notificationScreen;
    const { setNavbar } = useShowNavbar();

    const { items, isLoading, loadNotifications, markRead } = useNotificationListStore();
    const notification = items.find((item) => item.id === id);

    useEffect(() => {
        setNavbar(false);
        return () => setNavbar(true);
    }, []);

    // Kalau halaman ini dibuka tanpa lewat daftar dulu (store masih kosong, misal reload
    // langsung ke rute ini), muat sendiri -- sama seperti pola `ensureLoaded` di tempat lain.
    useEffect(() => {
        if (items.length === 0) {
            loadNotifications().catch(() => Toast.error(tList.loadErrorTitle, tList.loadErrorMessage));
        }
    }, []);

    useEffect(() => {
        if (notification && !notification.isRead) {
            markRead(notification.id);
        }
    }, [notification?.id]);

    const icon = ICON_BY_TYPE[notification?.type ?? ''] ?? DEFAULT_ICON;

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
            <View className="flex-row items-center p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="chevron-back" size={24} color="#171717" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-neutral-800">{t.title}</Text>
            </View>

            {notification ? (
                <View className="p-6">
                    <View className="h-16 w-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: `${icon.color}20` }}>
                        <Ionicons name={icon.name} size={30} color={icon.color} />
                    </View>
                    <Text className="text-xl font-bold text-neutral-800">{notification.title}</Text>
                    <Text className="text-neutral-400 text-sm mt-1">
                        {new Date(notification.createdAt).toLocaleString(lang === 'idID' ? 'id-ID' : 'en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                        })}
                    </Text>
                    <Text className="text-base text-neutral-700 mt-5 leading-6">{notification.message}</Text>
                </View>
            ) : isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#FFD84D" />
                </View>
            ) : (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-neutral-400">{t.notFound}</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

export default NotificationDetailScreen;
