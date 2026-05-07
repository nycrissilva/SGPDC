import { Stack } from "expo-router";

export default function ProfessorLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: "#f7f3ee" },
        headerBackTitle: "Voltar",
        headerTintColor: "#2f6f73",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="agenda" options={{ title: "Agenda semanal" }} />
      <Stack.Screen name="aulas-hoje" options={{ title: "Aulas de hoje" }} />
      <Stack.Screen name="chamada" options={{ title: "Chamada" }} />
      <Stack.Screen name="local-aula" options={{ title: "Local da aula" }} />
    </Stack>
  );
}
