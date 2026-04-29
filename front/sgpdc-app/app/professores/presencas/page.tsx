"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Turma = {
  id: number;
  nome: string;
  modalidade: string;
  nivel: string;
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  status?: string;
};

type PeriodoLetivo = {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
};

type Chamada = {
  turma_id: number;
  data: string;
  finalizada: boolean;
  sem_aula: boolean;
  motivo_sem_aula: string;
};

type DataChamada = {
  data: string;
  chamada: Chamada;
};

type PresencaAluno = {
  matricula_turma_id: number;
  aluno_id: number;
  nome: string;
  presente: boolean;
};

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || response.statusText || "Resposta inválida do servidor");
  }
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export default function PresencasProfessorPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoLetivo | null>(null);
  const [datas, setDatas] = useState<DataChamada[]>([]);
  const [data, setData] = useState<string>("");
  const [alunos, setAlunos] = useState<PresencaAluno[]>([]);
  const [chamada, setChamada] = useState<Chamada | null>(null);
  const [semAula, setSemAula] = useState(false);
  const [motivoSemAula, setMotivoSemAula] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadTurmas();
  }, []);

  useEffect(() => {
    if (selectedTurmaId) {
      void loadDatas(selectedTurmaId);
    } else {
      setDatas([]);
      setData("");
      setAlunos([]);
      setChamada(null);
    }
  }, [selectedTurmaId]);

  useEffect(() => {
    if (selectedTurmaId && data) {
      void loadPresencas(selectedTurmaId, data);
    } else {
      setAlunos([]);
      setChamada(null);
      setSemAula(false);
      setMotivoSemAula("");
    }
  }, [selectedTurmaId, data]);

  const loadTurmas = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiFetch(`/api/presencas/me/turmas`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) {
        throw new Error(payload?.error || `Erro ${response.status}`);
      }

      const loadedTurmas = Array.isArray(payload) ? payload : [];
      setTurmas(loadedTurmas);
      if (loadedTurmas.length > 0) {
        setSelectedTurmaId((prev) => prev ?? loadedTurmas[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar turmas");
    } finally {
      setLoading(false);
    }
  };

  const loadDatas = async (turmaId: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiFetch(`/api/presencas/me/datas?turmaId=${turmaId}`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) {
        throw new Error(payload?.error || `Erro ${response.status}`);
      }

      const loadedDatas = Array.isArray(payload?.datas) ? payload.datas : [];
      setPeriodo(payload?.periodo || null);
      setDatas(loadedDatas);
      setData((prev) => {
        if (prev && loadedDatas.some((item: DataChamada) => item.data === prev)) return prev;
        return loadedDatas[0]?.data || "";
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar datas");
      setPeriodo(null);
      setDatas([]);
      setData("");
    } finally {
      setLoading(false);
    }
  };

  const loadPresencas = async (turmaId: number, dataValue: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiFetch(`/api/presencas/me?turmaId=${turmaId}&data=${encodeURIComponent(dataValue)}`);
      const payload = await parseJsonSafe(response);
      if (!response.ok) {
        throw new Error(payload?.error || `Erro ${response.status}`);
      }

      const loadedAlunos = Array.isArray(payload) ? payload : payload?.alunos || [];
      const loadedChamada = Array.isArray(payload) ? null : payload?.chamada || null;
      setAlunos(loadedAlunos);
      setChamada(loadedChamada);
      setSemAula(Boolean(loadedChamada?.sem_aula));
      setMotivoSemAula(loadedChamada?.motivo_sem_aula || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar presença");
      setAlunos([]);
      setChamada(null);
    } finally {
      setLoading(false);
    }
  };

  const togglePresenca = (matriculaTurmaId: number) => {
    setAlunos((prev) =>
      prev.map((aluno) =>
        aluno.matricula_turma_id === matriculaTurmaId ? { ...aluno, presente: !aluno.presente } : aluno
      )
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTurmaId || !data) {
      setError("Selecione uma turma e uma data antes de finalizar.");
      return;
    }

    if (semAula && !motivoSemAula.trim()) {
      setError("Informe o motivo quando marcar que não teve aula.");
      return;
    }

    setSaving(true);
    try {
      const response = await apiFetch("/api/presencas/me", {
        method: "POST",
        body: JSON.stringify({
          turmaId: selectedTurmaId,
          data,
          semAula,
          motivoSemAula,
          presencas: alunos.map((aluno) => ({
            matricula_turma_id: aluno.matricula_turma_id,
            presente: aluno.presente,
          })),
        }),
      });

      const result = await parseJsonSafe(response);
      if (!response.ok) {
        throw new Error(result?.error || `Erro ${response.status}`);
      }

      setChamada(result?.chamada || null);
      setSuccess("Chamada finalizada com sucesso.");
      if (selectedTurmaId) {
        await loadDatas(selectedTurmaId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao finalizar chamada");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Presença</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Registrar Chamada</h1>
            <p className="mt-2 max-w-xl text-sm text-[#4B5563]">
              As datas aparecem conforme o dia da turma dentro do período letivo ativo.
            </p>
          </div>
          <Link
            href="/professores"
            className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]"
          >
            Voltar
          </Link>
        </div>

        {success && <div className="mb-6 rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">{success}</div>}
        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

        <div className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-4">
            <div>
              <label className="text-sm font-semibold text-[#1F2A5A]">Turma</label>
              <select
                value={selectedTurmaId ?? ""}
                onChange={(e) => setSelectedTurmaId(Number(e.target.value) || null)}
                className="mt-2 w-full rounded-3xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm text-[#1F2A5A] outline-none transition focus:border-[#6A4FBF]"
              >
                <option value="">Selecione uma turma</option>
                {turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome} - {turma.modalidade} ({turma.nivel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#1F2A5A]">Data da aula</label>
              <select
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={!selectedTurmaId || datas.length === 0}
                className="mt-2 w-full rounded-3xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm text-[#1F2A5A] outline-none transition focus:border-[#6A4FBF] disabled:bg-[#F3F4F6]"
              >
                <option value="">Selecione uma data</option>
                {datas.map((item) => (
                  <option key={item.data} value={item.data}>
                    {formatDate(item.data)}
                    {item.chamada.finalizada ? " - finalizada" : ""}
                    {item.chamada.sem_aula ? " - sem aula" : ""}
                  </option>
                ))}
              </select>
              {periodo ? (
                <p className="mt-2 text-xs text-[#4B5563]">
                  {periodo.nome}: {formatDate(periodo.data_inicio)} a {formatDate(periodo.data_fim)}
                </p>
              ) : (
                <p className="mt-2 text-xs text-[#E61E4D]">Nenhum período letivo ativo cadastrado.</p>
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#1F2A5A]">
                <input
                  type="checkbox"
                  checked={semAula}
                  onChange={(e) => setSemAula(e.target.checked)}
                  className="h-4 w-4 rounded border-[#D1D5DB] text-[#6A4FBF] focus:ring-[#6A4FBF]"
                />
                Não teve aula nesta data
              </label>
              {semAula && (
                <input
                  value={motivoSemAula}
                  onChange={(e) => setMotivoSemAula(e.target.value)}
                  className="mt-3 w-full rounded-3xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm text-[#1F2A5A] outline-none transition focus:border-[#6A4FBF]"
                  placeholder="Ex: feriado, evento, recesso"
                />
              )}
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#4B5563]">
                {chamada?.finalizada ? "Esta chamada já foi finalizada. Ao finalizar novamente, as alterações serão salvas." : "Finalize para registrar presenças e faltas."}
              </p>
              <button
                type="submit"
                disabled={!selectedTurmaId || !data || loading || saving}
                className="inline-flex items-center justify-center rounded-full bg-[#6A4FBF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5B3EB4] disabled:cursor-not-allowed disabled:bg-[#C7C4D8]"
              >
                {saving ? "Finalizando..." : "Finalizar chamada"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Alunos</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Lista de Presença</h2>
            </div>
            <p className="text-sm text-[#4B5563]">
              {semAula ? "A lista fica preservada, mas esta data será registrada como sem aula." : "Marque quem esteve presente; os demais ficam como falta."}
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando...</p>
          ) : !selectedTurmaId ? (
            <p className="text-sm text-[#2B2B2B]/70">Selecione uma turma para exibir as datas.</p>
          ) : !data ? (
            <p className="text-sm text-[#2B2B2B]/70">Selecione uma data do período letivo para iniciar a chamada.</p>
          ) : alunos.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhum aluno matriculado nesta turma.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Aluno</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Presente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {alunos.map((aluno) => (
                    <tr key={aluno.matricula_turma_id} className="bg-white hover:bg-[#F2F2F2]">
                      <td className="px-4 py-4 font-medium text-[#1F2A5A]">{aluno.nome}</td>
                      <td className="px-4 py-4">
                        <label className="inline-flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={aluno.presente}
                            disabled={semAula}
                            onChange={() => togglePresenca(aluno.matricula_turma_id)}
                            className="h-5 w-5 rounded border-[#D1D5DB] text-[#6A4FBF] focus:ring-[#6A4FBF] disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          <span className="text-sm text-[#2B2B2B]">{aluno.presente ? "Presente" : "Falta"}</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
