import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Linking, // 1. Tambahkan import Linking untuk membuka aplikasi eksternal
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
    Map,
    Camera,
    Marker,
} from "@maplibre/maplibre-react-native";

const primaryMapStyle = require('@/../assets/map/primary-map.json');

interface Props {
    title: string;
    latitude: number;
    longitude: number;
    distance?: string;
    isMe?: boolean;
    time?: string;
    onPress?: () => void;
}

export default function LocationBubble({
    title,
    latitude,
    longitude,
    distance,
    isMe,
    time = "09:23",
    onPress,
}: Props) {

    // 2. Fungsi untuk membuka Google Maps secara otomatis
    const openGoogleMaps = async () => {
        // Skema URL khusus untuk Google Maps (bekerja di Android & iOS jika terinstal)
        const googleMapsUrl = `google.navigation:q=${latitude},${longitude}`;
        // Skema URL universal (cadangan jika Google Maps tidak terinstal, otomatis buka Apple Maps di iOS atau Browser)
        const universalUrl = `https://google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

        try {
            const isSupported = await Linking.canOpenURL(googleMapsUrl);

            if (isSupported) {
                await Linking.openURL(googleMapsUrl);
            } else {
                // Jika aplikasi Google Maps tidak terinstal, buka lewat tautan web/Apple Maps bawaan
                await Linking.openURL(universalUrl);
            }
        } catch (error) {
            Alert.alert("Gagal Membuka Peta", "Tidak dapat membuka aplikasi navigasi di perangkat Anda.");
        }

        // Panggil juga fungsi onPress eksternal jika dilewatkan dari props parent
        if (onPress) onPress();
    };

    return (
        <View
            className={`mb-2 flex-row ${isMe ? "justify-end" : "justify-start"}`}
        >
            <View
                className={`
                    overflow-hidden
                    shadow-sm
                    max-w-[80%]
                    w-[280px]
                    rounded-2xl
                    ${isMe
                        ? "bg-[#FFE066] rounded-tr-none"
                        : "bg-white rounded-tl-none border border-neutral-100"
                    }
                `}
            >
                {/* AREA PREVIEW PETA (DIKUNCI / NO-INTERACT) */}
                <View style={{ height: 140, width: "100%" }}>
                    <Map
                        style={{ flex: 1 }}
                        mapStyle={primaryMapStyle}
                        logo={false}          // Menonaktifkan logo MapLibre
                        attribution={false}   // Menonaktifkan atribusi teks peta

                        // 3. KUNCI UTAMA: Matikan seluruh interaksi gesture tangan pada peta
                        touchPitch={false}        // Peta tidak bisa digeser-geser
                        touchRotate={false}          // Peta tidak bisa di-zoom in/out lewat cubitan jari
                        touchZoom={false}          // Peta tidak bisa di-zoom in/out lewat cubitan jari
                        dragPan={false}            // Peta tidak bisa digeser-geser
                    >
                        <Camera
                            center={[longitude, latitude]}
                            zoom={15}
                            minZoom={15}
                            maxZoom={15}
                        />
                        <Marker lngLat={[longitude, latitude]}>
                            <View className="items-center justify-center">
                                <Ionicons name="location" size={32} color="#DC2626" />
                                <View className="w-2 h-2 bg-neutral-950/20 rounded-full -mt-1" />
                            </View>
                        </Marker>
                    </Map>
                </View>

                {/* AREA DETAIL INFORMASI */}
                <View className="p-3">
                    <View className="flex-row items-start">
                        <View className="mt-0.5">
                            <Ionicons
                                name="navigate-circle"
                                size={18}
                                color={isMe ? "#78350F" : "#D97706"}
                            />
                        </View>
                        <View className="ml-2 flex-1">
                            <Text
                                numberOfLines={1}
                                className="text-[14px] font-bold text-neutral-800"
                            >
                                {title}
                            </Text>
                            {!!distance && (
                                <Text className="text-xs text-neutral-500 mt-0.5">
                                    {distance} dari kamu
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* TOMBOL AKSI INTERAKTIF */}
                    <TouchableOpacity
                        onPress={openGoogleMaps} // 4. Pasangkan fungsi navigasi Google Maps ke tombol
                        activeOpacity={0.8}
                        className={`
                            mt-3
                            h-9
                            rounded-full
                            items-center
                            justify-center
                            shadow-sm
                            ${isMe
                                ? "bg-neutral-900 active:bg-neutral-800"
                                : "bg-[#FFD84D] active:bg-[#F5C625]"
                            }
                        `}
                    >
                        <Text
                            className={`
                                font-semibold text-xs
                                ${isMe ? "text-white" : "text-neutral-900"}
                            `}
                        >
                            Lihat Rute
                        </Text>
                    </TouchableOpacity>

                    {/* TIMESTAMP */}
                    <View className="flex-row items-center justify-end mt-2 pt-1 border-t border-neutral-100/40">
                        <Text className="text-[10px] text-neutral-400 mr-1">
                            {time}
                        </Text>
                        {isMe && (
                            <Ionicons name="checkmark-done" size={14} color="#4B5563" />
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
}
