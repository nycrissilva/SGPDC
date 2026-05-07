import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { professorColors, professorRadii } from "@/src/constants/professorTheme";
import { getApiErrorMessage } from "@/src/services/api";
import { getAulasHoje } from "@/src/services/agendaService";
import { Aula } from "@/src/types/agenda";
import { formatTime } from "@/src/utils/dateUtils";

export default function AulasHojeScreen() {
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
  }, [load]);

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Agenda</Text>
        <Text style={styles.title}>Aulas de Hoje</Text>
        <Text style={styles.subtitle}>Resumo das aulas previstas para esta data.</Text>
      </View>

      <View style={styles.card}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? <ActivityIndicator color={professorColors.brandPurple} /> : null}
        {!loading && aulas.length === 0 ? <Text style={styles.emptyText}>Nenhuma aula prevista para hoje.</Text> : null}

        {aulas.map((aula) => (
          <View key={aula.id} style={styles.lessonCard}>
            <Text style={styles.lessonName}>{aula.nome}</Text>
            <Text style={styles.lessonMeta}>
              {aula.modalidade_nome || aula.modalidade || "Modalidade"} Nível {aula.nivel || "-"}
            </Text>
            <Text style={styles.lessonMeta}>{aula.local?.nome || aula.local_nome || "Local a confirmar"}</Text>
            <Text style={styles.timePill}>
              {formatTime(aula.horario_inicio)} - {formatTime(aula.horario_fim)}
            </Text>
            {aula.local_id ? (
              <Link href={{ pathname: "/local-aula", params: { localId: String(aula.local_id), turma: aula.nome } }} asChild>
                <Pressable style={styles.localButton}>
                  <Text style={styles.localButtonText}>Ver local da aula</Text>
                </Pressable>
              </Link>
            ) : null}
          </View>
        ))}
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
    fontSize: 14,
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
  localButton: {
    alignSelf: "flex-start",
    borderColor: professorColors.brandDark,
    borderRadius: professorRadii.pill,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  localButtonText: {
    color: professorColors.brandDark,
    fontWeight: "700",
  },
});
