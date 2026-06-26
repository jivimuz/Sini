import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useLang } from "@/stores/lang.store";
import locales from "./locales";
import { SafeAreaView } from "react-native-safe-area-context";

const nearbyUsers = [
    {
        id: "1",
        name: "Jivi",
        distance: "120m",
        status: "Ngopi ☕",
    },
    {
        id: "2",
        name: "Iwan",
        distance: "240m",
        status: "Shopping 🛍️",
    },
    {
        id: "3",
        name: "Budi",
        distance: "350m",
        status: "Makan 🍜",
    },
];

export default function NearbyScreen() {
    const { lang } = useLang();
    const t = locales[lang].nearbyScreen;

    return (
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>

            <View className="flex-1 bg-[#FFFDF5]">

                <View className="px-5 pt-16 pb-4">
                    <Text className="text-3xl font-bold"
                    >
                        {t.title}
                    </Text>

                    <Text className="mt-1 text-neutral-500"
                    >
                        {t.subtitle}
                    </Text>
                </View>

                <TouchableOpacity
                    className="
                mx-5
                h-12
                bg-white
                rounded-full
                px-4
                flex-row
                items-center
                "
                >
                    <Ionicons
                        name="search"
                        size={18}
                    />

                    <Text className="ml-2 text-neutral-400"
                    >
                        {t.searchPlaceholder}
                    </Text>
                </TouchableOpacity>

                <View className="px-5 mt-6">
                    <Text className="font-semibold text-lg"
                    >
                        {t.popularNow}
                    </Text>
                </View>

                <FlatList
                    className="mt-3"
                    data={nearbyUsers}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            className="
                        bg-white
                        mx-5
                        mb-3
                        rounded-3xl
                        p-4
                        flex-row
                        items-center
                        "
                        >
                            <View
                                className="
                            w-14
                            h-14
                            rounded-full
                            bg-[#FFE98A]
                            items-center
                            justify-center
                            "
                            >
                                <Text className="font-bold">
                                    {item.name[0]}
                                </Text>
                            </View>

                            <View className="ml-4 flex-1">
                                <Text className="font-semibold text-base">
                                    {item.name}
                                </Text>

                                <Text className="text-neutral-500">
                                    {item.status}
                                </Text>
                            </View>

                            <View
                                className="
                            bg-[#FFF4B8]
                            px-3
                            py-2
                            rounded-full
                            "
                            >
                                <Text className="font-medium">
                                    {item.distance}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}