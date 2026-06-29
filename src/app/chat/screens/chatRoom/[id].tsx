import React, { useEffect, useRef } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    FlatList,
    View,
    ImageBackground,
} from "react-native";

import { useLocalSearchParams } from "expo-router";

import ChatHeader from "@/components/Chat/ChatHeader";
import MessageBubble from "@/components/Chat/MessageBubble";
import LocationBubble from "@/components/Chat/LocationBubble";
import DateSeparator from "@/components/Chat/DateSeparator";
import TypingIndicator from "@/components/Chat/TypingIndicator";
import ChatInput from "@/components/Chat/ChatInput";
import AttachmentSheet from "@/components/Chat/AttachmentSheet";

import { ChatMessage } from "../../types/chat.type";
import { useChatStore } from "../../stores/chat.store";
import { useShowNavbar } from "@/stores/showNavBar.store";
import { useUserStore } from "@/stores/user.store";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatRoomScreen() {
    // Asumsikan ID pengguna saat ini adalah "1" (sebaiknya diambil dari state/auth)
    const currentUserId = "1";
    const { id: otherUserId } = useLocalSearchParams<{ id: string }>();

    const {
        messages,
        typing,
        sendMessage,
        sendLocation,
    } = useChatStore();

    const { getUserById } = useUserStore();

    const otherUser = getUserById(otherUserId ?? "");

    const flatListRef = useRef<FlatList>(null);

    const { setNavbar } = useShowNavbar();

    useEffect(() => {
        setNavbar(false);

        return () => setNavbar(true);
    }, []);

    useEffect(() => {
        flatListRef.current?.scrollToEnd({
            animated: true,
        });
    }, [messages]);

    const renderItem = ({ item }: { item: ChatMessage }) => {
        if (item.type === "date") {
            return (
                <DateSeparator
                    title={item.label ?? ""}
                    key={item.id}
                />
            );
        }

        // [FIX] Pengecekan ini penting untuk mencegah crash jika data lokasi tidak lengkap
        if (item.type === "location" && item.location?.latitude && item.location?.longitude) {
            return (
                <LocationBubble
                    title={item.location.title ?? "Lokasi Berbagi"}
                    latitude={item.location.latitude}
                    longitude={item.location.longitude}
                    distance={item.location.distance ?? ""}
                    isMe={item.senderId === currentUserId}
                    onPress={() => console.log("TODO: Implement route view")}
                />
            );
        }

        return (
            <MessageBubble
                message={item}
                isMe={item.senderId === currentUserId}
                onLongPress={(message) => {
                    console.log(message);
                }}
            />
        );
    };

    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        // keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >

            {/* 2. SafeAreaView hanya membungkus Header agar teks jam/baterai hp aman */}
            <SafeAreaView edges={['top']} className="bg-white shadow-sm">
                <ChatHeader
                    name={otherUser?.name ?? "Udin"}
                    avatar={otherUser?.avatarUrl ?? "https://randomuser.me/api/portraits/men/1.jpg"}
                    online={otherUser?.is_live}
                />
            </SafeAreaView>
            <ImageBackground
                source={require("@/../assets/images/bg-chat.jpeg")}
                className="flex-1"
                resizeMode="cover"
            >
                {/* 3. FlatList otomatis menciut karena flex-1 */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    className="flex-1"
                    contentContainerStyle={{
                        padding: 16,
                        paddingBottom: 20,
                    }}
                    showsVerticalScrollIndicator={false}
                />

                {typing && (
                    <TypingIndicator />
                )}

                {/* 4. ChatInput akan menempel tepat di atas keyboard */}
                <ChatInput
                    onSend={sendMessage}
                />

                <AttachmentSheet
                    onSendLocation={sendLocation}
                />
            </ImageBackground>
        </KeyboardAvoidingView>
    );
}