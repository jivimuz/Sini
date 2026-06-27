import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import locales from "./locales";
import { useLang } from "@/stores/lang.store";
import { router } from "expo-router";
import { useEffect } from "react";
import { useShowNavbar } from "@/stores/showNavBar.store";

// Data chat tiruan yang disempurnakan dengan properti sender & online status
const chats = [
    {
        id: "1",
        name: "Udin",
        message: "Lagi ngopi ☕",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        unread: 3,
        time: "09:24",
        isOnline: true,
        lastMessageFromMe: false,
    },
    {
        id: "2",
        name: "Jivi",
        message: "Sampai rumah?",
        avatar: "https://randomuser.me/api/portraits/women/1.jpg",
        unread: 0,
        time: "Kemarin",
        isOnline: false,
        lastMessageFromMe: true,
    },
    {
        id: "3",
        name: "Budi",
        message: "Otw 🚗",
        avatar: "https://randomuser.me/api/portraits/men/2.jpg",
        unread: 0,
        time: "Selasa",
        isOnline: true,
        lastMessageFromMe: true,
    },
];

export default function ChatScreen() {
    const { lang } = useLang();
    const t = locales[lang].ChatScreen.chatList;
    const { setNavbar } = useShowNavbar();

    const handleChatPress = (id: string) => {
        router.navigate(`/chat/screens/chatRoom/${id}` as any);
    };

    useEffect(() => {
        if (setNavbar) setNavbar(true);
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>

            {/* HEADER UTAMA */}
            <View className="flex-row justify-between items-center px-5 py-4 border-b border-neutral-100">
                <View>
                    <Text className="text-2xl font-black text-neutral-900 tracking-tight">{t.title}</Text>
                    <Text className="text-xs font-medium text-neutral-400 mt-0.5">{t.subtitle}</Text>
                </View>
                <TouchableOpacity
                    activeOpacity={0.7}
                    className="h-10 w-10 items-center justify-center rounded-full bg-neutral-50 border border-neutral-100 shadow-sm"
                >
                    <Ionicons name="search" size={20} color="#4B5563" />
                </TouchableOpacity>
            </View>

            {/* DAFTAR CHAT */}
            <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                className="flex-1"
                contentContainerStyle={{ paddingVertical: 8 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => handleChatPress(item.id)}
                        activeOpacity={0.6}
                        className="flex-row items-center px-5 py-3.5 border-b border-neutral-50 active:bg-neutral-50"
                    >
                        {/* AREA AVATAR DENGAN BADGE ONLINE */}
                        <View className="relative">
                            <View className="w-13 h-13 rounded-full bg-[#FFE98A] items-center justify-center border border-amber-100 shadow-sm">
                                <Image
                                    source={{ uri: item.avatar }}
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
                                <Text className={`text-xs ${item.unread > 0 ? "text-amber-600 font-semibold" : "text-neutral-400"}`}>
                                    {item.time}
                                </Text>
                            </View>

                            <View className="flex-row items-center mt-1">
                                {/* Centang dua abu-abu khas WA jika pesan terakhir dari kita */}
                                {item.lastMessageFromMe && (
                                    <Ionicons name="checkmark-done" size={16} color="#9CA3AF" style={{ marginRight: 4 }} />
                                )}
                                <Text
                                    numberOfLines={1}
                                    className={`text-[14px] flex-1 ${item.unread > 0 ? "text-neutral-900 font-medium" : "text-neutral-400"}`}
                                >
                                    {item.message}
                                </Text>
                                {item.unread > 0 && (
                                    <View className="ml-2 min-w-5 h-5 px-1.5 rounded-full bg-[#FFD84D] items-center justify-center shadow-sm">
                                        <Text className="text-[11px] font-bold text-neutral-900">
                                            {item.unread}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* INDIKATOR JUMLAH PESAN BELUM DIBACA */}

                    </TouchableOpacity>
                )}
            />
        </SafeAreaView >
    );
}
