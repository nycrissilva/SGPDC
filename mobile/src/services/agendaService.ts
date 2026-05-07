import { Aula, LocalAula } from "@/src/types/agenda";
import { Turma } from "@/src/types/turma";
import { getDiaSemana, sameWeekday } from "@/src/utils/dateUtils";

import { api } from "./api";

export async function getAgendaSemanal(params: { inicio: string; fim: string }) {
  const turmas = await getTurmasProfessor();
  return turmas.filter((turma) => {
    if (!turma.data_inicio && !turma.data_fim) return true;

    const inicioSemana = new Date(`${params.inicio}T00:00:00`);
    const fimSemana = new Date(`${params.fim}T23:59:59`);
    const inicioTurma = turma.data_inicio ? new Date(`${turma.data_inicio}T00:00:00`) : null;
    const fimTurma = turma.data_fim ? new Date(`${turma.data_fim}T23:59:59`) : null;

    return (!inicioTurma || inicioTurma <= fimSemana) && (!fimTurma || fimTurma >= inicioSemana);
  }) as Aula[];
}

export async function getAulasHoje() {
  const dia = getDiaSemana();
  const turmas = await getTurmasProfessor();
  return turmas.filter((turma) => sameWeekday(turma.dia_semana, dia)) as Aula[];
}

export async function getTurmasProfessor() {
  const { data } = await api.get<Turma[]>("/presencas/me/turmas");
  return data;
}

export async function getLocalAula(localId: number) {
  const { data } = await api.get<LocalAula>(`/locais/${localId}`);
  return data;
}
