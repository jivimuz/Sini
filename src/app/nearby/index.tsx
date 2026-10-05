import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl, ImageBackground, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLang } from '@/stores/lang.store';
import locales from './locales';
import { FilterModal } from '@/components/FilterModal/FilterModal';
import { UserStatus } from '@/types/userStatus.type';
import { useLocationStore } from '@/stores/location.store';
import { useFilterStore } from '../home/stores/filter.store';
import { useShowNavbar } from '@/stores/showNavBar.store';
import { getNearbyList } from './api/list';
import { togglePostLike } from '../post/_api/like';
import Toast from '@/utils/Toast';

const DEFAULT_AVATAR = require('@/../assets/images/default-user.png');
const PAGE_LIMIT = 20;

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

const NearbyScreen = () => {
    const { lang } = useLang();
    const t = locales[lang].nearbyScreen;
    const { latitude: userLatitude, longitude: userLongitude } = useLocationStore();
    const {
        visibleCategories,
        liveFilterStatus,
        filterRadius,
        setFilters,
    } = useFilterStore();

    const [items, setItems] = useState<UserStatus[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

    const { setNavbar } = useShowNavbar();

    useEffect(() => {
        setNavbar(true);
    }, []);

    // Memuat satu halaman dari API nearby -- `page` beneran dipakai sebagai offset di
    // backend sekarang (sebelumnya no-op), jadi "load more" di bawah benar-benar mengambil
    // data baru, bukan mengulang 20 item pertama.
    const loadPage = useCallback(
        async (pageToLoad: number, mode: 'replace' | 'append') => {
            if (!userLatitude || !userLongitude) return;

            const data = await getNearbyList({
                latitude: userLatitude,
                longitude: userLongitude,
                radius: filterRadius,
                categories: visibleCategories,
                liveStatus: liveFilterStatus,
                page: pageToLoad,
                limit: PAGE_LIMIT,
            });

            setItems((prev) => (mode === 'replace' ? data : [...prev, ...data]));
            // Array API biasa (bukan objek pagination): halaman yang lebih pendek dari limit
            // berarti itu halaman terakhir.
            setHasMore(data.length === PAGE_LIMIT);
            setPage(pageToLoad);
        },
        [userLatitude, userLongitude, filterRadius, visibleCategories, liveFilterStatus]
    );

    // Muat ulang dari halaman 1 setiap kali lokasi atau filter (radius/kategori/live) berubah.
    useEffect(() => {
        if (!userLatitude || !userLongitude) return;

        setIsLoading(true);
        loadPage(1, 'replace')
            .catch((error) => {
                console.error('[Nearby] gagal memuat:', error);
                Toast.error(t.loadErrorTitle, t.loadErrorMessage);
            })
            .finally(() => setIsLoading(false));
    }, [loadPage]);

    const handleLoadMore = () => {
        if (isLoadingMore || isLoading || refreshing || !hasMore) return;
        setIsLoadingMore(true);
        loadPage(page + 1, 'append')
            .catch(() => { })
            .finally(() => setIsLoadingMore(false));
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await loadPage(1, 'replace');
        } catch (error) {
            Toast.error(t.loadErrorTitle, t.loadErrorMessage);
        } finally {
            setRefreshing(false);
        }
    };

    const handleToggleLike = async (item: UserStatus) => {
        const wasLiked = item.is_liked;
        const previousCount = item.like_count;

        // Optimistic update dulu biar responsif, lalu selaraskan dengan hasil asli dari server.
        setItems((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, is_liked: !wasLiked, like_count: previousCount + (wasLiked ? -1 : 1) } : p))
        );

        try {
            const result = await togglePostLike(item.id);
            setItems((prev) =>
                prev.map((p) => (p.id === item.id ? { ...p, is_liked: result.isLiked, like_count: result.likeCount } : p))
            );
        } catch {
            setItems((prev) =>
                prev.map((p) => (p.id === item.id ? { ...p, is_liked: wasLiked, like_count: previousCount } : p))
            );
        }
    };

    const renderItem = ({ item }: { item: UserStatus }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            className="flex-1 max-w-[50%] p-2"
            onPress={() => router.navigate(`/reels?postId=${item.id}` as any)}
        >
            <View className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Image Section */}
                <ImageBackground
                    source={item.statusImageUrls[0] ? { uri: item.statusImageUrls[0] as unknown as string } : DEFAULT_AVATAR}
                    resizeMode="cover"
                    className="h-32 w-full"
                >
                    <View className="flex-1 justify-between p-2">
                        {item.is_live && (
                            <View className="bg-green-500 px-2 py-0.5 rounded-full self-start">
                                <Text className="text-white text-[10px] font-bold">{t.liveBadge}</Text>
                            </View>
                        )}
                        <View className="flex-1" />
                        {/* Price Tag */}
                        {item.is_selling && item.price !== null && (
                            <View className="bg-black/60 px-2 py-1 rounded-md self-start">
                                <Text className="text-white text-xs font-bold">
                                    {item.currency_symbol === 'Rp'
                                        ? `${item.currency_symbol} ${item.price.toLocaleString('id-ID')}`
                                        : `${item.currency_symbol} ${item.price.toLocaleString('en-US')}`
                                    }
                                </Text>
                            </View>
                        )}
                    </View>
                </ImageBackground>

                {/* Info Section */}
                <View className="p-2">
                    <Text className="text-sm font-semibold text-neutral-800" numberOfLines={2}>
                        {item.title || item.caption}
                    </Text>

                    {/* User and Distance */}
                    <View className="flex-row items-center justify-between mt-2">
                        <View className="flex-row items-center flex-1 mr-2">
                            <Image source={item.avatarUrl ? { uri: item.avatarUrl } : DEFAULT_AVATAR} className="w-5 h-5 rounded-full" />
                            <Text className="text-xs text-neutral-500 ml-1.5 flex-1" numberOfLines={1}>
                                {item.name.split(' ')[0]} · {getDistance(userLatitude!, userLongitude!, item.latitude, item.longitude)}
                            </Text>
                        </View>
                        {/* Like Button */}
                        <TouchableOpacity
                            className="flex-row items-center"
                            onPress={(e) => { e.stopPropagation(); handleToggleLike(item); }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name={item.is_liked ? "heart" : "heart-outline"} size={16} color={item.is_liked ? '#ef4444' : "#9CA3AF"} />
                            <Text className="text-neutral-600 text-xs font-semibold ml-1">
                                {item.like_count}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
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

            {!userLatitude || !userLongitude ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#FFD84D" />
                    <Text className="text-neutral-400 mt-3">{t.waitingForLocation}</Text>
                </View>
            ) : isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#FFD84D" />
                </View>
            ) : (
                <FlatList
                    numColumns={2}
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 16 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#9CA3AF" />
                    }
                    onEndReachedThreshold={0.4}
                    onEndReached={handleLoadMore}
                    ListFooterComponent={
                        isLoadingMore ? (
                            <View className="py-4">
                                <ActivityIndicator color="#FFD84D" />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View className="flex-1 justify-center items-center mt-20">
                            <Text className="text-neutral-500">{t.noResults}</Text>
                        </View>
                    }
                />
            )}
            <View className="h-20" />
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
