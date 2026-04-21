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

type PresencaAluno = {
  matricula_turma_id: number;
  aluno_id: number;
  nome: string;
  presente: boolean;
};

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(text || response.statusText || "Resposta inválida do servidor");
  }
}

export default function PresencasProfessorPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<number | null>(null);
  const [data, setData] = useState<string>(new Date().toISOString().split("T")[0]);
  const [alunos, setAlunos] = useState<PresencaAluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTurmas();
  }, []);

  useEffect(() => {
    if (selectedTurmaId) {
      loadPresencas(selectedTurmaId, data);
    } else {
      setAlunos([]);
    }
  }, [selectedTurmaId, data]);

  const loadTurmas = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiFetch(`/api/presencas/me/turmas`);
      if (!response.ok) {
        const result = await parseJsonSafe(response);
        throw new Error(result.error || `Erro ${response.status}`);
      }

      const payload = await parseJsonSafe(response);
      const loadedTurmas = Array.isArray(payload) ? payload : [];
      setTurmas(loadedTurmas);
      if (loadedTurmas.length > 0) {
        setSelectedTurmaId((prev) => prev ?? loadedTurmas[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido ao carregar turmas";
      setError(message);
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
      if (!response.ok) {
        const result = await parseJsonSafe(response);
        throw new Error(result.error || `Erro ${response.status}`);
      }

      const payload = await parseJsonSafe(response);
      setAlunos(Array.isArray(payload) ? payload : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido ao carregar presença";
      setError(message);
      setAlunos([]);
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

    if (!selectedTurmaId) {
      setError("Selecione uma turma antes de salvar.");
      return;
    }

    setSaving(true);
    try {
      const response = await apiFetch("/api/presencas/me", {
        method: "POST",
        body: JSON.stringify({
          turmaId: selectedTurmaId,
          data,
          presencas: alunos.map((aluno) => ({
            matricula_turma_id: aluno.matricula_turma_id,
            presente: aluno.presente,
          })),
        }),
      });

      if (!response.ok) {
        const result = await parseJsonSafe(response);
        throw new Error(result.error || `Erro ${response.status}`);
      }

      setSuccess("Presença salva com sucesso.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido ao salvar presença";
      setError(message);
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
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Registrar Presença</h1>
            <p className="mt-2 max-w-xl text-sm text-[#4B5563]">
              Esta chamada é limitada às turmas do professor autenticado.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/professores"
              className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]"
            >
              Voltar
            </Link>
          </div>
        </div>

        {success && <div className="mb-6 rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">{success}</div>}
        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

        <div className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-3">
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
              <label className="text-sm font-semibold text-[#1F2A5A]">Data da Aula</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm text-[#1F2A5A] outline-none transition focus:border-[#6A4FBF]"
              />
            </div>

            <div className="flex items-end justify-end">
              <button
                type="submit"
                disabled={!selectedTurmaId || loading || saving}
                className="inline-flex items-center rounded-full bg-[#6A4FBF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5B3EB4] disabled:cursor-not-allowed disabled:bg-[#C7C4D8]"
              >
                {saving ? "Salvando..." : "Salvar presença"}
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
            <p className="text-sm text-[#4B5563]">Marque a presença dos alunos matriculados na turma selecionada.</p>
          </div>

          {loading ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando alunos...</p>
          ) : !selectedTurmaId ? (
            <p className="text-sm text-[#2B2B2B]/70">Selecione uma turma para exibir os alunos.</p>
          ) : alunos.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhum aluno matriculado nesta turma ou chamada ainda não foi iniciada.</p>
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
                            onChange={() => togglePresenca(aluno.matricula_turma_id)}
                            className="h-5 w-5 rounded border-[#D1D5DB] text-[#6A4FBF] focus:ring-[#6A4FBF]"
                          />
                          <span className="text-sm text-[#2B2B2B]">Presente</span>
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
