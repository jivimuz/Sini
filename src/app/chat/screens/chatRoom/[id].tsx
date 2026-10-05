import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    FlatList,
    ActivityIndicator,
    View,
    ImageBackground,
} from "react-native";
import * as Location from "expo-location";

import { useFocusEffect, useLocalSearchParams } from "expo-router";

import ChatHeader from "@/components/Chat/ChatHeader";
import MessageBubble from "@/components/Chat/MessageBubble";
import LocationBubble from "@/components/Chat/LocationBubble";
import DateSeparator from "@/components/Chat/DateSeparator";
import TypingIndicator from "@/components/Chat/TypingIndicator";
import ChatInput from "@/components/Chat/ChatInput";
import Toast from "@/utils/Toast";

import { ChatMessage } from "../../types/chat.type";
import { useChatStore } from "../../stores/chat.store";
import { useShowNavbar } from "@/stores/showNavBar.store";
import { useCurrentUser } from "@/stores/currentUser.store";
import { sendTypingStatus } from "../../api/typing";
import { SafeAreaView } from "react-native-safe-area-context";

const dayLabel = (iso: string): string => {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    if (isSameDay(date, today)) return "Hari ini";
    if (isSameDay(date, yesterday)) return "Kemarin";
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

/** Interleaves "Hari ini"/"Kemarin"/date-label separator rows between messages from different days. */
const withDateSeparators = (messages: ChatMessage[]): ChatMessage[] => {
    const result: ChatMessage[] = [];
    let lastLabel: string | null = null;

    for (const message of messages) {
        if (message.createdAtIso) {
            const label = dayLabel(message.createdAtIso);
            if (label !== lastLabel) {
                result.push({ id: `date-${message.id}`, senderId: "", receiverId: "", type: "date", label, createdAt: "", seen: true });
                lastLabel = label;
            }
        }
        result.push(message);
    }

    return result;
};

export default function ChatRoomScreen() {
    const { id: conversationId } = useLocalSearchParams<{ id: string }>();

    const {
        conversations,
        messagesByConversation,
        typingByConversation,
        loadMessages,
        sendMessage,
        sendLocation,
        markRead,
        setActiveConversation,
        ensureRealtimeSubscriptions,
    } = useChatStore();

    const { customer } = useCurrentUser();

    const conversation = conversations.find((c) => c.id === conversationId);
    const messages = messagesByConversation[conversationId ?? ""] ?? [];
    const isOtherTyping = !!typingByConversation[conversationId ?? ""];

    const [isLoading, setIsLoading] = useState(true);
    const [isSendingLocation, setIsSendingLocation] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const { setNavbar } = useShowNavbar();

    useEffect(() => {
        setNavbar(false);
        return () => setNavbar(true);
    }, []);

    // Marks this conversation as the one currently open (chat.store skips bumping its unread
    // count locally while focused) and clears unread/read_at on the server when entering.
    useFocusEffect(
        useCallback(() => {
            if (!conversationId) return;
            setActiveConversation(conversationId);
            markRead(conversationId).catch(() => { });

            return () => setActiveConversation(null);
        }, [conversationId])
    );

    useEffect(() => {
        if (!conversationId) return;
        setIsLoading(true);
        // The list screen normally already holds this conversation's channel subscription,
        // but a deep link straight into a room (or a cold start) might not have loaded the
        // list yet -- this call is a no-op for conversations already subscribed.
        ensureRealtimeSubscriptions();
        loadMessages(conversationId).finally(() => setIsLoading(false));
    }, [conversationId]);

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages.length]);

    const displayMessages = useMemo(() => withDateSeparators(messages), [messages]);

    const handleSend = (text: string) => {
        if (!conversationId || !conversation?.otherCustomerId) return;
        sendMessage(conversationId, conversation.otherCustomerId, text).catch(() => {
            Toast.error("Gagal mengirim pesan", "Periksa koneksi dan coba lagi.");
        });
    };

    const handleTypingChange = (isTyping: boolean) => {
        if (!conversationId || !conversation?.otherCustomerId) return;
        sendTypingStatus({ conversationId, receiverId: conversation.otherCustomerId, isTyping }).catch(() => { });
    };

    const handleSendLocation = async () => {
        if (!conversationId || !conversation?.otherCustomerId) return;

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Toast.info("Izin Diperlukan", "Anda perlu memberikan izin lokasi untuk membagikan lokasi.");
            return;
        }

        setIsSendingLocation(true);
        try {
            const position = await Location.getCurrentPositionAsync();
            await sendLocation(
                conversationId,
                conversation.otherCustomerId,
                { latitude: position.coords.latitude, longitude: position.coords.longitude },
                customer?.name ? `Lokasi ${customer.name}` : "Lokasi Saya"
            );
        } catch {
            Toast.error("Gagal membagikan lokasi", "Periksa koneksi dan coba lagi.");
        } finally {
            setIsSendingLocation(false);
        }
    };

    const renderItem = ({ item }: { item: ChatMessage }) => {
        if (item.type === "date") {
            return <DateSeparator title={item.label ?? ""} key={item.id} />;
        }

        if (item.type === "location" && item.location?.latitude && item.location?.longitude) {
            return (
                <LocationBubble
                    title={item.location.title ?? "Lokasi Berbagi"}
                    latitude={item.location.latitude}
                    longitude={item.location.longitude}
                    distance={item.location.distance ?? ""}
                    isMe={item.senderId === customer?.id}
                    time={item.createdAt}
                />
            );
        }

        return <MessageBubble message={item} isMe={item.senderId === customer?.id} />;
    };

    return (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <SafeAreaView edges={["top"]} className="bg-white shadow-sm">
                <ChatHeader
                    name={conversation?.name ?? "..."}
                    avatar={conversation?.avatarUrl}
                    online={conversation?.isOnline}
                />
            </SafeAreaView>
            <ImageBackground
                source={require("@/../assets/images/bg-chat.jpeg")}
                className="flex-1"
                resizeMode="cover"
            >
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#FFD84D" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={displayMessages}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        className="flex-1"
                        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {isOtherTyping && <TypingIndicator />}

                <ChatInput
                    onSend={handleSend}
                    onSendLocation={isSendingLocation ? undefined : handleSendLocation}
                    onTypingChange={handleTypingChange}
                />
            </ImageBackground>
        </KeyboardAvoidingView>
    );
}
