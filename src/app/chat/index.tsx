import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import locales from "./locales";
import { useLang } from "@/stores/lang.store";
import { router } from "expo-router";

const chats = [
    {
        id: "1",
        name: "Udin",
        message: "Lagi ngopi ☕",
        unread: 2,
        time: "2m",
    },
    {
        id: "2",
        name: "Jivi",
        message: "Sampai rumah?",
        unread: 0,
        time: "1h",
    },
    {
        id: "3",
        name: "Budi",
        message: "Otw 🚗",
        unread: 0,
        time: "3h",
    },
];

export default function ChatScreen() {
    const { lang } = useLang();
    const t = locales[lang].ChatScreen.chatList;

    const handleChatPress = (id: string) => {
        // Gunakan format string langsung + 'as any' untuk melewati pengecekan TS sementara
        router.navigate(`/chat/screens/chatRoom/${id}` as any);
    };
    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
            <View className="flex-row justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                <View>
                    <Text className="text-2xl font-bold text-neutral-800">{t.title}</Text>
                    <Text className="text-base text-neutral-500">{t.subtitle}</Text>
                </View>
                <TouchableOpacity
                    className="h-12 w-12 items-center justify-center rounded-full bg-white border border-gray-200"
                >
                    <Ionicons name="search" size={22} color="#132648" />
                </TouchableOpacity>
            </View>



            {/* CHAT LIST */}

            <FlatList className="mt-6" data={chats} keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleChatPress(item.id)} className="
                        mx-5
                        mb-2
                        p-2
                        rounded-3xl
                        flex-row
                        items-center
                        ">
                        <View className="
                            w-14
                            h-14
                            rounded-full
                            bg-[#FFE98A]
                            " />

                        <View className="ml-4 flex-1">
                            <Text className="font-semibold">
                                {item.name}
                            </Text>

                            <Text numberOfLines={1} className="text-neutral-500">
                                {item.message}
                            </Text>
                        </View>

                        <View className="items-end">
                            <Text className="text-xs text-neutral-400">
                                {item.time}
                            </Text>

                            {item.unread > 0 && (
                                <View className="
                                    mt-2
                                    min-w-6
                                    h-6
                                    px-2
                                    rounded-full
                                    bg-[#FFD84D]
                                    items-center
                                    justify-center
                                    ">
                                    <Text className="text-xs font-bold">
                                        {item.unread}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView >
    );
}