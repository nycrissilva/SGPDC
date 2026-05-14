import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { professorColors, professorRadii } from "@/src/constants/professorTheme";
import { getApiErrorMessage } from "@/src/services/api";
import { getAgendaSemanal } from "@/src/services/agendaService";
import { Aula } from "@/src/types/agenda";
import { addWeeks, formatDateBR, formatTime, getStartOfWeek, getWeekRange, sameWeekday } from "@/src/utils/dateUtils";

const WEEK_DAYS = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

function getWeekLabel(start: Date) {
  const range = getWeekRange(start);
  return `${formatDateBR(range.inicio)} - ${formatDateBR(range.fim)}`;
}

function sortByHorario(a: Aula, b: Aula) {
  const inicio = String(a.horario_inicio || "").localeCompare(String(b.horario_inicio || ""));
  if (inicio !== 0) return inicio;
  return String(a.horario_fim || "").localeCompare(String(b.horario_fim || ""));
}

export default function AgendaSemanalScreen() {
  const [weekStart, setWeekStart] = useState(getStartOfWeek());
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const range = useMemo(() => getWeekRange(weekStart), [weekStart]);

  const load = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const data = await getAgendaSemanal(range);
      setAulas(data.filter((aula) => aula.status !== "INATIVO").sort(sortByHorario));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const agendaPorDia = useMemo(() => {
    const grouped: Record<string, Aula[]> = {};
    WEEK_DAYS.forEach((day) => {
      grouped[day] = aulas.filter((aula) => sameWeekday(aula.dia_semana, day)).sort(sortByHorario);
    });
    return grouped;
  }, [aulas]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Agenda</Text>
          <Text style={styles.title}>Minha Agenda Semanal</Text>
          <Text style={styles.subtitle}>Aulas organizadas por dia da semana e horário.</Text>
        </View>

        <Link href="/chamada" asChild>
          <Pressable style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>Registrar presenças</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Semana</Text>
          <Text style={styles.cardTitle}>Navegação</Text>

          <View style={styles.weekBox}>
            <Text style={styles.weekText}>{getWeekLabel(weekStart)}</Text>
            <View style={styles.weekButtons}>
              <Pressable onPress={() => setWeekStart((date) => addWeeks(date, -1))} style={styles.weekButton}>
                <Text style={styles.weekButtonText}>Semana anterior</Text>
              </Pressable>
              <Pressable onPress={() => setWeekStart((date) => addWeeks(date, 1))} style={styles.weekButton}>
                <Text style={styles.weekButtonText}>Próxima semana</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Agenda Semanal</Text>
          <Text style={styles.cardTitle}>Minhas Aulas</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading ? <ActivityIndicator color={professorColors.brandPurple} style={styles.loader} /> : null}

          {!loading && aulas.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Nenhuma aula cadastrada para este professor.</Text>
            </View>
          ) : null}

          {!loading
            ? WEEK_DAYS.map((day) => (
                <View key={day} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{day}</Text>
                    <Text style={styles.countPill}>{agendaPorDia[day].length} aula(s)</Text>
                  </View>

                  {agendaPorDia[day].length === 0 ? <Text style={styles.emptyDay}>Nenhuma aula neste dia.</Text> : null}

                  {agendaPorDia[day].map((aula) => (
                    <View key={`${day}-${aula.id}`} style={styles.lessonCard}>
                      <View style={styles.lessonTop}>
                        <View style={styles.lessonInfo}>
                          <Text style={styles.lessonName}>{aula.nome}</Text>
                          <Text style={styles.lessonMeta}>
                            {aula.modalidade_nome || aula.modalidade || "Modalidade"} Nível {aula.nivel || "-"}
                          </Text>
                          <Text style={styles.lessonLocal}>{aula.local?.nome || aula.local_nome || "Local a confirmar"}</Text>
                        </View>
                        <Text style={styles.timePill}>
                          {formatTime(aula.horario_inicio)} - {formatTime(aula.horario_fim)}
                        </Text>
                      </View>
                      {aula.local_id ? (
                        <Link
                          href={{
                            pathname: "/local-aula",
                            params: { localId: String(aula.local_id), turma: aula.nome },
                          }}
                          asChild
                        >
                          <Pressable style={styles.localButton}>
                            <Text style={styles.localButtonText}>Ver local</Text>
                          </Pressable>
                        </Link>
                      ) : null}
                    </View>
                  ))}
                </View>
              ))
            : null}
        </View>
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
    gap: 16,
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
    lineHeight: 20,
    marginTop: 8,
  },
  outlineButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderColor: professorColors.brandPurple,
    borderRadius: professorRadii.pill,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  outlineButtonText: {
    color: professorColors.brandPurple,
    fontSize: 14,
    fontWeight: "700",
  },
  grid: {
    gap: 18,
  },
  card: {
    backgroundColor: "#fff",
    borderColor: professorColors.border,
    borderRadius: professorRadii.pageCard,
    borderWidth: 1,
    padding: 20,
  },
  cardEyebrow: {
    color: professorColors.brandPurple,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.4,
    textTransform: "uppercase",
  },
  cardTitle: {
    color: professorColors.brandDark,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  weekBox: {
    backgroundColor: professorColors.surface,
    borderRadius: professorRadii.innerCard,
    marginTop: 18,
    padding: 16,
  },
  weekText: {
    color: professorColors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  weekButtons: {
    gap: 10,
    marginTop: 14,
  },
  weekButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: professorColors.border,
    borderRadius: professorRadii.pill,
    borderWidth: 1,
    paddingVertical: 10,
  },
  weekButtonText: {
    color: professorColors.brandDark,
    fontSize: 14,
    fontWeight: "600",
  },
  loader: {
    marginTop: 20,
  },
  error: {
    backgroundColor: "rgba(230,30,77,0.1)",
    borderRadius: 8,
    color: professorColors.brandStrong,
    marginTop: 16,
    padding: 12,
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
  dayCard: {
    backgroundColor: "#FAFAFF",
    borderColor: professorColors.border,
    borderRadius: professorRadii.innerCard,
    borderWidth: 1,
    marginTop: 18,
    padding: 16,
  },
  dayHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dayTitle: {
    color: professorColors.brandDark,
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
  },
  countPill: {
    backgroundColor: professorColors.border,
    borderRadius: professorRadii.pill,
    color: professorColors.muted,
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: "uppercase",
  },
  emptyDay: {
    color: "#6B7280",
    fontSize: 14,
  },
  lessonCard: {
    backgroundColor: "#fff",
    borderColor: professorColors.border,
    borderRadius: professorRadii.innerCard,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  lessonTop: {
    gap: 12,
  },
  lessonInfo: {
    gap: 5,
  },
  lessonName: {
    color: professorColors.brandPurple,
    fontSize: 15,
    fontWeight: "700",
  },
  lessonMeta: {
    color: professorColors.muted,
    fontSize: 14,
  },
  lessonLocal: {
    color: "#6B7280",
    fontSize: 13,
  },
  timePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(230,30,77,0.1)",
    borderRadius: professorRadii.pill,
    color: professorColors.brandStrong,
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  localButton: {
    alignSelf: "flex-start",
    borderColor: professorColors.brandDark,
    borderRadius: professorRadii.pill,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  localButtonText: {
    color: professorColors.brandDark,
    fontWeight: "700",
  },
});
