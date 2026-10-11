import React, { useEffect, useState } from "react";
import "../global.css";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
// Root navigator dan router Expo Router
import { Stack, usePathname, useRouter } from "expo-router";

import FloatingNavbar from "@/components/FloatingNavbar/FloatingNavbar";
import StatusBottomSheet from "@/components/Status/StatusBottomSheet";
import UserProfileModal from "@/components/UserProfileModal/UserProfileModal";
import ViewersBottomSheet from "@/app/post/screens/viewers";

import { useTab } from "@/stores/tab.store";
import CustomSplashScreen from "@/components/CustomSplashScreen/CustomSplashScreen";
import BiometricLockScreen from "@/components/BiometricLock/BiometricLockScreen";
import ToastMessage from "react-native-toast-message";
import {
  toastConfig,
} from "@/utils/Toast";
import { useAuth } from "@/stores/auth.store";
import { useIsAppReady } from "@/stores/app.store";
import { usePushNotificationRegistration } from "@/hooks/usePushNotificationRegistration";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const { activeTab, setActiveTab } = useTab();
  const router = useRouter(); // Ambil instance router
  const pathname = usePathname(); // Ambil instance router
  const { isAppReady, setIsAppReady } = useIsAppReady(); // Ambil instance app ready store
  const { isLoggedIn, isHydrated, needsBiometricUnlock, hydrate } = useAuth(); // Ambil instance auth store

  usePushNotificationRegistration();

  const authPages = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/verify-email"];
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

  // Pulihkan sesi dari SecureStore sekali di awal (lihat auth.store.hydrate) sebelum
  // layar mana pun diputuskan -- tanpa ini, redirect di bawah selalu melempar ke
  // /auth/login duluan karena isLoggedIn masih default false.
  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Saat gerbang biometrik tampil, isLoggedIn sengaja false menunggu Face ID/Touch ID --
    // jangan ikut melempar ke /auth/login, nanti unlockWithBiometrics() yang menentukan tujuan.
    if (!isHydrated || needsBiometricUnlock) return;
    if (!isLoggedIn && !isAuthPage) {
      router.navigate("/auth/login");
    }
    if (isLoggedIn && isAuthPage) {
      router.navigate("/");
    }
  }, [pathname, isHydrated, isLoggedIn, needsBiometricUnlock]);

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


  if (!isAppReady || !isHydrated) {
    return <CustomSplashScreen onLayout={SplashScreen.hideAsync} />;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />

      {needsBiometricUnlock && <BiometricLockScreen />}

      {!isAuthPage && isAppReady && isHydrated && !needsBiometricUnlock && (
        <FloatingNavbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {isAppReady && isHydrated && !needsBiometricUnlock && (
        <>
          <StatusBottomSheet />
          <UserProfileModal />
          <ViewersBottomSheet />
        </>
      )}

      <ToastMessage
        config={toastConfig}
      />
    </GestureHandlerRootView>
  );
}
