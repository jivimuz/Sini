import React, { useMemo, useRef, useEffect } from 'react';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useProfileModalStore } from '@/stores/profile.modal.store';
import { useUserStore } from '@/stores/user.store';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from "expo-linking";
import localest from './locales';
import { useLang } from '@/stores/lang.store';

export default function UserProfileModal() {
    const sheetRef = useRef<BottomSheet>(null);
    const { selectedUserId, closeProfile } = useProfileModalStore();

    const user = useUserStore(state =>
        selectedUserId ? state.users.find(u => u.id === selectedUserId) : null
    );
    const { lang } = useLang()

    const t = localest[lang].userProfileModal;
    const snapPoints = useMemo(() => ['60%'], []);

    useEffect(() => {
        if (selectedUserId) {
            sheetRef.current?.expand();
        } else {
            sheetRef.current?.close();
        }
    }, [selectedUserId]);

    const content = user ? (
        <BottomSheetView className="flex-1 bg-[#FFFDF5] px-6 pt-5  pb-20">

            {/* Avatar */}

            <View className="items-center">

                <View className="relative">

                    <Image
                        source={{
                            uri: user.avatarUrl,
                        }}
                        className="
                    w-28
                    h-28
                    rounded-full
                    border-4
                    border-[#FFD84D]
                    "
                    />

                    <View
                        className="
                    absolute
                    bottom-1
                    right-1
                    w-5
                    h-5
                    rounded-full
                    bg-green-500
                    border-2
                    border-white
                    "
                    />

                </View>

                <Text
                    className="
                mt-4
                text-2xl
                font-bold
                text-neutral-800
                "
                >
                    {user.name}
                </Text>

                <Text className="text-neutral-500">
                    @{user.name.toLowerCase().replace(/\s/g, "")}
                </Text>

            </View>

            {/* Bio */}

            <View
                className="
            mt-6
            bg-white
            rounded-3xl
            p-5
            "
            >
                <Text className="font-semibold ">
                    {t.bio}
                </Text>


                <Text
                    className="
                text-neutral-700
                leading-6
                "
                >
                    Life is too short to stay at home.
                </Text>

            </View>

            {/* Social */}



            {/* Stats */}

            <View
                className="
            mt-5
            bg-white
            rounded-3xl
            p-5
            flex-row
            justify-around
            "
            >

                <View className="items-center">

                    <Text className="text-2xl font-bold">
                        24
                    </Text>

                    <Text className="text-neutral-500">
                        {t.status}
                    </Text>

                </View>

                <View className="items-center">

                    <Text className="text-lg font-semibold">
                        Jan 2026
                    </Text>

                    <Text className="text-neutral-500">
                        {t.joined}
                    </Text>

                </View>

            </View>
            <View
                className="
            mt-5
            bg-white
            rounded-3xl
            p-5
             
            "
            >

                <Text className="font-semibold text-center mb-4">
                    {t.socialMedia}
                </Text>

                <View className="flex-row justify-around">

                    <TouchableOpacity
                        onPress={() =>
                            Linking.openURL("https://instagram.com")
                        }
                    >
                        <Ionicons
                            name="logo-instagram"
                            size={30}
                            color="#E1306C"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() =>
                            Linking.openURL("https://tiktok.com")
                        }
                    >
                        <Ionicons
                            name="musical-notes"
                            size={30}
                            color="#111827"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() =>
                            Linking.openURL("https://facebook.com")
                        }
                    >
                        <Ionicons
                            name="logo-facebook"
                            size={30}
                            color="#1877F2"
                        />
                    </TouchableOpacity>

                </View>

            </View>

            {/* Button */}

            <View className="flex-row mt-6">

                <TouchableOpacity
                    className="
                flex-1
                h-14
                rounded-full
                bg-[#FFD84D]
                items-center
                justify-center
                "
                >
                    <Text className="font-bold">
                        {t.chat}
                    </Text>
                </TouchableOpacity>



            </View>

        </BottomSheetView>
    ) : (
        <View />
    );

    return (
        <BottomSheet
            ref={sheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={closeProfile}
            handleIndicatorStyle={{ backgroundColor: '#D1D5DB' }}
            backgroundStyle={{ backgroundColor: '#FFFFFF' }}
        >
            {content}
        </BottomSheet>
    );
}