import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { useLang } from '@/stores/lang.store';
import { useAuth } from '@/stores/auth.store';
import { useShowNavbar } from '@/stores/showNavBar.store';
import { ApiError } from '../api/types';
import locales from './locales';
import { getHelpTopic, HelpTopicDetail } from './api/show';
import { classifyHelpError, HelpErrorState } from './errorMessage';

const HelpDetailScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { lang } = useLang();
    const t = locales[lang].helpDetailScreen;
    const { setNavbar } = useShowNavbar();
    const { logout } = useAuth();

    const [topic, setTopic] = useState<HelpTopicDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<HelpErrorState | null>(null);

    // Hide the global floating navbar while this screen is open, and restore it on
    // back-navigation -- the cleanup return is what makes this correct (mirrors
    // `about/index.tsx`'s now-fixed pattern).
    useEffect(() => {
        setNavbar(false);
        return () => setNavbar(true);
    }, []);

    const loadTopic = useCallback(async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);
        setNotFound(false);

        try {
            const data = await getHelpTopic(id);
            setTopic(data);
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
                // Unknown id, or the topic was deactivated after the list was loaded.
                setNotFound(true);
            } else if (err instanceof ApiError && err.status === 401) {
                // Client already retried once after a token refresh (see client.ts) -- a 401
                // reaching here means the session is genuinely gone.
                logout();
                return;
            } else {
                setError(classifyHelpError(err, t));
            }
        } finally {
            setIsLoading(false);
        }
    }, [id, logout, t]);

    // `useFocusEffect` (not a plain `useEffect`) so returning to this screen (e.g. after a
    // transient failure) re-fetches -- same pattern as the list screen and
    // `profile/index.tsx`'s `loadProfile`.
    useFocusEffect(
        useCallback(() => {
            loadTopic();
        }, [loadTopic])
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
            <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100 shadow-sm z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="p-2 -ml-2 rounded-full active:bg-gray-100"
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text
                    className="text-xl font-extrabold text-gray-900 ml-3 tracking-tight flex-1"
                    numberOfLines={1}
                >
                    {topic?.title ?? t.title}
                </Text>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#FFD84D" />
                </View>
            ) : notFound ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="search-outline" size={40} color="#9CA3AF" />
                    <Text className="text-base font-bold text-gray-700 mt-3 text-center">{t.notFoundTitle}</Text>
                    <Text className="text-sm text-gray-500 mt-1 text-center">{t.notFoundMessage}</Text>
                </View>
            ) : error ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="alert-circle-outline" size={40} color="#9CA3AF" />
                    <Text className="text-base font-bold text-gray-700 mt-3 text-center">{error.title}</Text>
                    <Text className="text-sm text-gray-500 mt-1 text-center">{error.message}</Text>
                    <TouchableOpacity onPress={loadTopic} className="mt-5 px-5 py-2.5 rounded-full bg-primary">
                        <Text className="text-sm font-bold text-black">{t.retryButton}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
                    <Text className="text-2xl font-extrabold text-gray-900 tracking-tight">{topic?.title}</Text>
                    <Text className="text-base text-gray-700 mt-4 leading-7">{topic?.content}</Text>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default HelpDetailScreen;
