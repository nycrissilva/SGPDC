"use client";

import { apiFetch, apiBase } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Professor = {
  id: number;
  nome: string;
  status?: string;
  modalidade?: string;
};

type Turma = {
  id: number;
  nome: string;
  modalidade: string;
  nivel: string;
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  status?: string;
  professor_ids?: number[];
};

const WEEK_DAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const normalizeDayName = (value: string) => {
  if (!value) return "";
  const normalized = value.toLowerCase();
  if (normalized.includes("seg")) return "Segunda-feira";
  if (normalized.includes("ter")) return "Terça-feira";
  if (normalized.includes("qua")) return "Quarta-feira";
  if (normalized.includes("qui")) return "Quinta-feira";
  if (normalized.includes("sex")) return "Sexta-feira";
  if (normalized.includes("sáb") || normalized.includes("sab")) return "Sábado";
  if (normalized.includes("dom")) return "Domingo";
  return value;
};

const getWeekLabel = (offset: number) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (date: Date) => date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${format(monday)} - ${format(sunday)}`;
};

const sortByHorario = (a: Turma, b: Turma) => {
  if (a.horario_inicio === b.horario_inicio) {
    return a.horario_fim.localeCompare(b.horario_fim);
  }
  return a.horario_inicio.localeCompare(b.horario_inicio);
};

export default function AgendaProfessorPage() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedProfessorId, setSelectedProfessorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [professoresRes, turmasRes] = await Promise.all([
        apiFetch(`/api/professores`),
        apiFetch(`/api/turmas`),
      ]);
      if (!professoresRes.ok || !turmasRes.ok) {
        throw new Error("Não foi possível carregar os dados da agenda.");
      }

      const professoresData = await professoresRes.json();
      const turmasData = await turmasRes.json();

      const loadedProfessores = Array.isArray(professoresData) ? professoresData : [];
      const loadedTurmas = Array.isArray(turmasData) ? turmasData : [];

      setProfessores(loadedProfessores);
      setTurmas(loadedTurmas);

      const firstActiveProfessor = loadedProfessores.find((professor) => professor.status !== "INATIVO");
      if (firstActiveProfessor) {
        setSelectedProfessorId(firstActiveProfessor.id);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido ao carregar a agenda.";
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeProfessores = useMemo(
    () => professores.filter((professor) => professor.status !== "INATIVO"),
    [professores]
  );

  const professorTurmas = useMemo(() => {
    if (selectedProfessorId === null) return [];

    return turmas
      .filter((turma) =>
        turma.status !== "INATIVO" &&
        Array.isArray(turma.professor_ids) &&
        turma.professor_ids.includes(selectedProfessorId)
      )
      .map((turma) => ({ ...turma, dia_semana: normalizeDayName(turma.dia_semana) }))
      .sort(sortByHorario);
  }, [turmas, selectedProfessorId]);

  const agendaPorDia = useMemo(() => {
    const grouped: Record<string, Turma[]> = {};

    WEEK_DAYS.forEach((day) => {
      grouped[day] = [];
    });

    professorTurmas.forEach((turma) => {
      const nomeDia = normalizeDayName(turma.dia_semana);
      if (WEEK_DAYS.includes(nomeDia)) {
        grouped[nomeDia].push(turma);
      }
    });

    Object.values(grouped).forEach((diaTurmas) => diaTurmas.sort(sortByHorario));
    return grouped;
  }, [professorTurmas]);

  const currentWeekLabel = getWeekLabel(weekOffset);

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Agenda</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Agenda Semanal do Professor</h1>
            <p className="mt-2 max-w-xl text-sm text-[#4B5563]">
              Veja suas aulas organizadas por dia da semana, horário e turma. Navegue entre semanas sem edição de horários.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/professores/presencas"
              className="inline-flex items-center rounded-full border border-[#6A4FBF] bg-white px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#F9FAFB]"
            >
              Registrar presença
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Professor</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Selecione seu perfil</h2>
            </div>

            {loading ? (
              <p className="text-sm text-[#2B2B2B]/70">Carregando professores...</p>
            ) : activeProfessores.length === 0 ? (
              <p className="text-sm text-[#2B2B2B]/70">Nenhum professor ativo encontrado.</p>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-[#1F2A5A]">Professor</label>
                <select
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#2B2B2B] outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                  value={selectedProfessorId ?? undefined}
                  onChange={(event) => setSelectedProfessorId(Number(event.target.value))}
                >
                  {activeProfessores.map((professor) => (
                    <option key={professor.id} value={professor.id}>
                      {professor.nome} {professor.modalidade ? `- ${professor.modalidade}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-8 rounded-[24px] bg-[#F9FAFB] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Semana</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-semibold text-[#1F2A5A]">{currentWeekLabel}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWeekOffset((offset) => offset - 1)}
                    className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#1F2A5A] transition hover:bg-[#F2F2F2]"
                  >
                    Semana anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekOffset((offset) => offset + 1)}
                    className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#1F2A5A] transition hover:bg-[#F2F2F2]"
                  >
                    Próxima semana
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Agenda Semanal</p>
                <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Minhas Aulas</h2>
              </div>
              <p className="text-sm text-[#4B5563]">As turmas exibidas são apenas as vinculadas ao professor selecionado.</p>
            </div>

            {error && <div className="mb-4 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

            {loading ? (
              <p className="text-sm text-[#2B2B2B]/70">Carregando agenda...</p>
            ) : selectedProfessorId === null ? (
              <p className="text-sm text-[#2B2B2B]/70">Selecione um professor para visualizar a agenda.</p>
            ) : professorTurmas.length === 0 ? (
              <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F9FAFB] p-6 text-sm text-[#4B5563]">
                Nenhuma aula cadastrada para este professor nesta semana.
              </div>
            ) : (
              <div className="space-y-6">
                {WEEK_DAYS.map((day) => (
                  <div key={day} className="rounded-[24px] border border-[#E5E7EB] bg-[#FAFAFF] p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-[#1F2A5A]">{day}</h3>
                      <span className="rounded-full bg-[#E5E7EB] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#4B5563]">
                        {agendaPorDia[day].length} aula(s)
                      </span>
                    </div>

                    {agendaPorDia[day].length === 0 ? (
                      <p className="text-sm text-[#6B7280]">Nenhuma aula neste dia.</p>
                    ) : (
                      <div className="space-y-4">
                        {agendaPorDia[day].map((turma) => (
                          <article key={`${day}-${turma.id}`} className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-medium text-[#6A4FBF]">{turma.nome}</p>
                                <p className="mt-1 text-sm text-[#4B5563]">{turma.modalidade} • Nível {turma.nivel}</p>
                              </div>
                              <span className="rounded-full bg-[#E61E4D]/10 px-3 py-1 text-sm font-semibold text-[#E61E4D]">
                                {turma.horario_inicio} - {turma.horario_fim}
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
