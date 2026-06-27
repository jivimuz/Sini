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
import { useStatusStore } from "@/components/Status/stores/status.store";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useLang } from "@/stores/lang.store";
import locales from "./locales";
import { useUserStore } from "@/stores/user.store";
import { useLocationStore } from "@/stores/location.store";
import { useProfileModalStore } from "@/stores/profileModal.store";

// Helper untuk menghitung waktu yang telah berlalu.
// Fungsi ini berasumsi bahwa objek locale `t` memiliki struktur seperti:
// t.time = { minute: 'menit', hour: 'jam', day: 'hari', justNow: 'Baru saja' }
// t.past = 'lalu'
const formatTimeAgo = (dateString: string, t: any) => {
    if (!dateString) return '';

    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    const timeUnits = t.time || { minute: t.minute || 'menit', hour: t.hour || 'jam', day: t.day || 'hari', justNow: t.justNow || 'Baru saja' };
    const pastText = t.past || 'lalu';

    if (diffInSeconds < 60) {
        return timeUnits.justNow;
    }
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes} ${timeUnits.minute} ${pastText}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${timeUnits.hour} ${pastText}`;
    const days = Math.floor(hours / 24);
    return `${days} ${timeUnits.day} ${pastText}`;
};

// Helper function to calculate distance
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return "";
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres
    if (d < 1000) {
        return `${Math.round(d)} m`;
    }
    return `${(d / 1000).toFixed(1)} km`;
};

export default function StatusBottomSheet() {
    const sheetRef =
        useRef<BottomSheet>(null);
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
    const { toggleLike } = useUserStore();
    const { latitude: userLatitude, longitude: userLongitude } = useLocationStore();
    const { openProfile } = useProfileModalStore();

    const status = useUserStore(state =>
        selectedStatusId ? state.users.find(user => user.id === selectedStatusId) ?? null : null
    );

    useEffect(() => {
        if (selectedStatusId) {
            sheetRef.current?.expand();
        } else {
            sheetRef.current?.close();
        }
    }, [selectedStatusId]);

    const handleClose = () => {
        closeStatus();
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
                {status ? (
                    <>
                        {
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
                                            <TouchableOpacity activeOpacity={0.8} onPress={() => status && openProfile(status.id)}>
                                                <Image
                                                    source={{ uri: status?.avatarUrl }} resizeMode="cover"
                                                    className="h-14 w-14 rounded-full border-2 border-yellow-400"
                                                />
                                            </TouchableOpacity>
                                            <View className="ml-4 flex-1 f">
                                                <View className="flex-row justify-between items-baseline">
                                                    <View className="flex-row items-center">
                                                        <TouchableOpacity activeOpacity={0.8} onPress={() => status && openProfile(status.id)}>
                                                            <Text className="text-lg font-bold text-white shadow-sm">
                                                                {status.name.split(' ')[0]}
                                                            </Text>
                                                        </TouchableOpacity>
                                                        <Text className="ml-2 text-xs font-bold bg-black/30 px-2 py-1 rounded-full text-white">
                                                            {formatTimeAgo(status.created_at, t)}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text className="text-sm text-neutral-200 mt-1 shadow-sm">
                                                    📍 {getDistance(userLatitude!, userLongitude!, status.latitude, status.longitude)} - {status.location_name}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-end gap-1">

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
                                                {status.caption}
                                            </Text>
                                            <View className="items-center gap-2">
                                                <TouchableOpacity onPress={() => status && toggleLike(status.id)} className="items-center justify-center bg-black/30 h-12 w-12 rounded-full">
                                                    <Ionicons name={status.is_liked ? "heart" : "heart-outline"} size={25} color={status.is_liked ? '#ef4444' : '#E5E7EB'} />
                                                    <Text style={{ fontSize: 9 }} className="text-white font-semibold shadow-sm">
                                                        {status.like_count}
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity className="items-center space-x-2 bg-black/30 px-3 py-2 gap-1 rounded-full">
                                                    <AntDesign name="share-alt" size={22} color="white" style={{ marginVertical: 2 }} />

                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View className="flex-row items-center space-x-3 border-t border-neutral-200/30 pt-4 gap-3" >
                                            <View className="flex-1 flex-row items-center bg-white/40 rounded-full px-4 py-2">
                                                <TextInput
                                                    placeholder={t.chat}
                                                    placeholderTextColor="#FAFAFAFA" // Warna placeholder abu-abu terang
                                                    className="flex-1 text-black h-11"
                                                />
                                                <TouchableOpacity className="bg-softprimary h-11 w-11 rounded-full items-center justify-center">
                                                    <AntDesign name="send" size={18} color="black" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </ImageBackground>
                        }
                    </>
                ) : null}
            </BottomSheetView>
        </BottomSheet>
    );
}