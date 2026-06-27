import React, { useEffect, useState } from "react";
import { View } from "react-native";
import "../global.css";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
// 1. IMPORT SLOT DAN ROUTER DARI EXPO-ROUTER
import { Slot, useRouter } from "expo-router";

import FloatingNavbar from "@/components/FloatingNavbar/FloatingNavbar";
import StatusBottomSheet from "@/components/Status/StatusBottomSheet";
import UserProfileModal from "@/components/UserProfileModal/UserProfileModal";

import { useTab } from "@/stores/tab.store";
import CustomSplashScreen from "@/components/CustomSplashScreen/CustomSplashScreen";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const { activeTab, setActiveTab } = useTab();
  const [appIsReady, setAppIsReady] = useState(false);
  const router = useRouter(); // Ambil instance router

  // Load App Effect
  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  // 2. SINKRONISASI KLIK NAVBAR DENGAN NAVIGATION PATH EXPO ROUTER
  useEffect(() => {
    if (!appIsReady) return;

    // Ketika tab di navbar diklik, arahkan route Expo Router ke halaman tersebut
    if (activeTab === "Home") router.navigate("/");
    else if (activeTab === "Nearby") router.navigate("/nearby");
    else if (activeTab === "Chat") router.navigate("/chat");
    else if (activeTab === "Profile") router.navigate("/profile");
  }, [activeTab, appIsReady]);

  if (!appIsReady) {
    return <CustomSplashScreen onLayout={SplashScreen.hideAsync} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* 
        3. GANTI ANIMATED.VIEW LAMA DENGAN SLOT MURNI EXPO ROUTER
        Slot ini otomatis akan merender halaman sesuai URL aktif (termasuk chatRoom/[id])
      */}
      <View style={{ flex: 1 }}>
        <Slot />
      </View>

      <FloatingNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <StatusBottomSheet />
      <UserProfileModal />
    </GestureHandlerRootView>
  );
}
