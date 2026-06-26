import React,
{
    useEffect,
    useMemo,
    useRef,
} from "react";

import BottomSheet,
{
    BottomSheetView,
} from "@gorhom/bottom-sheet";

import {
    View,
    Text,
    ActivityIndicator,
    Image,
    ImageSourcePropType,
    TouchableOpacity,
    ImageBackground,
    TextInput,
} from "react-native";
import { useStatusStore } from "@/app/status/stores/status.store";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useLang } from "@/stores/lang.store";
import locales from "./locales";
import { StatusData } from "./types/status.type";



export default function StatusBottomSheet() {
    const sheetRef =
        useRef<BottomSheet>(null);
    const [isLiked, setIsLiked] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [status, setStatus] = React.useState<StatusData | null>(null);

    const snapPoints =
        useMemo(
            () => ["95%"],
            []
        );

    const { lang } = useLang();
    const t = locales[lang].statusBottomSheet;

    const {
        selectedStatusId,
        closeStatus,
    } = useStatusStore();

    useEffect(() => {
        if (selectedStatusId) {
            sheetRef.current?.expand();
            setIsLiked(false); // Reset like state saat membuka status baru 
            setStatus({
                id: selectedStatusId,
                user_name: "Baron",
                avatarUrl: "https://i.pravatar.cc/150?u=Baron",
                statusImageUrl: require("@/../assets/images/dummy/images-2.jpeg"),
                caption: "Ngopi ☕",
                location_name:
                    "Senayan City",
                distance: "120m",
                remaining: "2 jam",
            })
            setIsLoading(false); // Set loading menjadi false setelah data status diatur

        } else {
            sheetRef.current?.close();
        }
    }, [selectedStatusId]);


    useEffect(() => {
        if (selectedStatusId) {
            // Simulasi fetch data status berdasarkan selectedStatusId

        }
    }, [selectedStatusId]);

    const handleClose = () => {
        closeStatus();
        setIsLiked(false); // Reset
    }

    return (
        <BottomSheet
            ref={sheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={closeStatus}
            handleIndicatorStyle={{ backgroundColor: '#E5E7EB' }} // a subtle handle
        >
            <BottomSheetView
                className="flex-1"
            >
                {!selectedStatusId ? null : (
                    <>
                        {isLoading ? (
                            <ActivityIndicator />
                        ) : (
                            // Langsung teruskan hasil `require` ke prop `source`
                            <ImageBackground source={status?.statusImageUrl} resizeMode="cover"
                                className="flex-1 h-full w-full min-h-[768px] rounded-t-3xl overflow-hidden">
                                {/* 1. Foto Status Gede */}

                                {/* Wrapper untuk mengatur layout konten di atas background */}
                                <View className="flex-1 justify-between p-5">
                                    {/* -- KONTEN ATAS -- */}
                                    <View>
                                        {/* 2. Avatar, Nama, Lokasi */}
                                        <View className="flex-row items-center gap-1">
                                            <Image
                                                source={{ uri: status?.avatarUrl }} resizeMode="cover"
                                                className="h-14 w-14 rounded-full border-2 border-yellow-400"
                                            />
                                            <View className="ml-4 flex-1 f">
                                                <View className="flex-row justify-between items-baseline">
                                                    <View className="flex-row items-center">
                                                        <Text className="text-lg font-bold text-white shadow-sm">
                                                            {status && status.user_name && status.user_name.split(' ')[0]}

                                                        </Text>
                                                        <Text className="ml-2 text-xs font-bold bg-black/30 px-2 py-1 rounded-full text-white">
                                                            {status && status?.remaining} lalu
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text className="text-sm text-neutral-200 mt-1 shadow-sm">
                                                    📍 {status && status?.distance} - {status && status?.location_name}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center gap-1">
                                                <TouchableOpacity className="flex-row items-center space-x-2 bg-black/30 px-3 py-2 gap-1 rounded-full">
                                                    <AntDesign name="share-alt" size={22} color="white" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={handleClose} className="flex-row items-center space-x-2 bg-black/30 px-3 py-2 gap-1 rounded-full">
                                                    <AntDesign name="close" size={22} color="white" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                    {/* -- KONTEN BAWAH -- */}
                                    <View>
                                        <View className="flex-row items-end justify-between mb-4">
                                            <Text className="text-base text-white shadow-sm flex-1 mr-4">
                                                {status && status?.caption}
                                            </Text>
                                            <TouchableOpacity onPress={() => setIsLiked(!isLiked)} className="flex-row items-center space-x-2 bg-black/30 px-3 py-2 gap-1 rounded-full">
                                                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={25} color="#E5E7EB" />
                                            </TouchableOpacity>
                                        </View>
                                        <View className="flex-row items-center space-x-3 border-t border-neutral-200/30 pt-4 gap-3" >
                                            <View className="flex-1 flex-row items-center bg-black/30 rounded-full px-4">
                                                <TextInput
                                                    placeholder={t.chat}
                                                    placeholderTextColor="#E5E7EB" // Warna placeholder abu-abu terang
                                                    className="flex-1 text-white h-11"
                                                />
                                            </View>
                                            <TouchableOpacity className="bg-softprimary h-11 w-11 rounded-full items-center justify-center">
                                                <AntDesign name="send" size={20} color="black" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </ImageBackground>
                        )}
                    </>
                )}
            </BottomSheetView>
        </BottomSheet>
    );
}