import { supabase } from "@/utils/supabase";
import { router, Slot, Tabs, useNavigation } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Activity, DoorOpen, LogOut, QrCode } from "lucide-react-native";
import { cssInterop } from "nativewind";
import { auth } from "@/services/auth";
import { useEffect } from "react";

cssInterop(QrCode, { className: "style" });
cssInterop(Activity, { className: "style" });
cssInterop(LogOut, { className: "style" });

export default function SecurityLayout() {
  const insets = useSafeAreaInsets()
  const tabBarLabel = ({ focused, children }: { focused: boolean, children: any }) => (
    <Text className={`text-xl ${focused ? 'text-white' : 'text-[#8E8E8F]'}`}>{children}</Text>
  )
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: 'white',
      tabBarStyle: tabStyle.tabs,
      tabBarLabel: tabBarLabel,
    }} safeAreaInsets={{ top: insets.top, bottom: insets.bottom, left: insets.left, right: insets.right }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Escanear',
          headerShown: false,
          tabBarIcon: ({ color }) => <QrCode size={38} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gate"
        options={{
          title: 'Puerta',
          headerShown: false,
          tabBarIcon: ({ color }) => <DoorOpen size={38} color={color} />,
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: 'Cerrar sesión',
          headerShown: false,
          tabBarIcon: ({ color }) => <LogOut size={38} color={color} />,
        }}
      />
    </Tabs>
  )
}

const tabStyle = StyleSheet.create({
  tabs: {
    backgroundColor: 'black',
    height: 96,
    paddingVertical: 16,

  }
})
