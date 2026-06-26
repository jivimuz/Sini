import React, { useEffect, useState, useRef } from "react";
import * as Location from "expo-location";
import { useLang } from "@/stores/lang.store";

import {
    View,
    Text,
    Alert,
    Modal,
    Linking,
    TouchableOpacity,
    Image,
    Animated,
    TouchableWithoutFeedback,
} from "react-native";

import {
    Map,
    Camera,
    Marker, CameraRef
} from "@maplibre/maplibre-react-native";

import { Ionicons } from "@expo/vector-icons";
import locales from "./locales";

import primaryMapStyle from "@/../assets/map/primary-map.json";

import {
    useLocationStore,
} from "@/app/home/stores/location.store";
import {
    DummyMarker, useMarkerStore,
} from "@/app/home/stores/marker.store";
import { useIsNewNotif } from "./stores/notification.store";
import { useRouteStore } from "./stores/route.store";
import RouteLine from "@/components/RouteLine/RouteLine";
import { useStatusStore } from "@/app/status/stores/status.store";
import { useBarColor } from "@/stores/barColor.store";
import { SafeAreaView } from "react-native-safe-area-context";



const INDONESIA_CENTER: [number, number] = [
    117,
    -2.5,
];

const CATEGORY_DATA = {
    one: { color: '#3498db', icon: 'people-outline' as const },
    two: { color: '#2ecc71', icon: 'home-outline' as const },
    three: { color: '#e67e22', icon: 'briefcase-outline' as const },
} as const;

type CategoryKey = keyof typeof CATEGORY_DATA;

const ALL_CATEGORIES = Object.keys(CATEGORY_DATA) as CategoryKey[];


export default function HomeScreen() {


    const { lang } = useLang();
    const t = locales[lang].homeScreen;
    const {
        isRouteMode,
        routeCoordinates,
        exitRoute,
        startRoute,
    } = useRouteStore();
    const { openStatus } = useStatusStore();

    const ModalActionButton = ({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap, label: string, onPress: () => void }) => (
        <TouchableOpacity onPress={onPress} className="items-center space-y-2" activeOpacity={0.7}>
            <View className="h-16 w-16 bg-yellow-100 rounded-full items-center justify-center">
                <Ionicons name={icon} size={30} color="#132648" />
            </View>
            <Text className="text-sm font-semibold text-neutral-800">{label}</Text>
        </TouchableOpacity>
    );


    const handleRoute = async () => {
        const destination = {
            latitude: -6.2088,
            longitude: 106.8456,
        };

        const coordinates: [number, number][] = [
            [106.8272, -6.1754],
            [106.8300, -6.1800],
            [106.8350, -6.1900],
            [106.8456, -6.2088],
        ];

        startRoute(
            destination,
            coordinates
        );
    };

    const handleChat = () => {
        if (!selectedMarker) return;
        // Placeholder untuk fungsionalitas chat
        Alert.alert("Chat", `Mulai obrolan dengan ${selectedMarker.name}`);
    };

    const handleViewOnMap = () => {
        if (!selectedMarker) return;
        const { latitude, longitude } = selectedMarker;
        // URL untuk membuka lokasi di Google Maps
        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        Linking.openURL(url).catch(() => Alert.alert("Error", "Tidak dapat membuka peta."));
    };


    const CATEGORIES = {
        one: { name: "Event", ...CATEGORY_DATA.one },
        two: { name: "Selling", ...CATEGORY_DATA.two },
        three: { name: "Work", ...CATEGORY_DATA.three },
    };

    const {
        latitude,
        longitude,
        setLocation,
        setPermission,
        hasPermission,
    } = useLocationStore();

    const { markers, setMarkers } = useMarkerStore();
    const { newNotif } = useIsNewNotif();

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedMarker, setSelectedMarker] = useState<DummyMarker | null>(null);
    const [visibleCategories, setVisibleCategories] = useState<CategoryKey[]>(ALL_CATEGORIES);
    const [isMapCentered, setIsMapCentered] = useState(true);


    const cameraRef = useRef<CameraRef>(null);

    const [cameraConfig, setCameraConfig] =
        useState({
            centerCoordinate:
                INDONESIA_CENTER as [number, number],
            zoomLevel: 10,
            pitch: 0,
            bearing: 0,
        });

    useEffect(() => {
        requestLocation();
    }, []);

    // Effect to handle compass-based map rotation (like Pokemon Go)
    useEffect(() => {
        // Don't run if permission isn't granted or if the map is not in 'centered' mode
        if (!hasPermission || !isMapCentered) {
            return;
        }

        let headingSubscription: Location.LocationSubscription | null = null;

        const startWatchingHeading = async () => {
            headingSubscription = await Location.watchHeadingAsync((heading) => {
                // heading.trueHeading is the direction relative to true north.
                // We only update if the heading is valid (> -1)
                if (heading.trueHeading > -1) {
                    // Update the camera's bearing using state for a declarative update.
                    // The <Camera> component will handle the smooth animation.
                    setCameraConfig(prevConfig => ({
                        ...prevConfig,
                        bearing: heading.trueHeading,
                    }));
                }
            });
        };

        startWatchingHeading();

        // Cleanup function to remove the subscription when the component unmounts
        // or when dependencies (hasPermission, isMapCentered) change.
        return () => {
            headingSubscription?.remove();
        };
    }, [hasPermission, isMapCentered]);

    // --- Animation Setup ---
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Membuat animasi berulang (loop)
        Animated.loop(
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 3000, // durasi 3 detik untuk satu siklus
                useNativeDriver: true, // Performa lebih baik
            })
        ).start();
    }, []);

    // Style untuk gelombang pertama (luar)
    const pulseStyle1 = {
        transform: [{
            scale: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1], // Membesar dari 0% ke 100% ukuran container
            })
        }],
        opacity: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 0], // Memudar dari 70% ke 0%
        })
    };

    // Style untuk gelombang kedua (dalam), dibuat delay
    const pulseStyle2 = {
        transform: [{
            scale: pulseAnim.interpolate({
                inputRange: [0, 0.5, 1], // Mulai animasi setelah 50% durasi
                outputRange: [0, 0, 1],
            })
        }],
        opacity: pulseAnim.interpolate({
            inputRange: [0, 0.5, 1], // Muncul setelah 50% durasi
            outputRange: [0, 0.7, 0],
        })
    };

    // --- Recenter Button Pulse Animation ---
    const recenterPulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(recenterPulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(recenterPulseAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const recenterPulseStyle = {
        transform: [{
            scale: recenterPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] })
        }],
        opacity: recenterPulseAnim.interpolate({
            inputRange: [0, 0.5, 1], outputRange: [0, 1, 0]
        })
    };

    // --- Filter Animation ---
    const filterAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(filterAnim, {
            toValue: isFilterOpen ? 1 : 0,
            duration: 300,
            useNativeDriver: false, // Diperlukan untuk animasi layout seperti translateY
        }).start();
    }, [isFilterOpen]);

    // Generate dummy markers when location is available
    useEffect(() => {
        if (!latitude || !longitude || markers.length > 0) {
            return;
        }

        const dummyData: DummyMarker[] = [];
        const names = ["Joko", "Budi", "Siti", "Ani", "Eka", "Dwi", "Tri", "Catur", "Panca", "Satya"];
        const categories = Object.keys(CATEGORIES) as CategoryKey[];

        for (let i = 0; i < 10; i++) {
            const randomCategory = categories[i % categories.length];
            const randomLocation = generateRandomPoint({ lat: latitude, lon: longitude }, 2000); // 2km radius
            dummyData.push({
                id: `user-${i}`,
                ...randomLocation,
                name: names[i % names.length],
                avatarUrl: `https://i.pravatar.cc/150?u=user${i}`,
                category: randomCategory,
                color: CATEGORIES[randomCategory].color,
            });
        }

        setMarkers(dummyData);

    }, [latitude, longitude]);

    // Helper function to generate random points within a radius
    const generateRandomPoint = (center: { lat: number, lon: number }, radius: number): { latitude: number, longitude: number } => {
        const y0 = center.lat;
        const x0 = center.lon;
        // Convert radius from meters to degrees
        const rd = radius / 111300;

        const u = Math.random();
        const v = Math.random();

        const w = rd * Math.sqrt(u);
        const t = 2 * Math.PI * v;
        const x = w * Math.cos(t);
        const y = w * Math.sin(t);

        const new_x = x / Math.cos(y0 * Math.PI / 180);

        return { latitude: y0 + y, longitude: x0 + new_x };
    }

    const requestLocation = async () => {
        try {
            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert(
                    t.alerts.locationDeniedTitle,
                    t.alerts.locationDeniedMessage
                );

                return;
            }

            setPermission(true);

            const location =
                await Location.getCurrentPositionAsync({
                    accuracy:
                        Location.Accuracy.BestForNavigation,
                });

            setLocation(
                location.coords.latitude,
                location.coords.longitude
            );

            // Zenly-like camera
            setCameraConfig({
                centerCoordinate: [
                    location.coords.longitude,
                    location.coords.latitude,
                ],
                zoomLevel: 15,
                pitch: 60,
                bearing: 15,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const toggleCategory = (category: CategoryKey) => {
        setVisibleCategories(prev => {
            const newCategories = prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category];

            // Pastikan minimal satu kategori selalu terpilih
            return newCategories.length > 0 ? newCategories : prev;
        });
    };

    const handleMapMove = (event: any) => {
        setIsMapCentered(false);
    }

    const recenter = () => {
        if (
            latitude === null ||
            longitude === null
        ) {
            Alert.alert(
                t.alerts.locationUnavailableTitle,
                t.alerts.locationUnavailableMessage
            );
            return;
        }

        // Perintahkan kamera untuk "terbang" ke lokasi dengan animasi yang mulus
        cameraRef.current?.flyTo(
            {
                center: [longitude, latitude],
                duration: 1000,
            },
        );
        setIsMapCentered(true);
    };

    const filteredMarkers = markers.filter(marker => visibleCategories.includes(marker.category as CategoryKey));

    return (
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
            <View className="flex-1" >
                <Map
                    mapStyle={primaryMapStyle as any}
                    style={{ height: "110%" }}
                    onTouchMove={handleMapMove}
                    onTouchEnd={handleMapMove}
                >
                    <Camera
                        ref={cameraRef}
                        duration={300}
                        center={
                            cameraConfig.centerCoordinate
                        }

                        zoom={cameraConfig.zoomLevel}
                        pitch={cameraConfig.pitch}
                        bearing={cameraConfig.bearing}
                    />
                    {
                        isRouteMode && routeCoordinates.length > 0 && (
                            <RouteLine
                                coordinates={routeCoordinates}
                            />
                        )}

                    {/* User Location Marker */}
                    {hasPermission &&
                        latitude &&
                        longitude && (
                            <Marker lngLat={[longitude, latitude]} anchor={"center"}>
                                <View className="w-24 h-24 items-center justify-center">
                                    {/* Gelombang 1 */}
                                    <Animated.View
                                        className="absolute h-full w-full rounded-full bg-yellow-400/50"
                                        style={pulseStyle1}
                                    />
                                    {/* Gelombang 2 */}
                                    <Animated.View
                                        className="absolute h-full w-full rounded-full bg-yellow-400/50"
                                        style={pulseStyle2}
                                    />
                                    {/* Titik Tengah Lokasi */}
                                    <View className="h-5 w-5 rounded-full bg-yellow-500 border-2 border-white shadow-md" />
                                </View>
                            </Marker>
                        )}

                    {/* Dummy Friend Markers */}
                    {filteredMarkers.map((marker) => (
                        <Marker
                            key={marker.id}
                            id={marker.id}
                            lngLat={[marker.longitude, marker.latitude]}
                        >
                            <TouchableOpacity onPress={() => openStatus(marker.id)} activeOpacity={0.9}>
                                <View className="items-center">
                                    <Image
                                        source={{ uri: marker.avatarUrl }}
                                        className="h-12 w-12 rounded-full border-2 shadow-lg"
                                        style={{ borderColor: marker.color }}
                                    />
                                    <Text className="mt-1 bg-white/80 px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm text-neutral-700">
                                        {marker.name}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </Marker>
                    ))}



                </Map>

                {/* SEARCH */}

                <View className="absolute top-5 left-4 right-4 flex-row items-center">
                    <TouchableOpacity
                        className="
                    flex-1
                    h-12
                    bg-white
                    rounded-full
                    px-4
                    flex-row
                    items-center
                    shadow-sm
                    "
                    >
                        <Ionicons
                            name="search"
                            size={18}
                        />

                        <Text className="ml-2 text-neutral-500">
                            {t.searchPlaceholder}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="h-12 w-12 ml-2 items-center justify-center rounded-full shadow-sm bg-white"
                    >
                        {/* Kontainer Ikon dengan posisi relative */}
                        <View className="relative">
                            <Ionicons name="notifications-outline" size={25} color="#ffc700" />

                            {/* Dot Merah Kondisional */}
                            {newNotif && (
                                <View className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white" />
                            )}
                        </View>
                    </TouchableOpacity>

                </View>

                {/* RECENTER BUTTON */}

                <TouchableOpacity
                    onPress={recenter}
                    className="
                absolute
                bottom-32
                right-6
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                bg-white
                shadow-md
                "
                    activeOpacity={0.8}
                >
                    {/* Wrapper untuk memastikan titik yang berkedip berada di tengah dan di belakang ikon */}
                    <View className="absolute inset-0 items-center justify-center">
                        {!isMapCentered && (
                            <Animated.View
                                className="h-4 w-4 rounded-full bg-yellow-400"
                                style={recenterPulseStyle}
                            />
                        )}
                    </View>

                    <Ionicons
                        name="locate"
                        size={22}
                        color="#132648"
                    />
                </TouchableOpacity>

                {/* FILTER BUTTONS */}
                <View className="absolute bottom-32 left-6 items-center">
                    {/* Tombol untuk setiap kategori */}
                    {ALL_CATEGORIES.map((key, index) => {
                        const isVisible = visibleCategories.includes(key);
                        const category = CATEGORIES[key];

                        const buttonStyle = {
                            transform: [
                                {
                                    scale: filterAnim,
                                },
                                {
                                    translateY: filterAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, -(index + 1) * 60], // Bergerak ke atas
                                    }),
                                },
                            ],
                            opacity: filterAnim,
                        };

                        return (
                            <Animated.View style={buttonStyle} key={key} className="absolute">
                                <TouchableOpacity
                                    onPress={() => toggleCategory(key)}
                                    className={`h-12 w-12 rounded-full items-center justify-center shadow-md ${isVisible ? 'bg-white' : 'bg-gray-300'}`}
                                >
                                    <Ionicons name={category.icon} size={22} color={isVisible ? category.color : '#666'} />
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}

                    {/* Tombol utama filter */}
                    <TouchableOpacity
                        onPress={() => setIsFilterOpen(!isFilterOpen)}
                        className="h-14 w-14 items-center justify-center rounded-full bg-white shadow-md"
                        activeOpacity={0.8}
                    >
                        <Animated.View style={{ transform: [{ rotate: filterAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
                            <Ionicons name={isFilterOpen ? "close" : "filter"} size={22} color={isFilterOpen ? "red" : "#132648"} />
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* {isRouteMode && (
                    <TouchableOpacity
                        onPress={exitRoute}
                        className="
                absolute
                top-32
                left-4
                right-4
                h-14
                bg-red-500
                rounded-2xl
                flex-row
                items-center
                justify-center
            "
                    >
                        <Ionicons
                            name="close"
                            size={20}
                            color="white"
                        />

                        <Text className="text-white font-semibold ml-2">
                            Exit Route
                        </Text>
                    </TouchableOpacity>
                )} */}

                {/* MARKER DETAIL MODAL */}
                {/* {selectedMarker && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={selectedMarker !== null}
                    onRequestClose={() => setSelectedMarker(null)}
                >
                    <TouchableOpacity
                        className="flex-1"
                        activeOpacity={1}
                        onPressOut={() => setSelectedMarker(null)}
                    >
                        <View className="flex-1 justify-end">
                            <TouchableWithoutFeedback>
                                <View className="bg-white rounded-t-3xl p-5 shadow-lg pt-16">
                                    <TouchableOpacity onPress={() => openStatus(selectedMarker.id)} className="absolute top-[-98px] self-center">
                                        <Image
                                            source={{ uri: selectedMarker.avatarUrl }}
                                            className="h-40 w-40 rounded-full border-4 border-yellow-400 shadow-xl"
                                        />
                                    </TouchableOpacity>

                                    <View className="items-center">
                                        <Text className="text-2xl font-bold text-gray-800">{selectedMarker.name}</Text>
                                        <Text className="text-base text-gray-500">{CATEGORIES[selectedMarker.category as CategoryKey].name}</Text>
                                    </View>

                                    <View className="flex-row justify-around mt-6">
                                       <ModalActionButton icon="navigate-outline" label={t.modal.route} onPress={handleRoute} /> 
            <ModalActionButton icon="chatbubble-ellipses-outline" label={t.modal.chat} onPress={handleChat} />
            <ModalActionButton icon="map-outline" label={t.modal.viewOnMap} onPress={handleViewOnMap} />
        </View>
                                </View >
                            </TouchableWithoutFeedback >
                        </View >
                    </TouchableOpacity >
                </Modal >
            )} */}
            </View>
        </SafeAreaView>
    );
}