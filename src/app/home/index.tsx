import React, { useEffect, useState, useRef, useMemo } from "react";
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
    FlatList,
    TouchableWithoutFeedback,
} from "react-native";
import {
    Map,
    Camera,
    Marker, CameraRef, MapRef
} from "@maplibre/maplibre-react-native";

import { Ionicons } from "@expo/vector-icons";
import locales from "./locales";

import primaryMapStyle from "@/../assets/map/primary-map.json";

import { useIsNewNotif } from "./stores/notification.store";
import { useRouteStore } from "./stores/route.store";
import RouteLine from "@/components/RouteLine/RouteLine";
import { useStatusStore } from "@/components/Status/stores/status.store";
import { SafeAreaView } from "react-native-safe-area-context";
import { clusterMarkers } from "../../constants/clusterMarkers";
import { ALL_CATEGORIES, CATEGORIES, CategoryKey, LiveFilterStatus } from "../../constants/categories";
import { FilterModal } from "@/components/FilterModal/FilterModal";
import { useLocationStore } from "@/stores/location.store";
import { useUserStore } from "@/stores/user.store";
import { UserStatus } from "@/types/userStatus.type";
import { useFilterStore } from "./stores/filter.store";
import { useShowNavbar } from "@/stores/showNavBar.store";



const INDONESIA_CENTER: [number, number] = [
    117,
    -2.5,
];

export default function HomeScreen() {
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

    // Helper function to calculate distance in meters
    const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    };

    // Helper to format time
    const formatTimeAgo = (dateString: string) => {
        if (!dateString) return '';
        const now = new Date();
        const past = new Date(dateString);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diffInSeconds < 60) return `Baru saja`;
        const minutes = Math.floor(diffInSeconds / 60);
        if (minutes < 60) return `${minutes}m lalu`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}j lalu`;
        const days = Math.floor(hours / 24);
        return `${days}h lalu`;
    };

    const { lang } = useLang();
    const t = locales[lang].homeScreen;
    const {
        isRouteMode,
        routeCoordinates,
        exitRoute,
        startRoute,
    } = useRouteStore();
    const { openStatus } = useStatusStore();

    const {
        latitude: userLatitude,
        longitude: userLongitude,
        setLocation,
        setPermission,
        hasPermission,
    } = useLocationStore();

    const { users, fetchUsers } = useUserStore();
    const { newNotif } = useIsNewNotif();

    const {
        visibleCategories,
        liveFilterStatus,
        filterRadius,
        setFilters,
    } = useFilterStore();

    const [isMapCentered, setIsMapCentered] = useState(true);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [selectedCluster, setSelectedCluster] =
        useState<UserStatus[]>([]);

    const [clusterVisible, setClusterVisible] =
        useState(false);
    const cameraRef = useRef<CameraRef>(null);
    const mapRef = useRef<MapRef>(null);

    const [cameraConfig, setCameraConfig] =
        useState({
            centerCoordinate:
                INDONESIA_CENTER as [number, number],
            zoomLevel: 10,
            pitch: 0,
            bearing: 0,
        });
    const { setNavbar } = useShowNavbar();

    useEffect(() => {
        setNavbar(true);
    }, []);
    useEffect(() => {
        requestLocation();
    }, []);

    useEffect(() => {
        if (userLatitude && userLongitude) {
            fetchUsers(userLatitude, userLongitude);
        }
    }, [userLatitude, userLongitude, fetchUsers]);

    const [currentZoom, setCurrentZoom] = useState(15);

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
        transform: [
            {
                scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1.5],
                }),
            },
        ],
        opacity: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 0],
        }),
    };

    // Style untuk gelombang kedua (dalam), dibuat delay
    const pulseStyle2 = {
        transform: [
            {
                scale: pulseAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.7, 0.7, 1.5],
                }),
            },
        ],
        opacity: pulseAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 0],
        }),
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
            console.log("Error occurred while requesting location:", error);
        }
    };

    // const toggleCategory = (category: CategoryKey) => {
    //     setVisibleCategories(prev => {
    //         const newCategories = prev.includes(category)
    //             ? prev.filter(c => c !== category)
    //             : [...prev, category];

    //         // Pastikan minimal satu kategori selalu terpilih
    //         return newCategories.length > 0 ? newCategories : prev;
    //     });
    // };

    const handleMapMove = (event: any) => {
        setIsMapCentered(false);
    }

    const recenter = () => {
        if (
            userLatitude === null ||
            userLongitude === null
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
                center: [userLongitude, userLatitude],
                duration: 1000,
            },
        );
        setIsMapCentered(true);
    };

    const filteredUsers = useMemo(() => {
        return users.filter(marker => {
            const categoryMatch = visibleCategories.includes(marker.category as CategoryKey);

            const liveStatusMatch =
                liveFilterStatus === 'all' ||
                (liveFilterStatus === 'live' && marker.is_live) ||
                (liveFilterStatus === 'regular' && !marker.is_live);

            const radiusMatch = (() => {
                if (!userLatitude || !userLongitude) return true; // Don't filter by radius if user location is not available
                const distance = getDistanceInMeters(
                    userLatitude,
                    userLongitude,
                    marker.latitude,
                    marker.longitude
                );
                return distance <= filterRadius;
            })();
            return categoryMatch && liveStatusMatch && radiusMatch;
        });
    }, [users, visibleCategories, liveFilterStatus, filterRadius, userLatitude, userLongitude]);

    const mapItems = useMemo(() => {
        return clusterMarkers(filteredUsers, currentZoom);
    }, [filteredUsers, currentZoom]);

    const ClusterModal = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={clusterVisible}
            onRequestClose={() => {
                setClusterVisible(false);
            }}
        >
            <TouchableWithoutFeedback onPress={() => setClusterVisible(false)}>
                <View className="flex-1 justify-center items-center bg-black/60 px-5">
                    {/* This inner Touchable is to prevent the modal content from closing when pressed */}
                    <TouchableWithoutFeedback>
                        <View className="w-full max-h-[60%] bg-gray-50 rounded-3xl p-5 shadow-lg">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-xl font-bold text-neutral-800">
                                    {t.modal.viewOnMap} ({selectedCluster.length})
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setClusterVisible(false)}
                                    className="h-9 w-9 bg-gray-200 rounded-full items-center justify-center"
                                >
                                    <Ionicons name="close" size={22} color="#555" />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={selectedCluster}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setClusterVisible(false);
                                            // Tunggu sebentar agar modal sempat tertutup sebelum bottom sheet muncul
                                            setTimeout(() => openStatus(item.id), 150);
                                        }}
                                        className="flex-row items-center bg-white rounded-2xl mb-3 shadow-sm overflow-hidden"
                                        activeOpacity={0.8}
                                    >
                                        {/* Color bar */}
                                        <View style={{ width: 6, height: '100%', backgroundColor: item.color }} />
                                        <Image
                                            source={{ uri: item.avatarUrl }}
                                            className="h-12 w-12 rounded-full mx-3"
                                        />
                                        <View className="flex-1 py-3">
                                            <Text className="font-bold text-base text-neutral-800">{item.name}</Text>
                                            <View className="flex-row items-center mt-1">
                                                <Text className="text-sm text-neutral-500">
                                                    {getDistance(userLatitude!, userLongitude!, item.latitude, item.longitude)}
                                                </Text>
                                                <Text className="text-sm text-neutral-400 mx-1">·</Text>
                                                <Text className="text-sm text-neutral-500">
                                                    {formatTimeAgo(item.created_at || new Date().toISOString())}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="px-4">
                                            <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
                                        </View>
                                    </TouchableOpacity>
                                )}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );

    return (
        <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
            <View className="flex-1" >
                <Map
                    ref={mapRef}
                    mapStyle={primaryMapStyle as any}

                    style={{ height: "110%" }}
                    onTouchMove={handleMapMove}
                    onTouchEnd={handleMapMove}
                    onRegionIsChanging={async (e) => {
                        if (!mapRef.current) return;
                        const zoom = await mapRef.current?.getZoom();

                        setCurrentZoom(zoom)
                    }}
                >
                    <Camera
                        ref={cameraRef}
                        duration={300}
                        minZoom={8}
                        maxZoom={15}
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
                        userLatitude &&
                        userLongitude && (
                            <Marker lngLat={[userLongitude, userLatitude]} anchor={"center"}>
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
                    {
                        mapItems.map((item) => {

                            if ("members" in item) {

                                const hasLive =
                                    item.members.some(x => x.is_live);

                                return (

                                    <Marker
                                        key={item.id}
                                        lngLat={[
                                            item.longitude,
                                            item.latitude
                                        ]}
                                        anchor="center"
                                    >

                                        <TouchableOpacity
                                            activeOpacity={0.9}
                                            onPress={() => {

                                                setSelectedCluster(
                                                    item.members as UserStatus[]
                                                );

                                                setClusterVisible(true);

                                            }}
                                        >

                                            <View
                                                style={{
                                                    width: 60,
                                                    height: 60,
                                                    borderRadius: 30,
                                                    backgroundColor: "#132648",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderWidth: 3,
                                                    borderColor: hasLive
                                                        ? "#22c55e"
                                                        : "white",
                                                }}
                                            >

                                                <Text
                                                    style={{
                                                        color: "white",
                                                        fontWeight: "bold",
                                                        fontSize: 18,
                                                    }}
                                                >
                                                    +{item.members.length}
                                                </Text>

                                            </View>

                                        </TouchableOpacity>

                                    </Marker>

                                );

                            }



                            const marker = item;

                            return (
                                <Marker
                                    key={marker.id}
                                    id={marker.id}
                                    lngLat={[marker.longitude, marker.latitude]}
                                    anchor="center"
                                >
                                    <View
                                        style={{
                                            width: 100,
                                            height: 100,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            overflow: "visible",
                                        }}
                                    >
                                        {marker.is_live && (
                                            <>
                                                <Animated.View
                                                    style={[
                                                        {
                                                            position: "absolute",
                                                            width: 90,
                                                            height: 90,
                                                            borderRadius: 45,
                                                            backgroundColor: marker.color,
                                                            bottom: 20, // Menggeser pulse agar lebih pas dengan avatar
                                                            opacity: 0.25,
                                                        },
                                                        pulseStyle1,
                                                    ]}
                                                />

                                                <Animated.View
                                                    style={[
                                                        {
                                                            position: "absolute",
                                                            width: 90,
                                                            height: 90,
                                                            borderRadius: 45,
                                                            backgroundColor: marker.color,
                                                            bottom: 20, // Menggeser pulse agar lebih pas dengan avatar
                                                            opacity: 0.15,
                                                        },
                                                        pulseStyle2,
                                                    ]}
                                                />
                                            </>
                                        )}

                                        <TouchableOpacity
                                            activeOpacity={0.9}
                                            onPress={() => openStatus(marker.id)}
                                        >
                                            <View
                                                style={{
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Image
                                                    source={{ uri: marker.avatarUrl }}
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 24,
                                                        borderWidth: 2,
                                                        borderColor: marker.color,
                                                    }}
                                                />

                                                <View
                                                    style={{
                                                        width: 0,
                                                        height: 0,
                                                        borderLeftWidth: 8,
                                                        borderRightWidth: 8,
                                                        borderTopWidth: 10,
                                                        borderLeftColor: "transparent",
                                                        borderRightColor: "transparent",
                                                        borderTopColor: marker.color,
                                                        marginTop: -2,
                                                    }}
                                                />

                                                <View
                                                    style={{
                                                        marginTop: 4,
                                                        backgroundColor: "rgba(255,255,255,.9)",
                                                        borderRadius: 999,
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 2,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: "600",
                                                        }}
                                                    >
                                                        {marker.name}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </Marker>
                            )
                        })
                    }



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

                {/* FILTER BUTTON */}
                <TouchableOpacity
                    onPress={() => setIsFilterModalVisible(true)}
                    className="absolute bottom-32 left-6 h-14 w-14 items-center justify-center rounded-full bg-white shadow-md"
                    activeOpacity={0.8}
                >
                    <Ionicons name="filter" size={22} color="#132648" />
                </TouchableOpacity>


                {/* Modal untuk menampilkan anggota cluster */}
                <ClusterModal />

                {/* Modal untuk filter */}
                <FilterModal
                    isVisible={isFilterModalVisible}
                    onClose={() => setIsFilterModalVisible(false)}
                    initialCategories={visibleCategories}
                    initialLiveStatus={liveFilterStatus}
                    initialRadius={filterRadius}
                    onApply={(categories, liveStatus, radius) => {
                        setFilters(categories, liveStatus, radius);
                        setIsFilterModalVisible(false);
                    }} />
            </View>
        </SafeAreaView>
    );
}