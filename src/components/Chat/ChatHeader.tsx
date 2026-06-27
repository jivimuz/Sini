import React from "react";

import {
    View,
    Text,
    TouchableOpacity,
    Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";

interface Props {

    name: string;

    avatar: string;

    online?: boolean;

    distance?: string;

}

export default function ChatHeader({

    name,

    avatar,

    online,

    distance,

}: Props) {

    return (

        <View
            className="
            pb-3
            px-5
            bg-[#FFFDF5]
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

            <Image
                source={{
                    uri: avatar,
                }}
                className="
                w-11
                h-11
                rounded-full
                ml-3
                "
            />

            <View className="ml-3 flex-1">

                <Text
                    className="
                    font-bold
                    text-lg
                    "
                >
                    {name}
                </Text>

                <Text
                    className="
                    text-xs
                    text-green-600
                    "
                >

                    {online
                        ? "Online"
                        : "Offline"}

                    {!!distance &&
                        ` • ${distance}`}

                </Text>

            </View>

            <TouchableOpacity>

                <Ionicons
                    name="location-outline"
                    size={22}
                />

            </TouchableOpacity>

            <TouchableOpacity
                className="ml-5"
            >

                <Ionicons
                    name="call-outline"
                    size={22}
                />

            </TouchableOpacity>

        </View>

    );

}