import { DatasChamadaResponse, ListaPresencaResponse, PresencaPayload } from "@/src/types/presenca";
import { AlunoTurma, Turma } from "@/src/types/turma";

import { api } from "./api";

export async function getTurmasParaChamada() {
  const { data } = await api.get<Turma[]>("/presencas/me/turmas");
  return data;
}

export async function getDatasDaTurma(turmaId: number) {
  const { data } = await api.get<DatasChamadaResponse>("/presencas/me/datas", {
    params: { turmaId },
  });
  return data;
}

export async function getAlunosDaTurma(turmaId: number, data: string) {
  try {
    const response = await api.get<ListaPresencaResponse>("/presencas/me", {
      params: { turmaId, data },
    });
    return response.data;
  } catch {
    // Endpoint alternativo sugerido no requisito. O backend atual já possui /presencas/me.
    const response = await api.get<AlunoTurma[]>(`/turmas/${turmaId}/alunos`, { params: { data } });
    return { alunos: response.data, chamada: null };
  }
}

export async function salvarChamada(payload: PresencaPayload) {
  const { data } = await api.post("/presencas/me", payload);
  return data;
}
