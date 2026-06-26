import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

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
    return (
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>

            <View className="flex-1 bg-[#FFFDF5]">
                {/* HEADER */}

                <View className="px-5 pt-16">
                    <Text className="text-3xl font-bold">
                        Chat
                    </Text>
                </View>

                {/* SEARCH */}

                <TouchableOpacity className="
                mx-5
                mt-5
                h-12
                bg-white
                rounded-full
                px-4
                flex-row
                items-center
                ">
                    <Ionicons name="search" size={18} />

                    <Text className="ml-2 text-neutral-400">
                        Cari teman...
                    </Text>
                </TouchableOpacity>

                {/* ACTIVE USERS */}

                <View className="mt-6">
                    <Text className="px-5 font-semibold">
                        Nearby Active
                    </Text>

                    <FlatList horizontal showsHorizontalScrollIndicator={false} className="mt-4 pl-5" data={[1, 2, 3, 4, 5, 6]}
                        renderItem={() => (
                            <View className="mr-4 items-center">
                                <View className="
                                w-16
                                h-16
                                rounded-full
                                bg-[#FFE98A]
                                " />

                                <Text className="mt-2 text-xs">
                                    Udin
                                </Text>
                            </View>
                        )}
                    />
                </View>

                {/* CHAT LIST */}

                <FlatList className="mt-6" data={chats} keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => router.push(`/chat/screens/chatRoom/${item.id}`)} className="
                        mx-5
                        mb-3
                        p-4
                        bg-white
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
            </View>
        </SafeAreaView>
    );
}