import React,
{
    useRef,
    useState,
} from "react";

import {
    View,
    TextInput,
    TouchableOpacity,
} from "react-native";

import BottomSheet from "@gorhom/bottom-sheet";

import { Ionicons } from "@expo/vector-icons";

import AttachmentSheet from "./AttachmentSheet";
import EmojiPicker from "./EmojiPicker";

type Props = {

    onSend: (text: string) => void;

    onSendLocation?: () => void;

    /** Called with true/false as the user starts/stops typing, for the typing-indicator broadcast. */
    onTypingChange?: (isTyping: boolean) => void;

};

export default function ChatInput({

    onSend,

    onSendLocation,

    onTypingChange,

}: Props) {

    const [text, setText] = useState("");

    const attachmentRef =
        useRef<BottomSheet>(null);

    const emojiRef =
        useRef<BottomSheet>(null);

    const typingTimeoutRef =
        useRef<ReturnType<typeof setTimeout> | null>(null);

    const isTypingRef =
        useRef(false);

    const handleChangeText = (value: string) => {
        setText(value);

        if (!onTypingChange) return;

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            onTypingChange(true);
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            onTypingChange(false);
        }, 2000);
    };

    const send = () => {

        if (!text.trim()) return;

        onSend(text);

        setText("");

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (isTypingRef.current) {
            isTypingRef.current = false;
            onTypingChange?.(false);
        }

    };
    const textInputRef = useRef<TextInput>(null);
    return (

        <>

            <View
                className="
                px-4
                py-3
                pb-7
                bg-white
                border-t
                border-neutral-200
                "
            >

                <View
                    className="
                    flex-row
                    items-end
                    "
                >

                    {/* Emoji */}

                    <TouchableOpacity
                        onPress={() =>
                            emojiRef.current?.expand()
                        }
                        className="pb-2 mr-3"
                    >
                        <Ionicons
                            name="happy-outline"
                            size={24}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {/* Input */}

                    <View
                        className="
                        flex-1
                        bg-neutral-100
                        rounded-3xl
                        px-4
                        py-2
                        flex-row
                        items-end
                        "
                    >

                        <TextInput
                            value={text}
                            ref={textInputRef}
                            onChangeText={handleChangeText}
                            placeholder="Tulis pesan..."
                            multiline
                            className="
                            flex-1
                            max-h-32
                            pb-2
                            "
                        />

                        <TouchableOpacity
                            onPress={() =>
                                attachmentRef.current?.expand()
                            }
                            className="ml-2 pb-1"
                        >
                            <Ionicons
                                name="attach"
                                size={22}
                                color="#666"
                            />
                        </TouchableOpacity>

                    </View>

                    {/* SEND / MIC */}

                    {text.trim() ? (

                        <TouchableOpacity
                            onPress={send}
                            className="
                            ml-3
                            w-12
                            h-12
                            rounded-full
                            bg-[#FFD84D]
                            items-center
                            justify-center
                            "
                        >

                            <Ionicons
                                name="send"
                                size={20}
                            />

                        </TouchableOpacity>

                    ) : (

                        <TouchableOpacity
                            className="
                            ml-3
                            w-12
                            h-12
                            rounded-full
                            bg-[#FFD84D]
                            items-center
                            justify-center
                            "
                        >

                            <Ionicons
                                name="mic"
                                size={20}
                            />

                        </TouchableOpacity>

                    )}

                </View>

            </View>

            <AttachmentSheet
                ref={attachmentRef}
                onSendLocation={onSendLocation}
            />

            <EmojiPicker
                ref={emojiRef}
                inputRef={textInputRef as React.RefObject<TextInput>}
                onSelect={(emoji) => setText((prev) => prev + emoji)}

            />

        </>

    );

}