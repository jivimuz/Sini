import React,
{
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import BottomSheet,
{
    BottomSheetView,
} from "@gorhom/bottom-sheet";

import {
    View,
    Text,
    ActivityIndicator,
    Image,
    ImageSourcePropType,
    TouchableOpacity,
    ImageBackground,
    TextInput,
    FlatList,
    Dimensions,
} from "react-native";
import { useStatusStore } from "@/components/Status/stores/status.store";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useLang } from "@/stores/lang.store";
import locales from "./locales";
import { useLocationStore } from "@/stores/location.store";
import { useProfileModalStore } from "@/stores/profileModal.store";
import { useViewersStore } from "@/app/post/stores/viewers.store";
import { useChatStore } from "@/app/chat/stores/chat.store";
import { CATEGORIES } from "@/constants/categories";
import { router } from "expo-router";
import Toast from "@/utils/Toast";

/**
 * Backend mengembalikan `statusImageUrls` sebagai array string URL biasa (bukan `{uri}`),
 * sementara data dummy (home) memakai hasil `require()` lokal -- Image/ImageBackground RN
 * butuh `{uri}`, bukan string mentah, jadi harus dinormalisasi di titik render supaya
 * kedua bentuk itu sama-sama tampil. Sama seperti src/app/post/index.tsx.
 */
const toImageSource = (value: ImageSourcePropType | string): ImageSourcePropType =>
    typeof value === 'string' ? { uri: value } : value;

// Helper untuk menghitung waktu yang telah berlalu.
// Fungsi ini berasumsi bahwa objek locale `t` memiliki struktur seperti:
// t.time = { minute: 'menit', hour: 'jam', day: 'hari', justNow: 'Baru saja' }
// t.past = 'lalu'
const formatTimeAgo = (dateString: string, t: any) => {
    if (!dateString) return '';

    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    const timeUnits = t.time || { minute: t.minute || 'menit', hour: t.hour || 'jam', day: t.day || 'hari', justNow: t.justNow || 'Baru saja' };
    const pastText = t.past || 'lalu';

    if (diffInSeconds < 60) {
        return timeUnits.justNow;
    }
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes} ${timeUnits.minute} ${pastText}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${timeUnits.hour} ${pastText}`;
    const days = Math.floor(hours / 24);
    return `${days} ${timeUnits.day} ${pastText}`;
};

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

export default function StatusBottomSheet() {
    const sheetRef =
        useRef<BottomSheet>(null);
    const snapPoints =
        useMemo(
            () => ["95%"],
            []
        );
    const [activeIndex, setActiveIndex] = useState(0);

    const { lang } = useLang();
    const t = locales[lang].statusBottomSheet;

    const {
        selectedStatus: status,
        onToggleLike,
        onEndPost,
        isOwnStatus,
        closeStatus,
    } = useStatusStore();
    const { latitude: userLatitude, longitude: userLongitude } = useLocationStore();
    const { openProfile } = useProfileModalStore();
    const { openViewers } = useViewersStore();
    const { startConversationWith, sendMessage: sendChatMessage } = useChatStore();

    // State like lokal untuk sheet ini sendiri -- optimistic update di sini terpisah
    // dari list di belakangnya (home/nearby), lalu disinkronkan lewat `onToggleLike`
    // yang dikirim si pemanggil (dummy toggle untuk home, API asli untuk nearby).
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [messageText, setMessageText] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    useEffect(() => {
        if (status) {
            setIsLiked(status.is_liked);
            setLikeCount(status.like_count);
        }
        setMessageText('');
    }, [status?.id]);

    const handleSendMessage = async () => {
        const text = messageText.trim();
        if (!status || !text || isSendingMessage) return;

        setIsSendingMessage(true);
        try {
            // `/chat/conversations` finds-or-creates the 1:1 thread -- there's no other way
            // to get a conversationId before the first message (see startConversation()).
            const conversation = await startConversationWith(status.customerId);
            await sendChatMessage(conversation.id, status.customerId, text);
            setMessageText('');
            closeStatus();
            router.navigate(`/chat/screens/chatRoom/${conversation.id}` as any);
        } catch {
            Toast.error(t.sendMessageErrorTitle, t.sendMessageErrorMessage);
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleToggleLike = () => {
        if (!status) return;
        const nextLiked = !isLiked;
        setIsLiked(nextLiked);
        setLikeCount((prev) => prev + (nextLiked ? 1 : -1));
        onToggleLike?.(status);
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index);
        }
    }).current;

    useEffect(() => {
        if (status) {
            sheetRef.current?.expand();
        } else {
            sheetRef.current?.close();
        }
        // Reset index ketika status baru dibuka
        setActiveIndex(0);
    }, [status?.id]);

    const handleClose = () => {
        closeStatus();
    }

    return (
        <BottomSheet
            ref={sheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={closeStatus}
            handleIndicatorStyle={{ backgroundColor: '#E5E7EB' }} // a subtle handle
        >
            <BottomSheetView
                className="flex-1 h-full bg-black rounded-t-3xl"
            >
                {status ? (
                    <View className="flex-1 rounded-t-3xl overflow-hidden">
                        <View className="p-6 pt-8 absolute top-0 left-0 right-0 z-10" >
                            {/* Avatar, Nama, Lokasi */}
                            <View className="flex-row items-center gap-1">
                                <TouchableOpacity activeOpacity={0.8} onPress={() => status && openProfile(status.id)}>
                                    <Image
                                        source={{ uri: status?.avatarUrl }} resizeMode="cover"
                                        className="h-14 w-14 rounded-full border-2 border-yellow-400"
                                    />
                                </TouchableOpacity>
                                <View className="ml-4 flex-1">
                                    <View className="flex-row justify-between items-baseline">
                                        <View className="flex-row items-center">
                                            <TouchableOpacity activeOpacity={0.8} onPress={() => status && openProfile(status.id)}>
                                                <Text className="text-lg font-bold text-white shadow-sm">
                                                    {status.name.split(' ')[0]}
                                                </Text>
                                            </TouchableOpacity>
                                            <Text className="ml-2 text-xs font-bold bg-white/30 px-2 py-1 rounded-full text-white">
                                                {formatTimeAgo(status.created_at, t)}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-sm text-neutral-200 mt-1 shadow-sm">
                                        📍 {getDistance(userLatitude!, userLongitude!, status.latitude, status.longitude)} - {status.location_name}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={handleClose} className="flex-row items-center space-x-2 bg-black/30 px-3 py-2 gap-1 rounded-full">
                                    <AntDesign name="close" size={22} color="white" />
                                </TouchableOpacity>
                            </View>
                            {/* Baris kedua: viewer di pojok kiri bawah avatar, tombol akhiri
                            postingan di kanan -- tepat di bawah tombol close, rata kanan. */}
                            {(typeof status.viewCount === 'number' || onEndPost) && (
                                <View className="flex-row items-center justify-between mt-2">
                                    <View className="flex-1">
                                        {typeof status.viewCount === 'number' && (
                                            <TouchableOpacity
                                                onPress={() => openViewers(status.id)}
                                                activeOpacity={0.7}
                                                className="flex-row items-center bg-black/30 px-2.5 py-1 rounded-full self-start"
                                            >
                                                <Ionicons name="eye-outline" size={12} color="white" />
                                                <Text className="text-white text-xs font-bold ml-1">{status.viewCount}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    {onEndPost && (
                                        <TouchableOpacity
                                            onPress={() => onEndPost(status)}
                                            activeOpacity={0.8}
                                            className="flex-row items-center bg-red-500/90 px-3 py-2 gap-1 rounded-full"
                                        >
                                            <Ionicons name="stop-circle-outline" size={18} color="white" />
                                            <Text className="text-white text-xs font-bold">{t.endPostButton}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                        <View className="p-6 pt-8 absolute bottom-0 left-0 right-0 z-10" >
                            <View className="flex-row items-end justify-between mb-4">
                                <View className="flex-1 flex-col items-start mr-4 gap-y-1.5">
                                    {/* HARGA: Sekarang berada di atas caption dengan kontainer pas */}
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <View className="px-3 py-1 rounded-full" style={{ backgroundColor: status.color }}>
                                            <Text className="text-white text-xs font-semibold shadow-sm">
                                                {CATEGORIES.find(c => c.key === status.category)?.name}
                                            </Text>
                                        </View>
                                        {status.is_selling && status.price !== null && (
                                            <View className="bg-black/30 px-3 py-1 rounded-full">
                                                <Text className="text-white text-xs font-semibold shadow-sm">
                                                    {status.currency_symbol === 'Rp'
                                                        ? `${status.currency_symbol} ${status.price.toLocaleString('id-ID')}`
                                                        : `${status.currency_symbol} ${status.price.toLocaleString('en-US')}`
                                                    }
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    {status.is_selling && status.title !== null && (
                                        <Text className="text-base font-bold text-white shadow-sm w-full leading-5">
                                            {status.title}
                                        </Text>
                                    )}

                                    {/* CAPTION */}
                                    <Text className="text-base text-white shadow-sm w-full leading-5" >
                                        {status.caption}
                                    </Text>
                                </View>

                                <View className="items-center gap-2">
                                    <TouchableOpacity onPress={handleToggleLike} className="items-center justify-center bg-black/30 h-12 w-12 rounded-full">
                                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={25} color={isLiked ? '#ef4444' : '#E5E7EB'} />
                                        <Text style={{ fontSize: 9 }} className="text-white font-semibold shadow-sm">
                                            {likeCount}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity className="items-center space-x-2 bg-black/30 px-3 py-2 gap-1 rounded-full">
                                        <AntDesign name="share-alt" size={22} color="white" style={{ marginVertical: 2 }} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            {!isOwnStatus && (
                                <View className="flex-row items-center space-x-3 border-t border-neutral-200/30 pt-4 gap-3" >
                                    <View className="flex-1 flex-row items-center bg-black/40 rounded-full px-4 py-2">
                                        <TextInput
                                            placeholder={t.chat}
                                            placeholderTextColor="#FAFAFAFA" // Warna placeholder abu-abu terang
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
                            )}
                        </View>
                        <FlatList
                            data={status.statusImageUrls}
                            keyExtractor={(_, index) => `status-image-${index}`}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onViewableItemsChanged={onViewableItemsChanged}
                            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                            renderItem={({ item: imageSource }) => (
                                <ImageBackground
                                    source={toImageSource(imageSource)}
                                    resizeMode="contain"
                                    style={{ width: Dimensions.get('window').width }}
                                    className="flex-1"
                                >
                                    {/* Wrapper untuk mengatur layout konten di atas background */}
                                    <View className="flex-1 justify-between p-5 pt-8">

                                    </View>
                                </ImageBackground>
                            )}
                        />

                        {/* Indikator Halaman (Dots) */}
                        {status.statusImageUrls && status.statusImageUrls.length > 1 && (
                            <View className="absolute top-4 left-0 right-0 flex-row justify-center items-center px-4 space-x-1.5">
                                {status.statusImageUrls.map((_, index) => (
                                    <View
                                        key={`dot-${index}`}
                                        className={`h-1 rounded-full ${activeIndex === index ? 'bg-white' : 'bg-white/50'}`}
                                        style={{ flex: 1 }}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                ) : null}
            </BottomSheetView>
        </BottomSheet>
    );
}