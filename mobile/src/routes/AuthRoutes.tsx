import { Stack } from "expo-router";

export function AuthRoutes() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}
