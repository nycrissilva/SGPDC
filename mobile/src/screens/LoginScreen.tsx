import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "@/src/contexts/AuthContext";
import { getApiErrorMessage } from "@/src/services/api";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    if (!email.trim() || !senha) {
      setError("Preencha email e senha.");
      return;
    }

    try {
      setLoading(true);
      await signIn(email, senha);
      router.replace("/(professor)");
    } catch (error) {
      setError(error instanceof Error ? error.message : getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.appName}>Projeto Dança Comunidade</Text>
          <Text style={styles.title}>Fazer Login</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#8B95A1"
            style={styles.input}
            value={email}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setSenha}
            placeholder="Digite sua senha"
            placeholderTextColor="#8B95A1"
            secureTextEntry
            style={styles.input}
            value={senha}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable disabled={loading} onPress={handleLogin} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#fff",
    flex: 1,
    justifyContent: "center",
    padding: 18,
  },
  content: {
    gap: 24,
    maxWidth: 896,
    width: "100%",
  },
  hero: {
    backgroundColor: "#1F2A5A",
    borderRadius: 32,
    padding: 24,
  },
  appName: {
    color: "rgba(242,242,242,0.8)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2.8,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
    marginTop: 16,
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 32,
    boxShadow: Platform.OS === "web" ? "0 1px 8px rgba(31,42,90,0.08)" : undefined,
    elevation: 2,
    gap: 12,
    padding: 24,
  },
  label: {
    color: "#1F2A5A",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    borderRadius: 24,
    borderWidth: 1,
    color: "#2B2B2B",
    fontSize: 14,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  error: {
    color: "#E61E4D",
    fontSize: 14,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#E61E4D",
    borderRadius: 999,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 48,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
