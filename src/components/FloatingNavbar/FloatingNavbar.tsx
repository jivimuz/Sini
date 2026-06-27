import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import floatingNavbar from "./locales";
import { Lang, useLang } from "@/stores/lang.store";
import { useShowNavbar } from "@/stores/showNavBar.store";

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

    useEffect(() => {
        if (isActive) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: isCenter ? -15 : -5, // Jika tombol tengah aktif, naik sedikit lagi
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: isCenter ? -8 : 5, // Tombol tengah defaultnya selalu menonjol ke atas
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isActive, isCenter]);

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
        >
            <Animated.View
                style={[
                    { transform: [{ translateY }], alignItems: "center", justifyContent: "flex-start" }, // Mengubah justifyContent
                    isCenter && styles.centerButton, // Style khusus untuk membuat bulatan
                ]}
            >
                <Feather
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={isCenter ? 40 : 26} // Ikon tengah sengaja dibesarkan
                    color={
                        isCenter ? "#000000" : (isActive ? "#132648" : "#888888") // Ikon tengah hitam, lainnya sesuai state

                    }
                />

                {/* Label teks tidak ditampilkan untuk tombol tengah agar desain bulatnya estetik */}
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

type Tab = { title: string; name: string; icon: keyof typeof Feather.glyphMap; activeIcon: keyof typeof Feather.glyphMap };

const FloatingNavbar = ({ activeTab, setActiveTab }: FloatingNavbarProps) => {
    const { lang } = useLang();

    // Mendefinisikan nama tab berdasarkan bahasa yang aktif
    const tabNames = floatingNavbar[lang].floatingNavbar.buttonTitle;
    const { shownNavbar } = useShowNavbar();
    const [isVisible, setIsVisible] = React.useState(shownNavbar);

    const tabs: Tab[] = [
        { title: tabNames.home, name: "Home", icon: "home", activeIcon: "home" },
        { title: tabNames.nearby, name: "Nearby", icon: "map-pin", activeIcon: "map-pin" },
        { title: tabNames.post, name: "Create Post", icon: "plus", activeIcon: "plus" },
        { title: tabNames.chat, name: "Chat", icon: "message-circle", activeIcon: "message-circle" },
        { title: tabNames.profile, name: "Profile", icon: "user", activeIcon: "user" },
    ];

    useEffect(() => {
        setIsVisible(shownNavbar);
    }, [shownNavbar]);

    if (!isVisible) {
        return null; // Jika navbar tidak ditampilkan, kembalikan null
    }
    return (
        <View
            style={[
                styles.container, // Hanya menggunakan satu style container
                styles.containerOverride, // Menambahkan override agar efek pop-out tidak terpotong (clip)
            ]}
        >
            {tabs.map((tab, index) => {
                // Mendeteksi apakah iterasi berada tepat di tengah (index 2 untuk 5 tombol)
                const isCenter = index === 2;

                return (
                    <TabItem
                        key={tab.name}
                        tab={tab}
                        isActive={activeTab === tab.name}
                        isCenter={isCenter}
                        onPress={() => setActiveTab(tab.name)}
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