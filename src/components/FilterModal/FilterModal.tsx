import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import Slider from "@react-native-community/slider";
import { useLang } from "@/stores/lang.store";
import { Ionicons } from "@expo/vector-icons";

import {
    ALL_CATEGORIES,
    CATEGORIES,
    CategoryKey,
    LiveFilterStatus,
} from "../../constants/categories";
import locales from "./locales";

interface FilterModalProps {
    isVisible: boolean;
    onClose: () => void;
    initialCategories: CategoryKey[];
    initialLiveStatus: LiveFilterStatus;
    initialRadius: number;
    onApply: (
        categories: CategoryKey[],
        liveStatus: LiveFilterStatus,
        radius: number
    ) => void;
}

const MIN_RADIUS_METERS = 1000; // 1 km
const MAX_RADIUS_METERS = 50000; // 50 km
const RADIUS_STEP_METERS = 1000;

const formatRadiusLabel = (meters: number) => `${(meters / 1000).toFixed(0)} km`;

export const FilterModal = ({
    isVisible,
    onClose,
    initialCategories,
    initialLiveStatus,
    initialRadius,
    onApply,
}: FilterModalProps) => {
    const sheetRef = useRef<BottomSheet>(null);
    const { lang } = useLang();
    const t = locales[lang].filterModal;

    const snapPoints = useMemo(() => ["80%"], []);

    const [tempCategories, setTempCategories] =
        useState<CategoryKey[]>(initialCategories);

    const [tempLiveStatus, setTempLiveStatus] =
        useState<LiveFilterStatus>(initialLiveStatus);

    const [tempRadius, setTempRadius] = useState<number>(initialRadius);

    const liveOptions = [
        { key: "all", label: t.status.all },
        { key: "live", label: t.status.live },
        { key: "regular", label: t.status.regular },
    ] as const;

    useEffect(() => {
        if (isVisible) {
            setTempCategories(initialCategories);
            setTempLiveStatus(initialLiveStatus);
            setTempRadius(initialRadius);

            requestAnimationFrame(() => {
                sheetRef.current?.snapToIndex(0);
            });
        } else {
            sheetRef.current?.close();
        }
    }, [isVisible]);

    const handleToggleCategory = (category: CategoryKey) => {
        setTempCategories(prev => {
            const next = prev.includes(category)
                ? prev.filter(x => x !== category)
                : [...prev, category];

            return next.length ? next : prev;
        });
    };

    const handleReset = () => {
        setTempCategories(ALL_CATEGORIES);
        setTempLiveStatus("all");
        setTempRadius(5000);
    };

    const handleApply = () => {
        onApply(tempCategories, tempLiveStatus, tempRadius);
        sheetRef.current?.close();
    };

    return (
        <BottomSheet
            ref={sheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={onClose}
            backgroundStyle={{
                backgroundColor: "#F9FAFB",
            }}
            handleIndicatorStyle={{
                backgroundColor: "#D1D5DB",
            }}
        >
            <BottomSheetView style={{ padding: 20 }}>
                {/* Header */}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 24,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 22,
                            fontWeight: "700",
                        }}
                    >
                        {t.title}
                    </Text>

                    <TouchableOpacity onPress={() => sheetRef.current?.close()}>
                        <Ionicons
                            name="close"
                            size={24}
                            color="#555"
                        />
                    </TouchableOpacity>
                </View>

                {/* Radius Filter */}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 4,
                        marginTop: 24,
                    }}
                >
                    <Text style={{ fontWeight: "600" }}>{t.radius}</Text>
                    <Text style={{ fontWeight: "700", color: "#D97706" }}>
                        {formatRadiusLabel(tempRadius)}
                    </Text>
                </View>

                <Slider
                    style={{ width: "100%", height: 40, marginBottom: 8 }}
                    minimumValue={MIN_RADIUS_METERS}
                    maximumValue={MAX_RADIUS_METERS}
                    step={RADIUS_STEP_METERS}
                    value={tempRadius}
                    onValueChange={setTempRadius}
                    minimumTrackTintColor="#FACC15"
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor="#D97706"
                />
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 24,
                    }}
                >
                    <Text style={{ fontSize: 12, color: "#9CA3AF" }}>{formatRadiusLabel(MIN_RADIUS_METERS)}</Text>
                    <Text style={{ fontSize: 12, color: "#9CA3AF" }}>{formatRadiusLabel(MAX_RADIUS_METERS)}</Text>
                </View>

                {/* Live Filter */}
                <Text
                    style={{
                        fontWeight: "600",
                        marginBottom: 12,
                    }}
                >
                    {t.statusType}
                </Text>

                <View
                    style={{
                        flexDirection: "row",
                        backgroundColor: "#E5E7EB",
                        borderRadius: 999,
                        padding: 4,
                        marginBottom: 24,
                    }}
                >
                    {liveOptions.map(option => {
                        const selected =
                            tempLiveStatus === option.key;

                        return (
                            <TouchableOpacity
                                key={option.key}
                                onPress={() =>
                                    setTempLiveStatus(option.key)
                                }
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    borderRadius: 999,
                                    backgroundColor: selected
                                        ? "white"
                                        : "transparent",
                                    alignItems: "center",
                                }}
                            >
                                <Text
                                    style={{
                                        fontWeight: "600",
                                        color: selected
                                            ? "#111"
                                            : "#777",
                                    }}
                                >
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Categories */}

                <Text
                    style={{
                        fontWeight: "600",
                        marginBottom: 12,
                    }}
                >
                    {t.category}
                </Text>

                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 10,
                        alignItems: "center",
                        justifyContent: "flex-start",
                    }}
                >
                    {ALL_CATEGORIES.map(key => {
                        const category = CATEGORIES.find(c => c.key === key);
                        const selected =
                            tempCategories.includes(key);

                        return (
                            <TouchableOpacity
                                key={key}
                                onPress={() =>
                                    handleToggleCategory(key)
                                }
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderRadius: 999,
                                    backgroundColor: selected
                                        ? "#FACC15"
                                        : "#E5E7EB",
                                }}
                            >
                                <Ionicons
                                    name={category?.icon}
                                    size={18}
                                    color="#111"
                                />

                                <Text
                                    style={{
                                        marginLeft: 8,
                                        fontWeight: "600",
                                    }}
                                >
                                    {category?.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>



                {/* Footer */}

                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 30,
                        gap: 12,
                        marginBottom: 100,
                    }}
                >
                    {/* Tombol Reset (Mengambil 1 bagian) */}
                    <TouchableOpacity
                        onPress={handleReset}
                        style={{
                            flex: 2, // 👈 Cukup pakai flex saja, hapus width
                            height: 54,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: "#DDD",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ fontWeight: "700" }}>
                            <Ionicons name="reload" size={18} color="#555" />
                        </Text>
                    </TouchableOpacity>

                    {/* Tombol Terapkan (Mengambil 4 bagian / Lebih Luas) */}
                    <TouchableOpacity
                        onPress={handleApply}
                        style={{
                            flex: 10,
                            height: 54,
                            borderRadius: 999,
                            backgroundColor: "#FACC15",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ fontWeight: "700" }}>
                            {t.apply}
                        </Text>
                    </TouchableOpacity>
                </View>

            </BottomSheetView>
        </BottomSheet>
    );
};