import React, { useState } from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { PatientStoreProvider } from "./src/store";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LogInrScreen } from "./src/screens/LogInrScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { colors } from "./src/theme";

type Tab = "home" | "log" | "chat";

const TABS: { key: Tab; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "log", label: "Log INR" },
  { key: "chat", label: "Chat" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("home");

  return (
    <SafeAreaProvider>
      <PatientStoreProvider>
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.body}>
            {tab === "home" && <HomeScreen />}
            {tab === "log" && <LogInrScreen />}
            {tab === "chat" && <ChatScreen />}
          </View>
          <View style={styles.tabBar}>
            {TABS.map((t) => (
              <Pressable key={t.key} style={styles.tabItem} onPress={() => setTab(t.key)}>
                <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      </PatientStoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabLabel: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  tabLabelActive: { color: colors.brand },
});
