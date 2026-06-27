import React,
{
    forwardRef,
} from "react";

import BottomSheet,
{
    BottomSheetView,
} from "@gorhom/bottom-sheet";

import {
    View,
    Text,
    TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

const Item = ({
    icon,
    color,
    title,
    onPress,
}: any) => (

    <TouchableOpacity
        className="
        items-center
        w-20
        "
        onPress={onPress}
    >

        <View
            className="
            w-16
            h-16
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
                size={28}
                color="white"
            />

        </View>

        <Text
            className="
            mt-2
            text-xs
            text-center
            "
        >
            {title}
        </Text>

    </TouchableOpacity>

);

type Props = {
    onSendLocation?: () => void;
    // Tambahkan prop untuk fungsi lain di sini, contoh: onSendImage?: () => void;
};

const AttachmentSheet = forwardRef<BottomSheet, Props>(
    ({ onSendLocation }, ref) => {

        return (

            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={["25%"]}
                enablePanDownToClose
            >

                <BottomSheetView
                    className="
                    flex-1
                    px-6
                    pt-5
                    "
                >

                    <View
                        className="
                        flex-row
                        justify-between
                        "
                    >

                        <Item
                            icon="image"
                            color="#34D399"
                            title="Gallery"
                        />

                        <Item
                            icon="camera"
                            color="#3B82F6"
                            title="Camera"
                        />

                        <Item
                            icon="location"
                            color="#F97316"
                            title="Location"
                            onPress={onSendLocation}
                        />

                        <Item
                            icon="navigate"
                            color="#A855F7"
                            title="Route"
                        />

                    </View>

                    <View
                        className="
                        flex-row
                        justify-between
                        mt-8
                        "
                    >

                        <Item
                            icon="document"
                            color="#F59E0B"
                            title="Document"
                        />

                        <Item
                            icon="person"
                            color="#EC4899"
                            title="Contact"
                        />

                        <Item
                            icon="happy"
                            color="#06B6D4"
                            title="Sticker"
                        />

                        <View className="w-20" />

                    </View>

                </BottomSheetView>

            </BottomSheet>

        );

    },
);

export default AttachmentSheet;