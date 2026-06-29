import React, { useEffect, useState } from "react";
import { View } from "react-native";
import "../global.css";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
// 1. IMPORT SLOT DAN ROUTER DARI EXPO-ROUTER
import { Slot, usePathname, useRouter } from "expo-router";

import FloatingNavbar from "@/components/FloatingNavbar/FloatingNavbar";
import StatusBottomSheet from "@/components/Status/StatusBottomSheet";
import UserProfileModal from "@/components/UserProfileModal/UserProfileModal";

import { useTab } from "@/stores/tab.store";
import CustomSplashScreen from "@/components/CustomSplashScreen/CustomSplashScreen";
import ToastMessage from "react-native-toast-message";
import {
  toastConfig,
} from "@/utils/Toast";
import { useAuth } from "@/stores/auth.store";
import { useIsAppReady } from "@/stores/app.store";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const { activeTab, setActiveTab } = useTab();
  const router = useRouter(); // Ambil instance router
  const pathname = usePathname(); // Ambil instance router
  const { isAppReady, setIsAppReady } = useIsAppReady(); // Ambil instance app ready store
  const { isLoggedIn } = useAuth(); // Ambil instance auth store

  const authPages = ["/auth/login", "/auth/register", "/auth/forgot-password"];
  const isAuthPage = authPages.includes(pathname);

  // Load App Effect
  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsAppReady(true);
      }
    }
    prepare();
  }, [isAppReady]);

  useEffect(() => {
    if (!isLoggedIn && !isAuthPage) {
      router.navigate("/auth/login");
    }
    if (isLoggedIn && isAuthPage) {
      router.navigate("/");
    }
  }, [pathname]);

  // 2. SINKRONISASI KLIK NAVBAR DENGAN NAVIGATION PATH EXPO ROUTER
  useEffect(() => {
    if (!isAppReady) return;


    // Ketika tab di navbar diklik, arahkan route Expo Router ke halaman tersebut
    if (activeTab === "Home") router.navigate("/");
    else if (activeTab === "Nearby") router.navigate("/nearby");
    else if (activeTab === "Post") router.navigate("/post");
    else if (activeTab === "Chat") router.navigate("/chat");
    else if (activeTab === "Profile") router.navigate("/profile");
  }, [activeTab, isAppReady]);


  if (!isAppReady) {
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

      {!isAuthPage && (
        <FloatingNavbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      <StatusBottomSheet />
      <UserProfileModal />

      <ToastMessage
        config={toastConfig}
      />
    </GestureHandlerRootView>
  );
}
