import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Animated } from "react-native";

import "../global.css";

import {
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import * as SplashScreen from "expo-splash-screen";

import HomeScreen from "./home";
import NearbyScreen from "./nearby";
import ChatScreen from "./chat";
import ProfileScreen from "./profile";

import FloatingNavbar from "@/components/FloatingNavbar/FloatingNavbar";
import StatusBottomSheet from "@/components/Status/StatusBottomSheet";
import UserProfileModal from "@/components/UserProfileModal/UserProfileModal";

import { useTab } from "@/stores/tab.store";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {

  const { activeTab, setActiveTab } =
    useTab();

  const [appIsReady, setAppIsReady] =
    useState(false);

  /**
   * WAJIB di atas.
   */
  const fadeAnim =
    useRef(new Animated.Value(1)).current;

  /**
   * Load App
   */
  useEffect(() => {

    async function prepare() {

      try {

        await new Promise(resolve =>
          setTimeout(resolve, 4000)
        );

      } catch (e) {

        console.warn(e);

      } finally {

        setAppIsReady(true);

      }

    }

    prepare();

  }, []);

  /**
   * Hide Splash
   */
  const onLayoutRootView =
    useCallback(async () => {

      if (appIsReady) {

        await SplashScreen.hideAsync();

      }

    }, [appIsReady]);

  /**
   * Animasi ganti tab
   */
  useEffect(() => {

    if (!appIsReady) return;

    fadeAnim.setValue(0);

    Animated.timing(fadeAnim, {

      toValue: 1,

      duration: 180,

      useNativeDriver: true,

    }).start();

  }, [activeTab, appIsReady]);

  /**
   * Render Screen
   */
  const renderScreen = () => {

    switch (activeTab) {

      case "Home":
        return <HomeScreen />;

      case "Nearby":
        return <NearbyScreen />;

      case "Chat":
        return <ChatScreen />;

      case "Profile":
        return <ProfileScreen />;

      default:
        return <HomeScreen />;

    }

  };

  /**
   * Jangan render sebelum app siap
   */
  if (!appIsReady) {

    return null;

  }

  return (

    <GestureHandlerRootView
      style={{ flex: 1 }}
      onLayout={onLayoutRootView}
    >

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
        }}
      >

        {renderScreen()}

      </Animated.View>

      <FloatingNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <StatusBottomSheet />

      <UserProfileModal />

    </GestureHandlerRootView>

  );

}