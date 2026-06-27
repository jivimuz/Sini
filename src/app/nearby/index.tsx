import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLang } from '@/stores/lang.store';
import locales from './locales';
import { FilterModal } from '@/components/FilterModal/FilterModal';
import { ALL_CATEGORIES, CategoryKey, LiveFilterStatus } from '@/constants/categories';
import { useStatusStore } from '@/components/Status/stores/status.store';
import { useUserStore } from '@/stores/user.store';
import { UserStatus } from '@/types/userStatus.type';
import { useLocationStore } from '@/stores/location.store';
import { useFilterStore } from '../home/stores/filter.store';
import { useShowNavbar } from '@/stores/showNavBar.store';

// Helper function to calculate distance
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return "";
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres
    if (d < 1000) {
        return `${Math.round(d)} m`;
    }
    return `${(d / 1000).toFixed(1)} km`;
};

// Helper function to calculate distance in meters
const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
};

// Helper to format time
const formatTimeAgo = (dateString: string, t: any) => {
    if (!dateString) return '';
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return t.justNow;
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes}${t.minute} ${t.past || 'lalu'}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}${t.hour} ${t.past || 'lalu'}`;
    const days = Math.floor(hours / 24);
    return `${days}${t.day} ${t.past || 'lalu'}`;
};

const NearbyScreen = () => {
    const { lang } = useLang();
    const t = locales[lang].nearbyScreen;
    const { users, toggleLike } = useUserStore();
    const { latitude: userLatitude, longitude: userLongitude } = useLocationStore();
    const { openStatus } = useStatusStore();
    const {
        visibleCategories,
        liveFilterStatus,
        filterRadius,
        setFilters,
    } = useFilterStore();

    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // TODO: Implement actual data refetching from API
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);
    const { setNavbar } = useShowNavbar();

    useEffect(() => {
        setNavbar(true);
    }, []);
    const filteredUsers = useMemo(() => {
        return users
            .filter((user) => {
                const categoryMatch = visibleCategories.includes(user.category as CategoryKey);

                const liveStatusMatch =
                    liveFilterStatus === 'all' ||
                    (liveFilterStatus === 'live' && user.is_live) ||
                    (liveFilterStatus === 'regular' && !user.is_live);

                const radiusMatch = (() => {
                    if (!userLatitude || !userLongitude) return true;
                    const distance = getDistanceInMeters(
                        userLatitude,
                        userLongitude,
                        user.latitude,
                        user.longitude
                    );
                    return distance <= filterRadius;
                })();
                return categoryMatch && liveStatusMatch && radiusMatch;
            })
            .sort((a, b) => {
                const distanceA = getDistanceInMeters(userLatitude!, userLongitude!, a.latitude, a.longitude) || 0;
                const distanceB = getDistanceInMeters(userLatitude!, userLongitude!, b.latitude, b.longitude) || 0;
                return distanceA - distanceB;
            });
    }, [users, visibleCategories, liveFilterStatus, filterRadius, userLatitude, userLongitude]);

    const renderItem = ({ item }: { item: UserStatus }) => (
        <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
            activeOpacity={0.8}
            onPress={() => openStatus(item.id)}
        >
            <View className="flex-row justify-center items-center">
                <Image
                    source={item.statusImageUrl}
                    className="w-16 h-20 rounded-lg mr-4"
                />
                <View className="flex-1">
                    <Text className="text-base font-bold text-neutral-800">{item.name}</Text>
                    <Text className="text-sm text-neutral-500 mt-1">
                        {getDistance(userLatitude!, userLongitude!, item.latitude, item.longitude)}
                        <Text className="text-neutral-400"> · </Text>
                        {formatTimeAgo(item.created_at || new Date().toISOString(), t)}
                    </Text>
                    <Text className="text-sm text-neutral-700 mt-2" numberOfLines={2}>
                        {item.caption}
                    </Text>
                </View>

                <TouchableOpacity
                    className="p-2 -mr-2 text-center items-center" // Add padding for easier tap & negative margin to align
                    onPress={(e) => {
                        e.stopPropagation();
                        toggleLike(item.id);
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons name={item.is_liked ? "heart" : "heart-outline"} size={25} color={item.is_liked ? '#ef4444' : "#9CA3AF"} />
                    <Text className="text-black text-xs font-semibold mt-1 shadow-sm">
                        {item.like_count}
                    </Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
            <View className="flex-row justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                <View>
                    <Text className="text-2xl font-bold text-neutral-800">{t.title}</Text>
                    <Text className="text-base text-neutral-500">{t.subtitle}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => setIsFilterModalVisible(true)}
                    className="h-12 w-12 items-center justify-center rounded-full bg-white border border-gray-200"
                >
                    <Ionicons name="filter" size={22} color="#132648" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredUsers}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9CA3AF" />
                }
                ListEmptyComponent={
                    <View className="flex-1 justify-center items-center mt-20">
                        <Text className="text-neutral-500">Tidak ada pengguna ditemukan.</Text>
                    </View>
                }
            />

            <FilterModal
                isVisible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                initialCategories={visibleCategories}
                initialLiveStatus={liveFilterStatus}
                initialRadius={filterRadius}
                onApply={(categories, liveStatus, radius) => {
                    setFilters(categories, liveStatus, radius);
                    setIsFilterModalVisible(false);
                }}
            />
        </SafeAreaView>
    );
};

export default NearbyScreen;