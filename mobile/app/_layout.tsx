import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { router, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

function AuthGate() {
  const { loading, signed } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inLogin = segments[0] === "login";
    if (!signed && !inLogin) {
      router.replace("/login");
    }
    if (signed && inLogin) {
      router.replace("/(professor)");
    }
  }, [loading, segments, signed]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2f6f73" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(professor)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: "#f7f3ee",
    flex: 1,
    justifyContent: "center",
  },
});
