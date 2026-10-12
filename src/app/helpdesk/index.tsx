import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Lang, useLang } from '@/stores/lang.store';
import { useAuth } from '@/stores/auth.store';
import { useShowNavbar } from '@/stores/showNavBar.store';
import Toast from '@/utils/Toast';
import { ApiError } from '../api/types';
import locales from './locales';
import { listMyTickets, HelpdeskTicket } from './api/list';
import { classifyHelpdeskError, HelpdeskErrorState } from './errorMessage';

// Matches the backend's exact status strings (see
// `Sini-Backend/app/Http/Controllers/Admin/HelpdeskController.php` `STATUSES` const) --
// any other value falls through to the grey "unknown" style in `StatusBadge` below.
const statusStyles: Record<string, { bg: string; text: string }> = {
    Open: { bg: 'bg-blue-100', text: 'text-blue-700' },
    Progress: { bg: 'bg-amber-100', text: 'text-amber-700' },
    Review: { bg: 'bg-purple-100', text: 'text-purple-700' },
    Finished: { bg: 'bg-green-100', text: 'text-green-700' },
};

const StatusBadge = ({ status }: { status: string }) => {
    const style = statusStyles[status] ?? { bg: 'bg-gray-200', text: 'text-gray-600' };
    return (
        <View className={`px-2.5 py-1 rounded-full ${style.bg}`}>
            <Text className={`text-xs font-bold ${style.text}`}>{status}</Text>
        </View>
    );
};

const formatDate = (value: string, lang: Lang) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleDateString(lang === 'idID' ? 'id-ID' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const HelpdeskScreen = () => {
    const { lang } = useLang();
    const t = locales[lang].helpdeskScreen;
    const { setNavbar } = useShowNavbar();
    const { logout } = useAuth();

    const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<HelpdeskErrorState | null>(null);

    // Hide the global floating navbar every time this screen gains focus -- covers both the
    // first arrival from Profile and returning here from the create-ticket screen. Deliberately
    // has NO cleanup: a focus-effect cleanup runs on blur, and when navigating forward to
    // `/helpdesk/new` that screen's own mount effect (a child effect) runs before this list
    // screen's blur-triggered cleanup (a parent-level event fired by the navigator), so a
    // `setNavbar(true)` here would overwrite the create screen's `setNavbar(false)` and leave
    // the navbar visible on top of it. Calling `setNavbar(false)` again on every focus is
    // idempotent and harmless. Mirrors `help/index.tsx`.
    useFocusEffect(
        useCallback(() => {
            setNavbar(false);
        }, [])
    );

    // Restore the navbar only when this list screen itself unmounts entirely (i.e. the user
    // backs all the way out of the Helpdesk section), not on every blur.
    useEffect(() => {
        return () => setNavbar(true);
    }, []);

    const loadTickets = useCallback(async (isRefresh = false) => {
        try {
            const data = await listMyTickets();
            setTickets(data);
            setError(null);
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                // Client already retried once after a token refresh (see client.ts) -- a 401
                // reaching here means the session is genuinely gone.
                logout();
                return;
            }

            const classified = classifyHelpdeskError(err, t);

            // A background refresh failure shouldn't blank out a list that's already on
            // screen -- surface it as a toast and keep showing the previously loaded tickets.
            if (isRefresh) {
                Toast.error(classified.title, classified.message);
            } else {
                setError(classified);
            }
        } finally {
            if (!isRefresh) setIsLoading(false);
        }
    }, [logout, t]);

    // `useFocusEffect` (not a plain `useEffect`) so returning here from the create screen
    // refetches and the newly created ticket shows up immediately -- same pattern as
    // `help/index.tsx`'s `loadTopics`. The ref keeps the big loading spinner to the very first
    // load only, so returning to this screen later refreshes quietly instead of flashing it.
    const hasLoadedOnceRef = useRef(false);

    useFocusEffect(
        useCallback(() => {
            if (!hasLoadedOnceRef.current) setIsLoading(true);
            loadTickets().finally(() => {
                hasLoadedOnceRef.current = true;
            });
        }, [loadTickets])
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadTickets(true);
        setRefreshing(false);
    };

    const handleRetry = () => {
        setIsLoading(true);
        loadTickets();
    };

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
            ) : error && tickets.length === 0 ? (
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
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#9CA3AF" />}
                >
                    <TouchableOpacity
                        onPress={() => router.push('/helpdesk/new')}
                        activeOpacity={0.8}
                        className="flex-row items-center justify-center bg-primary rounded-xl py-3.5 mb-6"
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#171717" />
                        <Text className="text-black font-bold text-base ml-2">{t.newTicketButton}</Text>
                    </TouchableOpacity>

                    {tickets.length === 0 ? (
                        <View className="items-center justify-center py-16 px-8">
                            <Ionicons name="file-tray-outline" size={40} color="#9CA3AF" />
                            <Text className="text-base font-bold text-gray-700 mt-3 text-center">{t.emptyTitle}</Text>
                            <Text className="text-sm text-gray-500 mt-1 text-center">{t.emptyMessage}</Text>
                        </View>
                    ) : (
                        <View className="bg-white rounded-xl overflow-hidden">
                            {tickets.map((ticket, index) => (
                                <View
                                    key={ticket.id}
                                    className={`p-4 ${index < tickets.length - 1 ? 'border-b border-gray-100' : ''}`}
                                >
                                    <View className="flex-row items-center justify-between mb-1">
                                        <Text className="text-xs font-semibold text-gray-400">{ticket.no_ticket}</Text>
                                        <StatusBadge status={ticket.status} />
                                    </View>
                                    <Text className="text-base font-semibold text-gray-800" numberOfLines={2}>
                                        {ticket.title}
                                    </Text>
                                    <Text className="text-xs text-gray-400 mt-1">{formatDate(ticket.created_at, lang)}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default HelpdeskScreen;
