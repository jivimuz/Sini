import React, { useState } from "react";

import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const messages = [
    {
        id: "1",
        type: "text",
        sender: "other",
        text: "Lagi dimana?",
        time: "09:21",
    },
    {
        id: "2",
        type: "text",
        sender: "me",
        text: "Di Senayan nih 👀",
        time: "09:22",
    },
    {
        id: "3",
        type: "location",
        sender: "other",
        locationName: "Senayan City",
        distance: "120m",
        time: "09:23",
    },
    {
        id: "4",
        type: "text",
        sender: "me",
        text: "Otw kesana 🚗",
        time: "09:24",
    },
];

export default function ChatRoomScreen() {
    const [message, setMessage] = useState("");

    const renderMessage = ({ item }: any) => {
        if (item.type === "location") {
            return (
                <View className="mb-4 items-start">
                    <TouchableOpacity
                        className="
                        bg-white
                        rounded-[28px]
                        p-4
                        max-w-[80%]
                        "
                    >
                        <Text className="text-2xl">
                            📍
                        </Text>

                        <Text className="mt-2 font-semibold text-base">
                            {item.locationName}
                        </Text>

                        <Text className="mt-1 text-neutral-500">
                            {item.distance} dari kamu
                        </Text>

                        <TouchableOpacity
                            className="
                            mt-3
                            bg-[#FFD84D]
                            rounded-full
                            py-3
                            "
                        >
                            <Text className="text-center font-semibold">
                                Arahkan
                            </Text>
                        </TouchableOpacity>
                    </TouchableOpacity>

                    <Text className="text-xs text-neutral-400 mt-1 ml-2">
                        {item.time}
                    </Text>
                </View>
            );
        }

        return (
            <View
                className={`mb-4 ${item.sender === "me"
                    ? "items-end"
                    : "items-start"
                    }`}
            >
                <View
                    className={`
                    max-w-[80%]
                    px-4
                    py-3
                    rounded-[28px]
                    ${item.sender === "me"
                            ? "bg-[#FFD84D]"
                            : "bg-white"
                        }
                    `}
                >
                    <Text className="text-[15px] leading-6">
                        {item.text}
                    </Text>
                </View>

                <Text
                    className={`
                    text-xs
                    text-neutral-400
                    mt-1
                    ${item.sender === "me"
                            ? "mr-2"
                            : "ml-2"
                        }
                    `}
                >
                    {item.time}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-[#FFFDF5]"
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : undefined
            }
        >
            {/* HEADER */}

            <View
                className="
                pt-16
                px-5
                pb-4
                flex-row
                items-center
                "
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name="chevron-back"
                        size={28}
                    />
                </TouchableOpacity>

                <View
                    className="
                    ml-3
                    w-12
                    h-12
                    rounded-full
                    bg-[#FFE98A]
                    "
                />

                <View className="ml-3 flex-1">
                    <Text className="font-bold text-lg">
                        Sarah
                    </Text>

                    <Text className="text-xs text-green-500">
                        ● Online • 120m
                    </Text>
                </View>

                <TouchableOpacity>
                    <Ionicons
                        name="call-outline"
                        size={22}
                    />
                </TouchableOpacity>
            </View>

            {/* CHAT */}

            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                className="flex-1 px-4"
                contentContainerStyle={{
                    paddingTop: 10,
                    paddingBottom: 20,
                }}
                showsVerticalScrollIndicator={false}
            />

            {/* QUICK ACTION */}

            <View className="px-4 pb-3">
                <View className="flex-row mb-3">
                    <TouchableOpacity
                        className="
                        bg-white
                        rounded-full
                        px-4
                        py-2
                        mr-2
                        "
                    >
                        <Text>
                            📍 Lokasi
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="
                        bg-white
                        rounded-full
                        px-4
                        py-2
                        mr-2
                        "
                    >
                        <Text>
                            📸 Kamera
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="
                        bg-white
                        rounded-full
                        px-4
                        py-2
                        "
                    >
                        <Text>
                            😊 Status
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* INPUT */}

                <View
                    className="
                    bg-white
                    rounded-full
                    px-3
                    py-2
                    flex-row
                    items-center
                    "
                >
                    <TouchableOpacity>
                        <Ionicons
                            name="camera-outline"
                            size={22}
                        />
                    </TouchableOpacity>

                    <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Tulis pesan..."
                        className="flex-1 px-3"
                    />

                    <TouchableOpacity
                        className="
                        w-10
                        h-10
                        rounded-full
                        bg-[#FFD84D]
                        items-center
                        justify-center
                        "
                    >
                        <Ionicons
                            name="send"
                            size={18}
                            color="#000"
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}