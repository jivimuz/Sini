import React from "react";
import {
    View,
    Text,
} from "react-native";

import Toast, {
    BaseToastProps,
} from "react-native-toast-message";

import {
    Ionicons,
} from "@expo/vector-icons";

function ToastCard({
    icon,
    color,
    title,
    message,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    title: string;
    message?: string;
}) {
    return (
        <View
            className="
            w-[92%]
            self-center
            bg-white
            rounded-3xl
            px-5
            py-4
            flex-row
            items-center
            shadow-lg
            "
            style={{
                elevation: 10,
            }}
        >
            <View
                className="
                w-12
                h-12
                rounded-full
                items-center
                justify-center
                "
                style={{
                    backgroundColor: color,
                }}
            >
                <Ionicons
                    name={icon}
                    size={22}
                    color="#fff"
                />
            </View>

            <View className="ml-4 flex-1">
                <Text className="font-bold text-base text-neutral-900">
                    {title}
                </Text>

                {!!message && (
                    <Text className="text-neutral-500 mt-1">
                        {message}
                    </Text>
                )}
            </View>
        </View>
    );
}

export const toastConfig = {
    success: ({ text1, text2 }: BaseToastProps) => (
        <ToastCard
            icon="checkmark"
            color="#22C55E"
            title={text1 ?? ""}
            message={text2}
        />
    ),

    error: ({ text1, text2 }: BaseToastProps) => (
        <ToastCard
            icon="close"
            color="#EF4444"
            title={text1 ?? ""}
            message={text2}
        />
    ),

    info: ({ text1, text2 }: BaseToastProps) => (
        <ToastCard
            icon="information"
            color="#FFD84D"
            title={text1 ?? ""}
            message={text2}
        />
    ),

    warning: ({ text1, text2 }: BaseToastProps) => (
        <ToastCard
            icon="warning"
            color="#F59E0B"
            title={text1 ?? ""}
            message={text2}
        />
    ),
};

export default {
    success(title: string, message?: string) {
        Toast.show({
            type: "success",
            text1: title,
            text2: message,
            position: "top",
            topOffset: 70,
            visibilityTime: 2500,
        });
    },

    error(title: string, message?: string) {
        Toast.show({
            type: "error",
            text1: title,
            text2: message,
            position: "top",
            topOffset: 70,
            visibilityTime: 2500,
        });
    },

    info(title: string, message?: string) {
        Toast.show({
            type: "info",
            text1: title,
            text2: message,
            position: "top",
            topOffset: 70,
            visibilityTime: 2500,
        });
    },

    warning(title: string, message?: string) {
        Toast.show({
            type: "warning",
            text1: title,
            text2: message,
            position: "top",
            topOffset: 70,
            visibilityTime: 2500,
        });
    },
};