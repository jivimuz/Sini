import React, { useMemo } from "react";
import BottomSheet, {
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Keyboard,
    TextInput, // Tambah import TextInput untuk tipe data ref
} from "react-native";

type Props = {
    onSelect: (emoji: string) => void;
    inputRef: React.RefObject<TextInput>; // 1. Tambahkan properti referensi input
};

const emojis = [
    "😀", "😂", "🤣", "😍", "🥰", "😘",
    "😎", "🤩", "🥳", "😭", "😡", "🤯",
    "👍", "👏", "🙏", "🔥", "❤️", "💛",
    "🤍", "💙", "💚", "💜", "🤎", "🖤",
    "😅", "🤔", "🙄", "😴", "🥺", "😇",
    "🐶", "🐱", "🎉", "🎂", "☕", "🍔",
    "🚗", "📍", "📸", "🌧️", "🌈", "⚽",
    "🎮", "🎵", "🎬", "✈️", "🏖️", "🏠",
];

const EmojiPicker = React.forwardRef<BottomSheet, Props>(
    ({ onSelect, inputRef }, ref) => {

        const snapPoints = useMemo(
            () => ["45%"],
            []
        );

        const handleEmojiPress = (emoji: string) => {
            onSelect(emoji);

            // 2. Tutup modal emoji terlebih dahulu
            if (ref && "current" in ref && ref.current) {
                ref.current.close();
            }

            // 3. KUNCI UTAMA: Berikan jeda 150ms agar animasi modal menutup selesai, 
            // lalu panggil fokus ke input agar keyboard otomatis mencuat naik.
            setTimeout(() => {
                inputRef.current?.focus();
            }, 150);
        };

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                onAnimate={(fromIndex, toIndex) => {
                    if (toIndex >= 0) {
                        Keyboard.dismiss();
                    }
                }}
            >
                <BottomSheetView className="flex-1">
                    <View className="px-5 py-3">
                        <Text className="text-lg font-bold">
                            Emoji
                        </Text>
                    </View>

                    <FlatList
                        data={emojis}
                        numColumns={6}
                        keyExtractor={(item, index) => index.toString()}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => handleEmojiPress(item)}
                                className="flex-1 items-center justify-center py-4"
                            >
                                <Text className="text-3xl">
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </BottomSheetView>
            </BottomSheet>
        );
    });

export default EmojiPicker;
