import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, FlatList, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useLang } from '@/stores/lang.store';
import locales from '../../locales';
import { getPostViewers, PostViewer } from '../../_api/viewers';
import { useViewersStore } from '../../stores/viewers.store';

const DEFAULT_AVATAR = require('@/../assets/images/default-user.png');

/** Sama seperti helper waktu-relatif di StatusBottomSheet/chat, tapi lokal untuk sheet ini. */
const formatViewedAgo = (iso: string, t: typeof locales['idID']['viewersSheet']) => {
    const diffInSeconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diffInSeconds < 60) return t.justNow;
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes} ${t.minute} ${t.past}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${t.hour} ${t.past}`;
    const days = Math.floor(hours / 24);
    return `${days} ${t.day} ${t.past}`;
};

/**
 * Drawer "Dilihat Oleh" untuk pemilik postingan -- mirip tata letak daftar penonton Status
 * WhatsApp (avatar + nama + waktu dilihat), dibuka dari badge "N dilihat" di ActivePostView.
 */
const ViewersBottomSheet = () => {
    const sheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['60%'], []);
    const { lang } = useLang();
    const t = locales[lang].viewersSheet;
    const { viewersPostId: postId, closeViewers } = useViewersStore();

    const [viewers, setViewers] = useState<PostViewer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!postId) {
            sheetRef.current?.close();
            return;
        }

        requestAnimationFrame(() => sheetRef.current?.snapToIndex(0));

        setIsLoading(true);
        setHasError(false);
        getPostViewers(postId)
            .then(setViewers)
            .catch(() => setHasError(true))
            .finally(() => setIsLoading(false));
    }, [postId]);

    return (
        <BottomSheet
            ref={sheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={closeViewers}
            handleIndicatorStyle={{ backgroundColor: '#E5E7EB' }}
        >
            <BottomSheetView className="flex-1 px-5 pt-2">
                <Text className="text-lg font-bold text-neutral-800 mb-4">{t.title}</Text>

                {isLoading ? (
                    <View className="py-8 items-center">
                        <ActivityIndicator color="#FFD84D" />
                    </View>
                ) : hasError ? (
                    <Text className="text-neutral-400 text-center py-8">{t.loadError}</Text>
                ) : viewers.length === 0 ? (
                    <Text className="text-neutral-400 text-center py-8">{t.empty}</Text>
                ) : (
                    <FlatList
                        data={viewers}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View className="flex-row items-center py-2.5">
                                <Image
                                    source={item.avatarUrl ? { uri: item.avatarUrl } : DEFAULT_AVATAR}
                                    className="h-11 w-11 rounded-full"
                                />
                                <View className="ml-3 flex-1">
                                    <Text className="font-semibold text-neutral-800">{item.name}</Text>
                                    <Text className="text-xs text-neutral-400 mt-0.5">{formatViewedAgo(item.viewedAt, t)}</Text>
                                </View>
                            </View>
                        )}
                    />
                )}
            </BottomSheetView>
        </BottomSheet>
    );
};

export default ViewersBottomSheet;
