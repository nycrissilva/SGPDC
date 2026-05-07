import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { professorColors, professorRadii } from "@/src/constants/professorTheme";
import { useAuth } from "@/src/contexts/AuthContext";
import { getApiErrorMessage } from "@/src/services/api";
import { getAulasHoje } from "@/src/services/agendaService";
import { notifyAulasHoje } from "@/src/services/notificationService";
import { Aula } from "@/src/types/agenda";
import { formatTime } from "@/src/utils/dateUtils";

export default function HomeProfessorScreen() {
  const { signOut, user } = useAuth();
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      setAulas(await getAulasHoje());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    notifyAulasHoje().catch(() => undefined);
  }, [load]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <View style={styles.programHeader}>
        <Text style={styles.eyebrow}>Programa</Text>
        <Text style={styles.programTitle}>Área de Professores</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.hero}>
          <View>
            <Text style={styles.eyebrow}>Agenda</Text>
            <Text style={styles.title}>Minha Agenda Semanal</Text>
            <Text style={styles.subtitle}>
              Olá, {user?.nome || user?.name || user?.email}. Acompanhe suas aulas e registre chamadas.
            </Text>
          </View>
          <Pressable onPress={signOut} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Sair</Text>
          </Pressable>
        </View>

        <View style={styles.shortcuts}>
          <Link href="/agenda" asChild>
            <Pressable style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>Agenda semanal</Text>
            </Pressable>
          </Link>
          <Link href="/chamada" asChild>
            <Pressable style={styles.purpleButton}>
              <Text style={styles.purpleButtonText}>Registrar presenças</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Aulas de hoje</Text>
          <Text style={styles.summaryNumber}>{aulas.length}</Text>
          <Text style={styles.summaryText}>{aulas.length === 1 ? "aula prevista" : "aulas previstas"}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? <ActivityIndicator color={professorColors.brandPurple} style={styles.loader} /> : null}
        {!loading && aulas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Nenhuma aula cadastrada para hoje.</Text>
          </View>
        ) : null}

        {!loading
          ? aulas.map((aula) => (
              <View key={aula.id} style={styles.lessonCard}>
                <Text style={styles.lessonName}>{aula.nome}</Text>
                <Text style={styles.lessonMeta}>
                  {aula.modalidade_nome || aula.modalidade || "Modalidade"} Nível {aula.nivel || "-"}
                </Text>
                <Text style={styles.lessonMeta}>{aula.local?.nome || aula.local_nome || "Local a confirmar"}</Text>
                <Text style={styles.timePill}>
                  {formatTime(aula.horario_inicio)} - {formatTime(aula.horario_fim)}
                </Text>
              </View>
            ))
          : null}
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
  programHeader: {
    marginBottom: 20,
  },
  eyebrow: {
    color: professorColors.brandPurple,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.6,
    textTransform: "uppercase",
  },
  programTitle: {
    color: professorColors.brandDark,
    fontSize: 30,
    fontWeight: "700",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderColor: professorColors.border,
    borderRadius: professorRadii.pageCard,
    borderWidth: 1,
    padding: 20,
  },
  hero: {
    gap: 16,
  },
  title: {
    color: professorColors.brandDark,
    fontSize: 28,
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: {
    color: professorColors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  logoutButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: professorColors.brandStrong,
    borderRadius: professorRadii.pill,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  shortcuts: {
    gap: 12,
    marginTop: 20,
  },
  outlineButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: professorColors.brandPurple,
    borderRadius: professorRadii.pill,
    borderWidth: 1,
    paddingVertical: 12,
  },
  outlineButtonText: {
    color: professorColors.brandPurple,
    fontWeight: "700",
  },
  purpleButton: {
    alignItems: "center",
    backgroundColor: professorColors.brandPurple,
    borderRadius: professorRadii.pill,
    paddingVertical: 12,
  },
  purpleButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  summaryBox: {
    backgroundColor: professorColors.surface,
    borderRadius: professorRadii.innerCard,
    marginTop: 20,
    padding: 18,
  },
  summaryLabel: {
    color: professorColors.brandPurple,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  summaryNumber: {
    color: professorColors.brandDark,
    fontSize: 42,
    fontWeight: "800",
    marginTop: 4,
  },
  summaryText: {
    color: professorColors.muted,
    fontWeight: "600",
  },
  error: {
    backgroundColor: "rgba(230,30,77,0.1)",
    borderRadius: 8,
    color: professorColors.brandStrong,
    marginTop: 18,
    padding: 12,
  },
  loader: {
    marginTop: 18,
  },
  emptyBox: {
    backgroundColor: professorColors.surface,
    borderColor: professorColors.border,
    borderRadius: professorRadii.innerCard,
    borderWidth: 1,
    marginTop: 18,
    padding: 18,
  },
  emptyText: {
    color: professorColors.muted,
  },
  lessonCard: {
    backgroundColor: "#FAFAFF",
    borderColor: professorColors.border,
    borderRadius: professorRadii.innerCard,
    borderWidth: 1,
    gap: 6,
    marginTop: 14,
    padding: 16,
  },
  lessonName: {
    color: professorColors.brandPurple,
    fontSize: 15,
    fontWeight: "700",
  },
  lessonMeta: {
    color: professorColors.muted,
  },
  timePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(230,30,77,0.1)",
    borderRadius: professorRadii.pill,
    color: professorColors.brandStrong,
    fontWeight: "700",
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
});
