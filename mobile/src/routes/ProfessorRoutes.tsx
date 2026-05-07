import { Stack } from "expo-router";

export function ProfessorRoutes() {
  return (
    <Stack>
      <Stack.Screen name="(professor)" options={{ headerShown: false }} />
    </Stack>
  );
}
