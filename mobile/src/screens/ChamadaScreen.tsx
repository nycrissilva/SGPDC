import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { professorColors, professorRadii } from "@/src/constants/professorTheme";
import { getApiErrorMessage } from "@/src/services/api";
import { getAlunosDaTurma, getDatasDaTurma, getTurmasParaChamada, salvarChamada } from "@/src/services/presencaService";
import { Chamada, DataChamada, PeriodoLetivo } from "@/src/types/presenca";
import { AlunoTurma, Turma } from "@/src/types/turma";
import { formatDateBR } from "@/src/utils/dateUtils";

function alunoNome(aluno: AlunoTurma) {
  return aluno.nome || aluno.aluno_nome || "Aluno";
}

export default function ChamadaScreen() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoLetivo | null>(null);
  const [datas, setDatas] = useState<DataChamada[]>([]);
  const [data, setData] = useState("");
  const [alunos, setAlunos] = useState<AlunoTurma[]>([]);
  const [chamada, setChamada] = useState<Chamada | null>(null);
  const [semAula, setSemAula] = useState(false);
  const [motivoSemAula, setMotivoSemAula] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const turmaSelecionada = useMemo(() => turmas.find((turma) => turma.id === selectedTurmaId), [selectedTurmaId, turmas]);

  const loadTurmas = useCallback(async () => {
    try {
      setError("");
      setSuccess("");
      setLoading(true);
      const loadedTurmas = await getTurmasParaChamada();
      setTurmas(loadedTurmas);
      setSelectedTurmaId((current) => current ?? loadedTurmas[0]?.id ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDatas = useCallback(async (turmaId: number) => {
    try {
      setError("");
      setSuccess("");
      setLoading(true);
      const payload = await getDatasDaTurma(turmaId);
      const loadedDatas = Array.isArray(payload.datas) ? payload.datas : [];
      setPeriodo(payload.periodo || null);
      setDatas(loadedDatas);
      setData((current) => {
        if (current && loadedDatas.some((item) => item.data === current)) return current;
        return loadedDatas[0]?.data || "";
      });
    } catch (err) {
      setPeriodo(null);
      setDatas([]);
      setData("");
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPresencas = useCallback(async (turmaId: number, dataValue: string) => {
    try {
      setError("");
      setSuccess("");
      setLoading(true);
      const payload = await getAlunosDaTurma(turmaId, dataValue);
      const loadedAlunos = Array.isArray(payload.alunos) ? payload.alunos : [];
      const loadedChamada = payload.chamada || null;
      setAlunos(loadedAlunos.map((aluno) => ({ ...aluno, presente: aluno.presente === true || aluno.presente === 1 })));
      setChamada(loadedChamada);
      setSemAula(Boolean(loadedChamada?.sem_aula));
      setMotivoSemAula(loadedChamada?.motivo_sem_aula || "");
    } catch (err) {
      setAlunos([]);
      setChamada(null);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTurmas();
  }, [loadTurmas]);

  useEffect(() => {
    if (selectedTurmaId) {
      loadDatas(selectedTurmaId);
    } else {
      setDatas([]);
      setData("");
      setAlunos([]);
      setChamada(null);
    }
  }, [loadDatas, selectedTurmaId]);

  useEffect(() => {
    if (selectedTurmaId && data) {
      loadPresencas(selectedTurmaId, data);
    } else {
      setAlunos([]);
      setChamada(null);
      setSemAula(false);
      setMotivoSemAula("");
    }
  }, [data, loadPresencas, selectedTurmaId]);

  function togglePresenca(matriculaTurmaId: number) {
    setAlunos((current) =>
      current.map((aluno) =>
        aluno.matricula_turma_id === matriculaTurmaId ? { ...aluno, presente: !Boolean(aluno.presente) } : aluno,
      ),
    );
  }

  async function handleSubmit() {
    setError("");
    setSuccess("");

    if (!selectedTurmaId || !data) {
      setError("Selecione uma turma e uma data antes de finalizar.");
      return;
    }

    if (semAula && !motivoSemAula.trim()) {
      setError("Informe o motivo quando marcar que não teve aula.");
      return;
    }

    try {
      setSaving(true);
      const result = await salvarChamada({
        turmaId: selectedTurmaId,
        data,
        semAula,
        motivoSemAula,
        presencas: alunos.map((aluno) => ({
          matricula_turma_id: aluno.matricula_turma_id,
          presente: Boolean(aluno.presente),
        })),
      });
      setChamada(result?.chamada || null);
      setSuccess("Chamada finalizada com sucesso.");
      await loadDatas(selectedTurmaId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Presença</Text>
          <Text style={styles.title}>Registrar Chamada</Text>
          <Text style={styles.subtitle}>As datas aparecem conforme o dia da turma dentro do período letivo ativo.</Text>
        </View>
        <Link href="/agenda" asChild>
          <Pressable style={styles.backButton}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </Pressable>
        </Link>
      </View>

      {success ? <Text style={styles.successBox}>{success}</Text> : null}
      {error ? <Text style={styles.errorBox}>{error}</Text> : null}

      <View style={styles.formCard}>
        <Text style={styles.label}>Turma</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {turmas.map((turma) => (
            <Pressable
              key={turma.id}
              onPress={() => setSelectedTurmaId(turma.id)}
              style={[styles.chip, turma.id === selectedTurmaId && styles.chipActive]}
            >
              <Text style={[styles.chipText, turma.id === selectedTurmaId && styles.chipTextActive]}>{turma.nome}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {turmaSelecionada ? (
          <Text style={styles.helperText}>
            {turmaSelecionada.modalidade_nome || turmaSelecionada.modalidade || "Modalidade"} ({turmaSelecionada.nivel || "Nível"})
          </Text>
        ) : null}

        <Text style={styles.label}>Data da aula</Text>
        {datas.length === 0 ? (
          <View style={styles.disabledBox}>
            <Text style={styles.disabledText}>
              {periodo ? "Nenhuma data disponível para esta turma." : "Nenhum período letivo ativo cadastrado."}
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {datas.map((item) => (
              <Pressable
                key={item.data}
                onPress={() => setData(item.data)}
                style={[styles.dateChip, item.data === data && styles.dateChipActive]}
              >
                <Text style={[styles.dateText, item.data === data && styles.dateTextActive]}>{formatDateBR(item.data)}</Text>
                {item.chamada?.finalizada ? <Text style={styles.dateStatus}>finalizada</Text> : null}
                {item.chamada?.sem_aula ? <Text style={styles.dateStatus}>sem aula</Text> : null}
              </Pressable>
            ))}
          </ScrollView>
        )}

        {periodo ? (
          <Text style={styles.helperText}>
            {periodo.nome}: {formatDateBR(periodo.data_inicio)} a {formatDateBR(periodo.data_fim)}
          </Text>
        ) : null}

        <Pressable onPress={() => setSemAula((current) => !current)} style={styles.checkboxRow}>
          <View style={[styles.checkbox, semAula && styles.checkboxActive]}>
            {semAula ? <Text style={styles.checkboxMark}>✓</Text> : null}
          </View>
          <Text style={styles.checkboxText}>Não teve aula nesta data</Text>
        </Pressable>

        {semAula ? (
          <TextInput
            onChangeText={setMotivoSemAula}
            placeholder="Ex: feriado, evento, recesso"
            placeholderTextColor="#8B95A1"
            style={styles.input}
            value={motivoSemAula}
          />
        ) : null}

        <View style={styles.submitFooter}>
          <Text style={styles.footerText}>
            {chamada?.finalizada
              ? "Esta chamada já foi finalizada. Ao finalizar novamente, as alterações serão salvas."
              : "Finalize para registrar presenças e faltas."}
          </Text>
          <Pressable disabled={!selectedTurmaId || !data || loading || saving} onPress={handleSubmit} style={styles.submitButton}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Finalizar chamada</Text>}
          </Pressable>
        </View>
      </View>

      <View style={styles.listCard}>
        <Text style={styles.cardEyebrow}>Alunos</Text>
        <Text style={styles.cardTitle}>Lista de Presença</Text>
        <Text style={styles.cardDescription}>
          {semAula
            ? "A lista fica preservada, mas esta data será registrada como sem aula."
            : "Marque quem esteve presente; os demais ficam como falta."}
        </Text>

        {loading ? <ActivityIndicator color={professorColors.brandPurple} style={styles.loader} /> : null}
        {!loading && !selectedTurmaId ? <Text style={styles.emptyText}>Selecione uma turma para exibir as datas.</Text> : null}
        {!loading && selectedTurmaId && !data ? <Text style={styles.emptyText}>Selecione uma data do período letivo para iniciar a chamada.</Text> : null}
        {!loading && selectedTurmaId && data && alunos.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum aluno matriculado nesta turma.</Text>
        ) : null}

        {!loading
          ? alunos.map((aluno) => (
              <View key={aluno.matricula_turma_id} style={styles.studentRow}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{alunoNome(aluno)}</Text>
                  <Text style={styles.studentStatus}>{aluno.presente ? "Presente" : "Falta"}</Text>
                </View>
                <Pressable
                  disabled={semAula}
                  onPress={() => togglePresenca(aluno.matricula_turma_id)}
                  style={[styles.presenceSwitch, aluno.presente && styles.presenceSwitchActive, semAula && styles.presenceSwitchDisabled]}
                >
                  <Text style={[styles.presenceSwitchText, aluno.presente && styles.presenceSwitchTextActive]}>
                    {aluno.presente ? "Presente" : "Falta"}
                  </Text>
                </Pressable>
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
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderColor: professorColors.brandDark,
    borderRadius: professorRadii.pill,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backButtonText: {
    color: professorColors.brandDark,
    fontWeight: "700",
  },
  successBox: {
    backgroundColor: "rgba(106,79,191,0.1)",
    borderRadius: 8,
    color: professorColors.brandPurple,
    marginBottom: 16,
    padding: 12,
  },
  errorBox: {
    backgroundColor: "rgba(230,30,77,0.1)",
    borderRadius: 8,
    color: professorColors.brandStrong,
    marginBottom: 16,
    padding: 12,
  },
  formCard: {
    backgroundColor: "#fff",
    borderColor: professorColors.border,
    borderRadius: professorRadii.pageCard,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  label: {
    color: professorColors.brandDark,
    fontSize: 14,
    fontWeight: "700",
  },
  chipRow: {
    gap: 10,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: "#fff",
    borderColor: "#D1D5DB",
    borderRadius: professorRadii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: professorColors.brandPurple,
    borderColor: professorColors.brandPurple,
  },
  chipText: {
    color: professorColors.brandDark,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#fff",
  },
  helperText: {
    color: professorColors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  disabledBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: professorRadii.innerCard,
    padding: 14,
  },
  disabledText: {
    color: professorColors.brandStrong,
    fontSize: 13,
  },
  dateRow: {
    gap: 10,
    paddingVertical: 2,
  },
  dateChip: {
    backgroundColor: "#fff",
    borderColor: "#D1D5DB",
    borderRadius: professorRadii.innerCard,
    borderWidth: 1,
    minWidth: 116,
    padding: 12,
  },
  dateChipActive: {
    borderColor: professorColors.brandPurple,
    borderWidth: 2,
  },
  dateText: {
    color: professorColors.brandDark,
    fontWeight: "800",
  },
  dateTextActive: {
    color: professorColors.brandPurple,
  },
  dateStatus: {
    color: professorColors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  checkboxRow: {
    alignItems: "center",
    backgroundColor: professorColors.surface,
    borderColor: professorColors.border,
    borderRadius: professorRadii.innerCard,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  checkbox: {
    alignItems: "center",
    borderColor: "#D1D5DB",
    borderRadius: 6,
    borderWidth: 1,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  checkboxActive: {
    backgroundColor: professorColors.brandPurple,
    borderColor: professorColors.brandPurple,
  },
  checkboxMark: {
    color: "#fff",
    fontWeight: "900",
  },
  checkboxText: {
    color: professorColors.brandDark,
    flex: 1,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#D1D5DB",
    borderRadius: professorRadii.pill,
    borderWidth: 1,
    color: professorColors.brandDark,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  submitFooter: {
    gap: 14,
    marginTop: 4,
  },
  footerText: {
    color: professorColors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: professorColors.brandPurple,
    borderRadius: professorRadii.pill,
    justifyContent: "center",
    minHeight: 48,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  listCard: {
    backgroundColor: "#fff",
    borderColor: professorColors.border,
    borderRadius: professorRadii.pageCard,
    borderWidth: 1,
    marginTop: 18,
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
  cardDescription: {
    color: professorColors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  loader: {
    marginTop: 18,
  },
  emptyText: {
    color: professorColors.muted,
    marginTop: 18,
  },
  studentRow: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomColor: professorColors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  studentInfo: {
    flex: 1,
    gap: 4,
  },
  studentName: {
    color: professorColors.brandDark,
    fontSize: 15,
    fontWeight: "700",
  },
  studentStatus: {
    color: professorColors.text,
    fontSize: 13,
  },
  presenceSwitch: {
    alignItems: "center",
    borderColor: "#D1D5DB",
    borderRadius: professorRadii.pill,
    borderWidth: 1,
    minWidth: 92,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  presenceSwitchActive: {
    backgroundColor: professorColors.brandPurple,
    borderColor: professorColors.brandPurple,
  },
  presenceSwitchDisabled: {
    opacity: 0.5,
  },
  presenceSwitchText: {
    color: professorColors.text,
    fontWeight: "700",
  },
  presenceSwitchTextActive: {
    color: "#fff",
  },
});
