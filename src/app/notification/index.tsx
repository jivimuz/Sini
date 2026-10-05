import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useLang } from '@/stores/lang.store';
import locales from './locales';
import { useShowNavbar } from '@/stores/showNavBar.store';
import { useNotificationListStore } from './stores/list.store';
import { NotificationItem } from './api/list';
import Toast from '@/utils/Toast';

const ICON_BY_TYPE: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    system: { name: 'information-circle', color: '#3B82F6' },
    like: { name: 'heart', color: '#EF4444' },
    message: { name: 'chatbubble-ellipses', color: '#22C55E' },
};
const DEFAULT_ICON = { name: 'notifications' as const, color: '#FFD84D' };

const formatTimeAgo = (dateString: string, t: typeof locales['idID']['notificationScreen']) => {
    if (!dateString) return '';

    const diffInSeconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diffInSeconds < 60) return t.justNow;

    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes} ${t.minute} ${t.past}`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${t.hour} ${t.past}`;

    const days = Math.floor(hours / 24);
    return `${days} ${t.day} ${t.past}`;
};

const NotificationRow = ({ item, onPress, t }: {
    item: NotificationItem;
    onPress: () => void;
    t: typeof locales['idID']['notificationScreen'];
}) => {
    const icon = ICON_BY_TYPE[item.type ?? ''] ?? DEFAULT_ICON;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className={`flex-row items-start px-4 py-3 border-b border-gray-100 ${item.isRead ? 'bg-white' : 'bg-yellow-50'}`}
        >
            <View className="h-11 w-11 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${icon.color}20` }}>
                <Ionicons name={icon.name} size={20} color={icon.color} />
            </View>
            <View className="flex-1">
                <Text className="font-bold text-neutral-800" numberOfLines={1}>{item.title}</Text>
                <Text className="text-neutral-500 text-sm mt-0.5" numberOfLines={2}>{item.message}</Text>
                <Text className="text-neutral-400 text-xs mt-1">{formatTimeAgo(item.createdAt, t)}</Text>
            </View>
            {!item.isRead && <View className="h-2.5 w-2.5 rounded-full bg-primary mt-1" />}
        </TouchableOpacity>
    );
};

const NotificationScreen = () => {
    const { lang } = useLang();
    const t = locales[lang].notificationScreen;
    const { setNavbar } = useShowNavbar();

    const { items, isLoading, loadNotifications, markRead } = useNotificationListStore();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        setNavbar(false);
        return () => setNavbar(true);
    }, []);

    useEffect(() => {
        loadNotifications().catch(() => Toast.error(t.loadErrorTitle, t.loadErrorMessage));
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await loadNotifications();
        } catch {
            Toast.error(t.loadErrorTitle, t.loadErrorMessage);
        } finally {
            setRefreshing(false);
        }
    };

    const handlePressItem = (item: NotificationItem) => {
        if (!item.isRead) markRead(item.id);
        router.push(`/notification/screens/detail/${item.id}` as any);
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
            <View className="flex-row items-center p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="chevron-back" size={24} color="#171717" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-neutral-800">{t.title}</Text>
            </View>

            {isLoading && items.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#FFD84D" />
                </View>
            ) : items.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-neutral-400">{t.empty}</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#9CA3AF" />}
                    renderItem={({ item }) => (
                        <NotificationRow item={item} t={t} onPress={() => handlePressItem(item)} />
                    )}
                />
            )}
        </SafeAreaView>
    );
};

export default NotificationScreen;
