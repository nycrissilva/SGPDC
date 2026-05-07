import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

// eslint-disable-next-line import/no-unresolved
import AulaMap from "@/src/components/AulaMap";
import { professorColors, professorRadii } from "@/src/constants/professorTheme";
import { getApiErrorMessage } from "@/src/services/api";
import { getLocalAula } from "@/src/services/agendaService";
import { LocalAula } from "@/src/types/agenda";

function formatAddress(local?: LocalAula | null) {
  if (!local) return "";
  return [local.rua, local.numero, local.bairro, local.cidade, local.cep].filter(Boolean).join(", ");
}

export default function LocalAulaScreen() {
  const params = useLocalSearchParams<{ localId?: string; turma?: string }>();
  const [local, setLocal] = useState<LocalAula | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const coordinates = useMemo(() => {
    const latitude = Number(local?.latitude);
    const longitude = Number(local?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  }, [local]);

  const load = useCallback(async () => {
    const localId = Number(params.localId);
    if (!localId) {
      setLoading(false);
      return;
    }

    try {
      setError("");
      setLoading(true);
      setLocal(await getLocalAula(localId));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [params.localId]);

  useEffect(() => {
    load();
  }, [load]);

  async function openMaps() {
    const address = formatAddress(local);
    const query = coordinates ? `${coordinates.latitude},${coordinates.longitude}` : encodeURIComponent(address);
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${query}`,
      android: `google.navigation:q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });

    if (!url) {
      Alert.alert("Mapa", "Não foi possível abrir o aplicativo de mapas.");
      return;
    }

    await Linking.openURL(url);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Local</Text>
        <Text style={styles.title}>Local da Aula</Text>
        {params.turma ? <Text style={styles.subtitle}>{params.turma}</Text> : null}
      </View>

      <View style={styles.card}>
        {loading ? <ActivityIndicator color={professorColors.brandPurple} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !local ? <Text style={styles.emptyText}>Local não encontrado.</Text> : null}

        {local ? (
          <>
            <Text style={styles.localName}>{local.nome}</Text>
            <Text style={styles.address}>{formatAddress(local) || "Endereço não informado."}</Text>

            {coordinates ? (
              <AulaMap coordinates={coordinates} title={local.nome} description={formatAddress(local)} style={styles.map} />
            ) : (
              <View style={styles.noMap}>
                <Text style={styles.noMapText}>Latitude e longitude ainda não cadastradas para este local.</Text>
              </View>
            )}

            <Pressable onPress={openMaps} style={styles.button}>
              <Text style={styles.buttonText}>Abrir rota no mapa</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: professorColors.background,
    flexGrow: 1,
    padding: 20,
    paddingTop: 56,
  },
  header: {
    marginBottom: 24,
  },
  eyebrow: {
    color: professorColors.brandPurple,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.6,
    textTransform: "uppercase",
  },
  title: {
    color: professorColors.brandDark,
    fontSize: 30,
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: {
    color: professorColors.muted,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderColor: professorColors.border,
    borderRadius: professorRadii.pageCard,
    borderWidth: 1,
    padding: 20,
  },
  error: {
    backgroundColor: "rgba(230,30,77,0.1)",
    borderRadius: 8,
    color: professorColors.brandStrong,
    marginBottom: 14,
    padding: 12,
  },
  emptyText: {
    color: professorColors.muted,
  },
  localName: {
    color: professorColors.brandDark,
    fontSize: 22,
    fontWeight: "700",
  },
  address: {
    color: professorColors.muted,
    lineHeight: 21,
    marginTop: 8,
  },
  map: {
    borderRadius: professorRadii.innerCard,
    height: 260,
    marginTop: 16,
    overflow: "hidden",
    width: "100%",
  },
  noMap: {
    alignItems: "center",
    backgroundColor: professorColors.surface,
    borderRadius: professorRadii.innerCard,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 160,
    padding: 16,
  },
  noMapText: {
    color: professorColors.muted,
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    backgroundColor: professorColors.brandPurple,
    borderRadius: professorRadii.pill,
    marginTop: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
  },
});
