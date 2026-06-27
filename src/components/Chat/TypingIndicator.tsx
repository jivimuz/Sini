import React from "react";

import {
    View,
} from "react-native";

export default function TypingIndicator() {

    return (

        <View
            className="
            mb-4
            items-start
            "
        >

            <View
                className="
                bg-white
                px-5
                py-4
                rounded-full
                flex-row
                "
            >

                <View className="w-2 h-2 rounded-full bg-neutral-400 mr-2" />

                <View className="w-2 h-2 rounded-full bg-neutral-400 mr-2" />

                <View className="w-2 h-2 rounded-full bg-neutral-400" />

            </View>

        </View>

    );

}