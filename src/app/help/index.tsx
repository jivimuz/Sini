import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { useLang } from '@/stores/lang.store';
import { useAuth } from '@/stores/auth.store';
import { useShowNavbar } from '@/stores/showNavBar.store';
import Toast from '@/utils/Toast';
import { ApiError } from '../api/types';
import locales from './locales';
import { listHelpTopics, HelpTopic } from './api/list';
import { classifyHelpError, HelpErrorState } from './errorMessage';

interface HelpTopicSection {
    category: string;
    topics: HelpTopic[];
}

// Topics already arrive sorted by `order` -- grouping preserves that order both across
// categories (first appearance wins the section's position) and within each category.
const groupByCategory = (topics: HelpTopic[]): HelpTopicSection[] => {
    const sections: HelpTopicSection[] = [];
    const sectionIndexByCategory = new Map<string, number>();

    topics.forEach((topic) => {
        const existingIndex = sectionIndexByCategory.get(topic.category);

        if (existingIndex === undefined) {
            sectionIndexByCategory.set(topic.category, sections.length);
            sections.push({ category: topic.category, topics: [topic] });
        } else {
            sections[existingIndex].topics.push(topic);
        }
    });

    return sections;
};

const HelpScreen = () => {
    const { lang } = useLang();
    const t = locales[lang].helpScreen;
    const { setNavbar } = useShowNavbar();
    const { logout } = useAuth();

    const [topics, setTopics] = useState<HelpTopic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<HelpErrorState | null>(null);

    // Hide the global floating navbar every time this screen gains focus -- covers both the
    // first arrival from Profile and returning here from the detail screen. Deliberately has
    // NO cleanup: a focus-effect cleanup runs on blur, and when navigating forward to
    // `/help/[id]` the detail screen's own mount effect (a child effect) runs before this
    // list screen's blur-triggered cleanup (a parent-level event fired by the navigator), so
    // a `setNavbar(true)` here would overwrite the detail screen's `setNavbar(false)` and
    // leave the navbar visible on top of the detail screen. Calling `setNavbar(false)` again
    // on every focus is idempotent and harmless.
    useFocusEffect(
        useCallback(() => {
            setNavbar(false);
        }, [])
    );

    // Restore the navbar only when this list screen itself unmounts entirely (i.e. the user
    // backs all the way out of the Help section), not on every blur -- that's what the
    // focus effect above intentionally no longer does.
    useEffect(() => {
        return () => setNavbar(true);
    }, []);

    const loadTopics = useCallback(async (isRefresh = false) => {
        try {
            const data = await listHelpTopics();
            setTopics(data);
            setError(null);
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                // Client already retried once after a token refresh (see client.ts) -- a 401
                // reaching here means the session is genuinely gone.
                logout();
                return;
            }

            const classified = classifyHelpError(err, t);

            // A background refresh failure shouldn't blank out a list that's already on
            // screen -- surface it as a toast and keep showing the previously loaded topics.
            if (isRefresh) {
                Toast.error(classified.title, classified.message);
            } else {
                setError(classified);
            }
        } finally {
            if (!isRefresh) setIsLoading(false);
        }
    }, [logout, t]);

    // `useFocusEffect` (not a plain `useEffect`) so re-opening this screen refreshes the
    // list, same pattern as `profile/index.tsx`'s `loadProfile` -- the ref keeps the big
    // loading spinner to the very first load only, so returning to this screen later
    // refreshes quietly instead of flashing the loader again.
    const hasLoadedOnceRef = useRef(false);

    useFocusEffect(
        useCallback(() => {
            if (!hasLoadedOnceRef.current) setIsLoading(true);
            loadTopics().finally(() => {
                hasLoadedOnceRef.current = true;
            });
        }, [loadTopics])
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadTopics(true);
        setRefreshing(false);
    };

    const handleRetry = () => {
        setIsLoading(true);
        loadTopics();
    };

    const sections = groupByCategory(topics);

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
            <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100 shadow-sm z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="p-2 -ml-2 rounded-full active:bg-gray-100"
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-xl font-extrabold text-gray-900 ml-3 tracking-tight">{t.title}</Text>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#FFD84D" />
                </View>
            ) : error && topics.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="alert-circle-outline" size={40} color="#9CA3AF" />
                    <Text className="text-base font-bold text-gray-700 mt-3 text-center">{error.title}</Text>
                    <Text className="text-sm text-gray-500 mt-1 text-center">{error.message}</Text>
                    <TouchableOpacity
                        onPress={handleRetry}
                        className="mt-5 px-5 py-2.5 rounded-full bg-primary"
                    >
                        <Text className="text-sm font-bold text-black">{t.retryButton}</Text>
                    </TouchableOpacity>
                </View>
            ) : topics.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="help-circle-outline" size={40} color="#9CA3AF" />
                    <Text className="text-base font-bold text-gray-700 mt-3 text-center">{t.emptyTitle}</Text>
                    <Text className="text-sm text-gray-500 mt-1 text-center">{t.emptyMessage}</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#9CA3AF" />}
                >
                    <View className="p-5">
                        {sections.map((section) => (
                            <View key={section.category} className="mb-6">
                                <Text className="text-sm font-bold text-gray-500 uppercase mb-2 px-2">
                                    {t.categories[section.category as keyof typeof t.categories] ?? section.category}
                                </Text>
                                <View className="bg-white rounded-xl overflow-hidden">
                                    {section.topics.map((topic, index) => (
                                        <TouchableOpacity
                                            key={topic.id}
                                            onPress={() => router.push(`/help/${topic.id}` as any)}
                                            activeOpacity={0.8}
                                            className={`flex-row items-center p-4 ${index < section.topics.length - 1 ? 'border-b border-gray-100' : ''}`}
                                        >
                                            <Text className="flex-1 text-base font-semibold text-gray-800" numberOfLines={2}>
                                                {topic.title}
                                            </Text>
                                            <Ionicons name="chevron-forward" size={20} color="#60646C" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default HelpScreen;
