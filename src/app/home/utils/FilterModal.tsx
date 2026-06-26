import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useLang } from "@/stores/lang.store";
import locales from "@/app/home/locales";
import { Ionicons } from "@expo/vector-icons";

import {
    ALL_CATEGORIES,
    CATEGORIES,
    CategoryKey,
    LiveFilterStatus,
} from "../constants/categories";

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
    const t = locales[lang].homeScreen.filterModal;

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

    const radiusOptions = [
        { value: 500, label: "500m" },
        { value: 1000, label: "1km" },
        { value: 2000, label: "2km" },
        { value: 5000, label: "5km" },
    ];

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
                <Text
                    style={{
                        fontWeight: "600",
                        marginBottom: 12,
                        marginTop: 24,
                    }}
                >
                    {t.radius}
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
                    {radiusOptions.map(option => {
                        const selected =
                            tempRadius === option.value;

                        return (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() =>
                                    setTempRadius(option.value)
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
                    }}
                >
                    {ALL_CATEGORIES.map(key => {
                        const category = CATEGORIES[key];
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
                                    name={category.icon}
                                    size={18}
                                    color="#111"
                                />

                                <Text
                                    style={{
                                        marginLeft: 8,
                                        fontWeight: "600",
                                    }}
                                >
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>



                {/* Footer */}

                <View
                    style={{
                        flexDirection: "row",
                        marginTop: 30,
                        gap: 12,
                    }}
                >
                    <TouchableOpacity
                        onPress={handleReset}
                        style={{
                            flex: 1,
                            height: 54,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: "#DDD",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Text
                            style={{
                                fontWeight: "700",
                            }}
                        >
                            {t.reset}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleApply}
                        style={{
                            flex: 1,
                            height: 54,
                            borderRadius: 999,
                            backgroundColor: "#FACC15",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Text
                            style={{
                                fontWeight: "700",
                            }}
                        >
                            {t.apply}
                        </Text>
                    </TouchableOpacity>
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};