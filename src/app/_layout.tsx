import React, { useContext, useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import HomeScreen from "./home";
import NearbyScreen from "./nearby";
import FloatingNavbar from "@/components/FloatingNavbar/FloatingNavbar";
import { useTab } from "@/stores/tab.store";
import ProfileScreen from "./profile";
import StatusBottomSheet from "@/components/Status/StatusBottomSheet";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatScreen from "./chat";
import UserProfileModal from "@/components/UserProfileModal/UserProfileModal";


export default function TabLayout() {
  const { activeTab, setActiveTab } = useTab();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const renderScreen = () => {
    switch (activeTab) {
      case "Home":
        return <HomeScreen />;
      case "Nearby":
        return <NearbyScreen />;
      case "Profile":
        return <ProfileScreen />;
      case "Chat":
        return <ChatScreen />;
      default:
        return <HomeScreen />;
    }
  };

  // Animasi tiap kali tab berubah
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150, // durasi animasi
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {renderScreen()}
      </Animated.View>
      <FloatingNavbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <StatusBottomSheet />
      <UserProfileModal />
    </GestureHandlerRootView>
  );
}
