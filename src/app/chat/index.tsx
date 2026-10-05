import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    Animated,
    TextInput,
    Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import locales from "./locales";
import { useLang } from "@/stores/lang.store";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useShowNavbar } from "@/stores/showNavBar.store";
import { useChatStore } from "./stores/chat.store";
import { useCurrentUser } from "@/stores/currentUser.store";
import Toast from "@/utils/Toast";
import { ChatConversationSummary } from "./api/conversations";

const DEFAULT_AVATAR = require("@/../assets/images/default-user.png");

const formatRelativeTime = (iso: string | null | undefined, lang: "idID" | "enGB", yesterdayLabel: string) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const isSameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
    if (isSameDay) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.getFullYear() === yesterday.getFullYear() && date.getMonth() === yesterday.getMonth() && date.getDate() === yesterday.getDate();
    if (isYesterday) return yesterdayLabel;

    return date.toLocaleDateString(lang === "idID" ? "id-ID" : "en-GB", { day: "numeric", month: "short" });
};

export default function ChatScreen() {
    const { lang } = useLang();
    const t = locales[lang].ChatScreen.chatList;
    const { setNavbar } = useShowNavbar();

    const { conversations, isLoadingConversations, loadConversations, ensureRealtimeSubscriptions } = useChatStore();
    const { ensureLoaded } = useCurrentUser();
    const [refreshing, setRefreshing] = useState(false);
    const hasLoadedOnceRef = useRef(false);

    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchAnim = useRef(new Animated.Value(0)).current;
    const searchInputRef = useRef<TextInput>(null);

    const openSearch = () => {
        setIsSearching(true);
        Animated.timing(searchAnim, {
            toValue: 1,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start(() => searchInputRef.current?.focus());
    };

    const closeSearch = () => {
        searchInputRef.current?.blur();
        Animated.timing(searchAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: false,
        }).start(() => {
            setIsSearching(false);
            setSearchQuery("");
        });
    };

    const filteredConversations = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return conversations;
        return conversations.filter((c) => c.name.toLowerCase().includes(query));
    }, [conversations, searchQuery]);

    const refresh = useCallback(async () => {
        try {
            await ensureLoaded();
            await loadConversations();
        } catch (error) {
            console.error("[Chat] gagal memuat percakapan:", error);
            const detail = error instanceof Error ? error.message : String(error);
            Toast.error(t.loadErrorTitle, `${t.loadErrorMessage} (${detail})`);
            return;
        }

        try {
            ensureRealtimeSubscriptions();
        } catch (error) {
            // Realtime gagal tersambung tidak boleh membuat daftar chat terlihat gagal total --
            // data di atas sudah berhasil dimuat, cuma update live-nya yang belum jalan.
            console.error("[Chat] gagal membuka koneksi realtime:", error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setNavbar(true);
            if (!hasLoadedOnceRef.current) {
                hasLoadedOnceRef.current = true;
                refresh();
            }
        }, [])
    );

    const handleChatPress = (conversation: ChatConversationSummary) => {
        router.navigate(`/chat/screens/chatRoom/${conversation.id}` as any);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>

            {/* HEADER UTAMA */}
            <View className="border-b border-neutral-100">
                <View className="flex-row justify-between items-center px-5 py-4">
                    <View>
                        <Text className="text-2xl font-black text-neutral-900 tracking-tight">{t.title}</Text>
                        <Text className="text-xs font-medium text-neutral-400 mt-0.5">{t.subtitle}</Text>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => (isSearching ? closeSearch() : openSearch())}
                        className="h-10 w-10 items-center justify-center rounded-full bg-neutral-50 border border-neutral-100 shadow-sm"
                    >
                        <Ionicons name={isSearching ? "close" : "search"} size={20} color="#4B5563" />
                    </TouchableOpacity>
                </View>

                {/* BAR PENCARIAN -- muncul dengan animasi slide-down + fade saat tombol search ditekan */}
                <Animated.View
                    style={{
                        height: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 56] }),
                        opacity: searchAnim,
                    }}
                    className="overflow-hidden px-5"
                >
                    <View className="flex-row items-center bg-neutral-50 border border-neutral-100 rounded-full px-4 h-11 mb-3">
                        <Ionicons name="search" size={16} color="#9CA3AF" />
                        <TextInput
                            ref={searchInputRef}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder={t.searchPlaceholder}
                            placeholderTextColor="#9CA3AF"
                            returnKeyType="search"
                            className="flex-1 ml-2 text-sm text-neutral-800"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </View>

            {isLoadingConversations && conversations.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#FFD84D" />
                </View>
            ) : filteredConversations.length === 0 ? (
                <View className="flex-1 items-center justify-center px-10">
                    <Ionicons name="chatbubble-ellipses-outline" size={48} color="#D1D5DB" />
                    <Text className="text-neutral-400 text-center mt-3">
                        {searchQuery ? `${t.noResultsFor} "${searchQuery}"` : t.noConversations}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredConversations}
                    keyExtractor={(item) => item.id}
                    className="flex-1"
                    contentContainerStyle={{ paddingVertical: 8 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#9CA3AF" />}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => handleChatPress(item)}
                            activeOpacity={0.6}
                            className="flex-row items-center px-5 py-3.5 border-b border-neutral-50 active:bg-neutral-50"
                        >
                            {/* AREA AVATAR DENGAN BADGE ONLINE */}
                            <View className="relative">
                                <View className="w-13 h-13 rounded-full bg-[#FFE98A] items-center justify-center border border-amber-100 shadow-sm">
                                    <Image
                                        source={item.avatarUrl ? { uri: item.avatarUrl } : DEFAULT_AVATAR}
                                        className="w-11 h-11 rounded-full"
                                    />
                                </View>
                                {item.isOnline && (
                                    <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                                )}
                            </View>

                            {/* KONTEN INFORMASI CHAT */}
                            <View className="ml-4 flex-1 pr-1">
                                <View className="flex-row justify-between items-baseline">
                                    <Text className="font-bold text-neutral-800 text-[16px]">
                                        {item.name}
                                    </Text>
                                    <Text className={`text-xs ${item.unreadCount > 0 ? "text-amber-600 font-semibold" : "text-neutral-400"}`}>
                                        {formatRelativeTime(item.lastMessageAt, lang, t.yesterday)}
                                    </Text>
                                </View>

                                <View className="flex-row items-center mt-1">
                                    <Text
                                        numberOfLines={1}
                                        className={`text-[14px] flex-1 ${item.unreadCount > 0 ? "text-neutral-900 font-medium" : "text-neutral-400"}`}
                                    >
                                        {item.lastMessage || t.noMessageYet}
                                    </Text>
                                    {item.unreadCount > 0 && (
                                        <View className="ml-2 min-w-5 h-5 px-1.5 rounded-full bg-[#FFD84D] items-center justify-center shadow-sm">
                                            <Text className="text-[11px] font-bold text-neutral-900">
                                                {item.unreadCount}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}
