import React from "react";

import {
    View,
    Text,
    TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { ChatMessage } from "@/app/chat/types/chat.type";


interface Props {

    message: ChatMessage;

    isMe: boolean;

    onLongPress?: (
        message: ChatMessage
    ) => void;

}

export default function MessageBubble({

    message,

    isMe,

    onLongPress,

}: Props) {

    return (

        <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => onLongPress?.(message)}
            className={`mb-3 ${isMe
                ? "items-end"
                : "items-start"
                }`}
        >

            <View
                className={`
                px-4
                py-3
                max-w-[78%]

                ${isMe
                        ? "bg-[#FFD84D] rounded-t-3xl rounded-l-3xl rounded-br-md"
                        : "bg-white rounded-t-3xl rounded-r-3xl rounded-bl-md"
                    }
                `}
            >

                {!!message.text && (

                    <Text
                        className="
                        text-[15px]
                        text-neutral-800
                        leading-6
                        "
                    >
                        {message.text}
                    </Text>

                )}

                <View
                    className="
                    flex-row
                    items-center
                    self-end
                    mt-2
                    "
                >

                    <Text
                        className="
                        text-[10px]
                        text-neutral-500
                        "
                    >
                        {message.createdAt}
                    </Text>

                    {isMe && (

                        <Ionicons
                            style={{
                                marginLeft: 4,
                            }}
                            name={
                                message.seen
                                    ? "checkmark-done"
                                    : "checkmark"
                            }
                            size={14}
                            color={
                                message.seen
                                    ? "#2BA6FF"
                                    : "#777"
                            }
                        />

                    )}

                </View>

            </View>

        </TouchableOpacity>

    );

}