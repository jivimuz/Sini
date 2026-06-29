import { Feather, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import floatingNavbar from "./locales";
import { Lang, useLang } from "@/stores/lang.store";
import { useShowNavbar } from "@/stores/showNavBar.store";
import { usePathname, useRouter } from "expo-router";

type FloatingNavbarProps = {
    activeTab: string;
    setActiveTab: (tabName: string) => void;
};

// 1. Ekstrak Komponen TabItem untuk menghindari Error Hooks di dalam .map()
type TabItemProps = {
    tab: Tab;
    isActive: boolean;
    isCenter: boolean;
    onPress: () => void;
};

const TabItem = ({ tab, isActive, isCenter, onPress }: TabItemProps) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    // 1. TAMBAHKAN: Referensi nilai animasi untuk rotasi
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isActive) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: isCenter ? -15 : -5,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                // 2. TAMBAHKAN: Putar ke angka 1 saat aktif (Gunakan Spring agar membal estetik)
                Animated.spring(rotateAnim, {
                    toValue: 1,
                    friction: 6, // Mengatur kelembutan efek membal
                    tension: 40,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: isCenter ? -8 : 5,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                // 3. TAMBAHKAN: Kembalikan putaran ke angka 0 saat tidak aktif
                Animated.spring(rotateAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [isActive, isCenter]);

    // 4. TAMBAHKAN: Interpolasi nilai angka 0-1 menjadi derajat putaran (0 sampai 360 derajat)
    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'], // Ubah ke '180deg' jika ingin putaran setengah lingkaran saja
    });

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
        >
            <Animated.View
                style={[
                    {
                        // 5. PERBAIKAN: Masukkan fungsi putar ke dalam deretan transformasi animasi
                        transform: [
                            { translateY: translateY },
                            { rotate: isCenter ? rotate : '0deg' }  // Hanya putar tombol tengah, tombol lain tetap statis
                        ],
                        alignItems: "center",
                        justifyContent: "flex-start"
                    },
                    isCenter && styles.centerButton,
                ]}
            >
                {tab.type === "MaterialIcons" ? (
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        {/* Ikon Belakang (Sebagai Outline) */}
                        <MaterialIcons
                            name={isActive ? tab.activeIcon : tab.icon}
                            size={(isCenter ? 36 : 26) + 5} // Ukuran lebih besar sedikit untuk border
                            color={isActive ? "#132648" : "#FFFFFF"}
                            style={{ position: 'absolute', width: (isCenter ? 36 : 26) + 5, height: (isCenter ? 36 : 26) + 5 }}
                        />
                        {/* Ikon Depan (Warna Utama) */}
                        <MaterialIcons
                            name={isActive ? tab.activeIcon : tab.icon}
                            size={isCenter ? 36 : 26}
                            color={"#FFFFFF"}
                        />
                    </View>
                ) : (
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        {/* Ikon Belakang (Sebagai Outline) */}
                        <Feather
                            name={isActive ? tab.activeIcon : tab.icon}
                            size={isCenter ? 36 : 26}
                            color={isActive ? "#FFC700" : "#FFFFFF"}
                        />
                        <Feather
                            name={isActive ? tab.activeIcon : tab.icon}
                            size={(isCenter ? 36 : 26) + 4}
                            color={isActive ? "#132648" : "#888888"}
                            style={{ position: 'absolute', width: (isCenter ? 36 : 26) + 5, height: (isCenter ? 36 : 26) + 5 }}
                        />
                        {/* Ikon Depan (Warna Utama) */}

                    </View>
                )}

                {!isCenter && (
                    <Animated.Text
                        style={{
                            fontSize: 11,
                            marginTop: 4,
                            color: "#132648ff",
                            opacity,
                        }}
                    >
                        {tab.title}
                    </Animated.Text>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

type Tab = { title: string; name: string; path: string; icon: any; activeIcon: any; type: "Feather" | "MaterialIcons" };

const FloatingNavbar = ({ activeTab, setActiveTab }: FloatingNavbarProps) => {
    const { lang } = useLang();
    const pathname = usePathname(); // 3. Ambil URL path saat ini secara real-time
    const router = useRouter();     // 4. Inisialisasi router untuk pindah halaman

    const tabNames = floatingNavbar[lang].floatingNavbar.buttonTitle;
    const { shownNavbar } = useShowNavbar();
    const [isVisible, setIsVisible] = React.useState(shownNavbar);

    const tabs: Tab[] = [
        { title: tabNames.home, name: "Home", path: "/home", icon: "home", activeIcon: "home", type: "Feather" },
        { title: tabNames.nearby, name: "Nearby", path: "/nearby", icon: "map-pin", activeIcon: "map-pin", type: "Feather" },
        { title: tabNames.post, name: "Post", path: "/post", icon: "camera", activeIcon: "camera", type: "MaterialIcons" },
        { title: tabNames.chat, name: "Chat", path: "/chat", icon: "message-circle", activeIcon: "message-circle", type: "Feather" },
        { title: tabNames.profile, name: "Profile", path: "/profile", icon: "user", activeIcon: "user", type: "Feather" },
    ];


    useEffect(() => {
        setIsVisible(shownNavbar);
    }, [shownNavbar]);

    if (!isVisible) {
        return null; // Jika navbar tidak ditampilkan, kembalikan null
    }
    return (
        <View style={[styles.container, styles.containerOverride]}>
            {tabs.map((tab, index) => {
                const isCenter = index === 2;

                // 6. Validasi keaktifan tombol: cek apakah URL saat ini sama dengan path tab
                const isActive = pathname === tab.path || pathname.startsWith(`${tab.path}/`);

                return (
                    <TabItem
                        key={tab.name}
                        tab={tab}
                        isActive={isActive}
                        isCenter={isCenter}
                        onPress={() => router.push(tab.path as any)} // 7. Navigasi langsung menggunakan URL
                    />
                );
            })}
        </View>
    );
};

// 2. Styling khusus untuk elemen tengah
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 65,
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        borderRadius: 25,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E0E1E6',
    },
    containerOverride: {
        overflow: "visible", // Penting agar tombol yang keluar jalur (di atas border) tidak terpotong
    },
    centerButton: {
        width: 60,
        height: 60,
        borderRadius: 35, // Lingkaran sempurna
        backgroundColor: "#FFC700", // Warna kuning untuk tombol tengah
        justifyContent: "center",
        alignItems: "center",
        bottom: 0, // Menyesuaikan ketinggian tombol agar tidak terlalu menonjol
        // Efek bayangan / shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6, // Untuk android
    },
});

export default FloatingNavbar;