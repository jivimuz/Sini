import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ImageBackground,
    ImageSourcePropType,
    FlatList,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { useLang } from '@/stores/lang.store';
import locales from './locales';
import { useLocationStore } from '@/stores/location.store';
import { useFilterStore } from '@/app/home/stores/filter.store';
import { useShowNavbar } from '@/stores/showNavBar.store';
import { useProfileModalStore } from '@/stores/profileModal.store';
import { useChatStore } from '@/app/chat/stores/chat.store';
import { getNearbyList } from '@/app/nearby/api/list';
import { togglePostLike } from '@/app/post/_api/like';
import { CATEGORIES } from '@/constants/categories';
import { UserStatus } from '@/types/userStatus.type';
import Toast from '@/utils/Toast';

// Lebih besar dari limit grid Nearby (20) -- feed vertikal ini dimaksudkan untuk scroll
// panjang terus-menerus, jadi satu halaman sebisa mungkin sudah mencakup postingan yang
// baru saja di-tap dari Nearby/Home tanpa perlu nunggu "load more" dulu.
const PAGE_LIMIT = 50;

/** Sama seperti src/app/post/index.tsx dan StatusBottomSheet.tsx -- backend mengembalikan
 * `statusImageUrls` sebagai array string URL biasa, bukan `{uri}`. */
const toImageSource = (value: ImageSourcePropType | string): ImageSourcePropType =>
    typeof value === 'string' ? { uri: value } : value;

// --- Satu kartu penuh layar, isinya disamakan dengan StatusBottomSheet (avatar, nama,
// kategori, harga, caption, like, kirim pesan) tapi dibungkus sebagai halaman penuh yang
// bisa di-scroll vertikal, bukan bottom sheet -- gaya Reels/TikTok.
const ReelCard = ({ post, height, onToggleLike, t }: {
    post: UserStatus;
    height: number;
    onToggleLike: (post: UserStatus) => void;
    t: typeof locales['idID']['reelsScreen'];
}) => {
    const insets = useSafeAreaInsets();
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [messageText, setMessageText] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    const { openProfile } = useProfileModalStore();
    const { startConversationWith, sendMessage: sendChatMessage } = useChatStore();

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveImageIndex(viewableItems[0].index);
        }
    }).current;

    const handleSendMessage = async () => {
        const text = messageText.trim();
        if (!text || isSendingMessage) return;

        setIsSendingMessage(true);
        try {
            // `/chat/conversations` finds-or-creates the 1:1 thread -- there's no other way
            // to get a conversationId before the first message (see startConversation()).
            const conversation = await startConversationWith(post.customerId);
            await sendChatMessage(conversation.id, post.customerId, text);
            setMessageText('');
            router.navigate(`/chat/screens/chatRoom/${conversation.id}` as any);
        } catch {
            Toast.error(t.sendMessageErrorTitle, t.sendMessageErrorMessage);
        } finally {
            setIsSendingMessage(false);
        }
    };

    const category = CATEGORIES.find((c) => c.key === post.category);

    return (
        <View style={{ height }} className="bg-neutral-900">
            <FlatList
                data={post.statusImageUrls}
                keyExtractor={(_, index) => `${post.id}-image-${index}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                renderItem={({ item: imageSource }) => (
                    <ImageBackground
                        source={toImageSource(imageSource)}
                        resizeMode="contain"
                        style={{ width: Dimensions.get('window').width, height }}
                    />
                )}
            />

            {/* Pagination dots */}
            {post.statusImageUrls.length > 1 && (
                <View style={{ top: insets.top + 12 }} className="absolute left-16 right-16 flex-row items-center gap-1.5">
                    {post.statusImageUrls.map((_, index) => (
                        <View key={`dot-${index}`} style={{ flex: 1 }} className={`h-1 rounded-full ${activeImageIndex === index ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                </View>
            )}

            {/* Top overlay: back + avatar/nama/lokasi */}
            <View style={{ top: insets.top + 20 }} className="absolute left-4 right-4 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} className="h-10 w-10 rounded-full bg-black/40 items-center justify-center mr-3">
                    <Ionicons name="chevron-back" size={22} color="white" />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={() => openProfile(post.id)} className="flex-row items-center flex-1">
                    <View
                        className="h-10 w-10 rounded-full border-2 border-yellow-400 overflow-hidden bg-neutral-700"
                        style={{ borderColor: post.is_live ? '#22c55e' : '#FFD84D' }}
                    >
                        {!!post.avatarUrl && (
                            <ImageBackground source={{ uri: post.avatarUrl }} resizeMode="cover" className="flex-1" />
                        )}
                    </View>
                    <Text className="text-white font-bold text-base ml-2 shadow-sm flex-1" numberOfLines={1}>{post.name}</Text>
                </TouchableOpacity>
                {post.is_live && (
                    <View className="bg-green-500 px-3 py-1 rounded-full">
                        <Text className="text-white text-xs font-bold">{t.liveBadge}</Text>
                    </View>
                )}
            </View>

            {/* Bottom overlay: kategori/harga/caption + like, lalu kolom kirim pesan */}
            <View style={{ bottom: insets.bottom + 20 }} className="absolute left-0 right-0 px-4">
                <View className="flex-row items-end justify-between mb-3">
                    <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-2 mb-2 flex-wrap">
                            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: category?.color ?? post.color }}>
                                <Text className="text-white text-xs font-semibold shadow-sm">{category?.name}</Text>
                            </View>
                            {post.is_selling && post.price !== null && (
                                <View className="bg-black/40 px-3 py-1 rounded-full">
                                    <Text className="text-white text-xs font-semibold shadow-sm">
                                        {post.currency_symbol === 'Rp'
                                            ? `${post.currency_symbol} ${post.price.toLocaleString('id-ID')}`
                                            : `${post.currency_symbol} ${post.price.toLocaleString('en-US')}`}
                                    </Text>
                                </View>
                            )}
                        </View>
                        {!!post.caption && (
                            <Text className="text-white text-sm shadow-sm" numberOfLines={3}>{post.caption}</Text>
                        )}
                    </View>
                    <TouchableOpacity onPress={() => onToggleLike(post)} activeOpacity={0.7} className="items-center">
                        <View className="h-12 w-12 rounded-full bg-black/40 items-center justify-center">
                            <Ionicons name={post.is_liked ? 'heart' : 'heart-outline'} size={24} color={post.is_liked ? '#ef4444' : '#E5E7EB'} />
                        </View>
                        <Text className="text-white text-xs font-bold mt-1 shadow-sm">{post.like_count}</Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-row items-center bg-black/40 rounded-full px-4 py-2 gap-3">
                    <TextInput
                        placeholder={t.chat}
                        placeholderTextColor="#D4D4D4"
                        className="flex-1 text-white h-11"
                        value={messageText}
                        onChangeText={setMessageText}
                        editable={!isSendingMessage}
                        onSubmitEditing={handleSendMessage}
                        returnKeyType="send"
                    />
                    <TouchableOpacity
                        onPress={handleSendMessage}
                        disabled={!messageText.trim() || isSendingMessage}
                        className="bg-softprimary h-11 w-11 rounded-full items-center justify-center"
                        style={{ opacity: !messageText.trim() || isSendingMessage ? 0.5 : 1 }}
                    >
                        {isSendingMessage ? (
                            <ActivityIndicator size="small" color="black" />
                        ) : (
                            <AntDesign name="send" size={18} color="black" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const ReelsScreen = () => {
    const { postId } = useLocalSearchParams<{ postId?: string }>();
    const { lang } = useLang();
    const t = locales[lang].reelsScreen;
    const insets = useSafeAreaInsets();

    const { latitude, longitude } = useLocationStore();
    const { visibleCategories, liveFilterStatus, filterRadius } = useFilterStore();
    const { setNavbar } = useShowNavbar();

    const [items, setItems] = useState<UserStatus[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [initialIndex, setInitialIndex] = useState<number | null>(null);

    const windowHeight = Dimensions.get('window').height;

    useEffect(() => {
        setNavbar(false);
        return () => setNavbar(true);
    }, []);

    const loadPage = useCallback(
        async (pageToLoad: number, mode: 'replace' | 'append') => {
            if (!latitude || !longitude) return;

            const data = await getNearbyList({
                latitude,
                longitude,
                radius: filterRadius,
                categories: visibleCategories,
                liveStatus: liveFilterStatus,
                page: pageToLoad,
                limit: PAGE_LIMIT,
            });

            setItems((prev) => (mode === 'replace' ? data : [...prev, ...data]));
            setHasMore(data.length === PAGE_LIMIT);
            setPage(pageToLoad);
        },
        [latitude, longitude, filterRadius, visibleCategories, liveFilterStatus]
    );

    useEffect(() => {
        if (!latitude || !longitude) return;

        setIsLoading(true);
        loadPage(1, 'replace')
            .catch(() => Toast.error(t.loadErrorTitle, t.loadErrorMessage))
            .finally(() => setIsLoading(false));
    }, [loadPage]);

    // Lompat langsung ke postingan yang di-tap dari Nearby/Home begitu halaman pertama
    // termuat -- kalau tidak ketemu (misal postingan ada di halaman berikutnya, atau dari
    // data dummy Home), mulai saja dari paling atas.
    useEffect(() => {
        if (items.length === 0 || initialIndex !== null) return;
        const idx = postId ? items.findIndex((item) => item.id === postId) : 0;
        setInitialIndex(idx >= 0 ? idx : 0);
    }, [items, postId, initialIndex]);

    const handleLoadMore = () => {
        if (isLoadingMore || isLoading || !hasMore) return;
        setIsLoadingMore(true);
        loadPage(page + 1, 'append')
            .catch(() => { })
            .finally(() => setIsLoadingMore(false));
    };

    // Sama seperti nearby/index.tsx -- optimistic update dulu, selaraskan dengan server setelahnya.
    const handleToggleLike = async (post: UserStatus) => {
        const wasLiked = post.is_liked;
        const previousCount = post.like_count;

        setItems((prev) =>
            prev.map((p) => (p.id === post.id ? { ...p, is_liked: !wasLiked, like_count: previousCount + (wasLiked ? -1 : 1) } : p))
        );

        try {
            const result = await togglePostLike(post.id);
            setItems((prev) =>
                prev.map((p) => (p.id === post.id ? { ...p, is_liked: result.isLiked, like_count: result.likeCount } : p))
            );
        } catch {
            setItems((prev) =>
                prev.map((p) => (p.id === post.id ? { ...p, is_liked: wasLiked, like_count: previousCount } : p))
            );
        }
    };

    if (!latitude || !longitude || isLoading || initialIndex === null) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator color="#FFD84D" />
                {!latitude && <Text className="text-neutral-400 mt-3">{t.waitingForLocation}</Text>}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ top: insets.top + 20 }}
                    className="absolute left-4 h-10 w-10 rounded-full bg-black/40 items-center justify-center"
                >
                    <Ionicons name="chevron-back" size={22} color="white" />
                </TouchableOpacity>
            </View>
        );
    }

    if (items.length === 0) {
        return (
            <View className="flex-1 bg-black items-center justify-center px-8">
                <Text className="text-neutral-400 text-center">{t.empty}</Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ top: insets.top + 20 }}
                    className="absolute left-4 h-10 w-10 rounded-full bg-black/40 items-center justify-center"
                >
                    <Ionicons name="chevron-back" size={22} color="white" />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                initialScrollIndex={initialIndex}
                getItemLayout={(_, index) => ({ length: windowHeight, offset: windowHeight * index, index })}
                onEndReachedThreshold={0.5}
                onEndReached={handleLoadMore}
                renderItem={({ item }) => (
                    <ReelCard post={item} height={windowHeight} onToggleLike={handleToggleLike} t={t} />
                )}
                ListFooterComponent={
                    isLoadingMore ? (
                        <View style={{ height: windowHeight }} className="items-center justify-center bg-black">
                            <ActivityIndicator color="#FFD84D" />
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

export default ReelsScreen;
