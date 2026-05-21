"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatDateBR } from "@/lib/format";

type Turma = {
  id: number;
  nome: string;
  modalidade: string;
  nivel: string;
  professor_names?: string[];
  dia_semana?: string;
  horario_inicio?: string;
  horario_fim?: string;
};

type Professor = {
  id: number;
  nome: string;
};

type Filtros = {
  nivel: string;
  modalidade: string;
  professorId: string;
  sort: string;
};

type MensalidadeSituacao = "pagas" | "em_aberto" | "atrasadas";

type MensalidadeAluno = {
  id: number | string;
  prevista?: boolean;
  mes_referencia: number;
  ano_referencia: number;
  valor_final: number;
  valor_pago: number;
  saldo: number;
  status: string;
  data_vencimento: string | null;
  responsavel_nome: string | null;
  plano_nome: string | null;
};

type AlunoTurma = {
  id: number;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  matricula_id: number;
  resumo_mensalidades: {
    total: number;
    pagas: number;
    em_aberto: number;
    atrasadas: number;
  };
  mensalidades: Record<MensalidadeSituacao, MensalidadeAluno[]>;
};

const DEFAULT_FILTROS: Filtros = {
  nivel: "",
  modalidade: "",
  professorId: "",
  sort: "nome",
};

const MODALIDADES = [
  { value: "DANÇA_CLÁSSICA", label: "Dança Clássica" },
  { value: "DANÇA_MODERNA", label: "Dança Moderna" },
  { value: "JAZZ", label: "Jazz" },
  { value: "HIP_HOP", label: "Hip Hop" },
  { value: "CONTEMPORANEA", label: "Contemporânea" },
];

const buildQuery = (activeFilters: Filtros) => {
  const params = new URLSearchParams();
  if (activeFilters.modalidade) params.set("modalidade", activeFilters.modalidade);
  if (activeFilters.nivel) params.set("nivel", activeFilters.nivel);
  if (activeFilters.professorId) params.set("professorId", activeFilters.professorId);
  if (activeFilters.sort) params.set("sort", activeFilters.sort);
  return params.toString() ? `?${params.toString()}` : "";
};

export default function RelatorioTurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<number | null>(null);
  const [alunosTurma, setAlunosTurma] = useState<AlunoTurma[]>([]);
  const [alunoSearch, setAlunoSearch] = useState("");
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [expandedSituacao, setExpandedSituacao] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(DEFAULT_FILTROS);

  const loadProfessores = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/professores`);
      const data = await response.json();
      setProfessores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar professores:", err);
    }
  }, []);

  const loadRelatorio = useCallback(async (activeFilters: Filtros) => {
    try {
      setLoading(true);
      setError(null);
      const query = buildQuery(activeFilters);
      const response = await apiFetch(`/api/turmas${query}`);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Erro ao carregar relatório");
      }
      const data = await response.json();
      setTurmas(Array.isArray(data) ? data : []);
      setSelectedTurmaId(null);
      setAlunosTurma([]);
      setAlunoSearch("");
      setExpandedSituacao({});
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("Erro ao carregar relatório:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAlunosTurma = useCallback(async (turmaId: number) => {
    setLoadingAlunos(true);
    setError(null);
    setAlunoSearch("");
    setExpandedSituacao({});

    try {
      const response = await apiFetch(`/api/turmas/${turmaId}/alunos`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar alunos da turma");
      }
      setAlunosTurma(Array.isArray(data) ? data : []);
    } catch (err) {
      setAlunosTurma([]);
      setError(err instanceof Error ? err.message : "Erro ao carregar alunos da turma");
    } finally {
      setLoadingAlunos(false);
    }
  }, []);

  const handleSelectTurma = async (turmaId: number) => {
    if (selectedTurmaId === turmaId) {
      setSelectedTurmaId(null);
      setAlunosTurma([]);
      setAlunoSearch("");
      setExpandedSituacao({});
      return;
    }

    setSelectedTurmaId(turmaId);
    await loadAlunosTurma(turmaId);
  };

  useEffect(() => {
    loadProfessores();
    loadRelatorio(DEFAULT_FILTROS);
  }, [loadProfessores, loadRelatorio]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadRelatorio(filtros);
  };

  const handleClear = async () => {
    setFiltros(DEFAULT_FILTROS);
    await loadRelatorio(DEFAULT_FILTROS);
  };

  const turmaCount = useMemo(() => turmas.length, [turmas]);
  const turmaSelecionada = turmas.find((turma) => turma.id === selectedTurmaId);
  const normalizedAlunoSearch = alunoSearch.trim().toLowerCase();
  const alunosFiltrados = normalizedAlunoSearch
    ? alunosTurma.filter((aluno) =>
        [aluno.nome, aluno.cpf, aluno.telefone, aluno.email]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedAlunoSearch))
      )
    : alunosTurma;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

  const toggleSituacao = (alunoId: number, situacao: MensalidadeSituacao) => {
    const key = `${alunoId}-${situacao}`;
    setExpandedSituacao((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const situacoes: Array<{
    key: MensalidadeSituacao;
    label: string;
    countKey: keyof AlunoTurma["resumo_mensalidades"];
    className: string;
  }> = [
    { key: "pagas", label: "Pagas", countKey: "pagas", className: "border-[#1F8A5B] bg-[#1F8A5B]/10 text-[#1F8A5B]" },
    { key: "em_aberto", label: "Em aberto", countKey: "em_aberto", className: "border-[#C77700] bg-[#C77700]/10 text-[#9A5B00]" },
    { key: "atrasadas", label: "Atrasadas", countKey: "atrasadas", className: "border-[#E61E4D] bg-[#E61E4D]/10 text-[#E61E4D]" },
  ];

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Relatório</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Relatório de Turmas</h1>
            <p className="mt-2 text-sm text-[#4B5563] max-w-2xl">
              Filtre por nível, modalidade e professor para analisar a organização pedagógica.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/funcionarios"
              className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]"
            >
              Voltar
            </Link>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:bg-[#6A4FBF]/20"
            >
              Limpar filtros
            </button>
          </div>
        </div>

        <section className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Modalidade</label>
                <select
                  name="modalidade"
                  value={filtros.modalidade}
                  onChange={handleFilterChange}
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#6A4FBF] focus:ring-2 focus:ring-[#6A4FBF]/20"
                >
                  <option value="">Todas</option>
                  {MODALIDADES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Nível</label>
                <input
                  name="nivel"
                  value={filtros.nivel}
                  onChange={handleFilterChange}
                  placeholder="Ex: Iniciante, Intermediário"
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#6A4FBF] focus:ring-2 focus:ring-[#6A4FBF]/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Professor</label>
                <select
                  name="professorId"
                  value={filtros.professorId}
                  onChange={handleFilterChange}
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#6A4FBF] focus:ring-2 focus:ring-[#6A4FBF]/20"
                >
                  <option value="">Todos</option>
                  {professores.map((professor) => (
                    <option key={professor.id} value={professor.id}>
                      {professor.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Ordenar por</label>
                <select
                  name="sort"
                  value={filtros.sort}
                  onChange={handleFilterChange}
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#6A4FBF] focus:ring-2 focus:ring-[#6A4FBF]/20"
                >
                  <option value="nome">Nome da turma</option>
                  <option value="nivel">Nível</option>
                </select>
              </div>

              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A]"
                >
                  Aplicar filtros
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#F3F4F6] px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:bg-[#E5E7EB]"
                >
                  Limpar
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Resultado</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Turmas Ativas ({turmaCount})</h2>
            </div>
            <p className="text-sm text-[#4B5563]">Os resultados exibem apenas turmas ativas por padrão.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando relatório...</p>
          ) : turmas.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhuma turma encontrada com os filtros selecionados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Turma</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Modalidade</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Nível</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Professores</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Dia da semana</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Horário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {turmas.map((turma) => (
                    <tr
                      key={turma.id}
                      onClick={() => void handleSelectTurma(turma.id)}
                      className={`cursor-pointer bg-white transition hover:bg-[#F2F2F2] ${selectedTurmaId === turma.id ? "bg-[#6A4FBF]/10" : ""}`}
                    >
                      <td className="px-4 py-4 font-medium">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleSelectTurma(turma.id);
                          }}
                          className="text-left font-semibold text-[#1F2A5A] underline-offset-4 hover:text-[#6A4FBF] hover:underline"
                        >
                          {turma.nome}
                        </button>
                      </td>
                      <td className="px-4 py-4">{turma.modalidade}</td>
                      <td className="px-4 py-4">{turma.nivel}</td>
                      <td className="px-4 py-4">
                        {turma.professor_names?.length ? turma.professor_names.join(", ") : "-"}
                      </td>
                      <td className="px-4 py-4">{turma.dia_semana || "-"}</td>
                      <td className="px-4 py-4">
                        {turma.horario_inicio && turma.horario_fim
                          ? `${turma.horario_inicio} - ${turma.horario_fim}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedTurmaId && (
            <section className="mt-6 border-t border-[#E5E7EB] pt-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Alunos participantes</p>
                  <h3 className="mt-2 text-lg font-semibold text-[#1F2A5A]">
                    {turmaSelecionada?.nome || "Turma selecionada"}
                  </h3>
                </div>
                <p className="text-sm text-[#2B2B2B]/70">
                  {alunosFiltrados.length} de {alunosTurma.length} aluno(s)
                </p>
              </div>

              {loadingAlunos ? (
                <p className="text-sm text-[#2B2B2B]/70">Carregando alunos...</p>
              ) : alunosTurma.length === 0 ? (
                <p className="text-sm text-[#2B2B2B]/70">Nenhum aluno ativo nesta turma.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Pesquisar aluno na turma</label>
                    <input
                      value={alunoSearch}
                      onChange={(event) => setAlunoSearch(event.target.value)}
                      className="w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#6A4FBF] focus:ring-2 focus:ring-[#6A4FBF]/20"
                      placeholder="Digite nome, CPF, telefone ou e-mail"
                    />
                  </div>

                  {alunosFiltrados.length === 0 ? (
                    <p className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#2B2B2B]/70">
                      Nenhum aluno encontrado para a pesquisa.
                    </p>
                  ) : alunosFiltrados.map((aluno) => (
                    <article key={aluno.id} className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h4 className="font-semibold text-[#1F2A5A]">{aluno.nome}</h4>
                          <p className="mt-1 text-sm text-[#2B2B2B]/70">
                            {aluno.telefone || "Sem telefone"} {aluno.email ? `- ${aluno.email}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-[#6A4FBF]/30 bg-white px-3 py-2 text-xs font-semibold text-[#1F2A5A]">
                            Total: {aluno.resumo_mensalidades.total}
                          </span>
                          {situacoes.map((situacao) => {
                            const key = `${aluno.id}-${situacao.key}`;
                            const count = aluno.resumo_mensalidades[situacao.countKey];

                            return (
                              <button
                                key={situacao.key}
                                type="button"
                                onClick={() => toggleSituacao(aluno.id, situacao.key)}
                                className={`rounded-full border px-3 py-2 text-xs font-semibold transition hover:opacity-80 ${situacao.className}`}
                              >
                                {situacao.label}: {count}
                                <span className="ml-1">{expandedSituacao[key] ? "^" : "v"}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {situacoes.map((situacao) => {
                        const key = `${aluno.id}-${situacao.key}`;
                        const mensalidades = aluno.mensalidades?.[situacao.key] || [];
                        if (!expandedSituacao[key]) return null;

                        return (
                          <div key={key} className="mt-4 overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white">
                            {mensalidades.length === 0 ? (
                              <p className="px-4 py-3 text-sm text-[#2B2B2B]/70">Nenhuma mensalidade nesta situacao.</p>
                            ) : (
                              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                                <thead>
                                  <tr className="bg-white">
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Referencia</th>
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Vencimento</th>
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Responsavel</th>
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Plano</th>
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Valor</th>
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Pago</th>
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Saldo</th>
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E7EB]">
                                  {mensalidades.map((mensalidade) => (
                                    <tr key={mensalidade.id}>
                                      <td className="px-4 py-3">
                                        {String(mensalidade.mes_referencia).padStart(2, "0")}/{mensalidade.ano_referencia}
                                        {mensalidade.prevista ? " (prevista)" : ""}
                                      </td>
                                      <td className="px-4 py-3">{formatDateBR(mensalidade.data_vencimento)}</td>
                                      <td className="px-4 py-3">{mensalidade.responsavel_nome || "-"}</td>
                                      <td className="px-4 py-3">{mensalidade.plano_nome || "-"}</td>
                                      <td className="px-4 py-3">{formatCurrency(mensalidade.valor_final)}</td>
                                      <td className="px-4 py-3">{formatCurrency(mensalidade.valor_pago)}</td>
                                      <td className="px-4 py-3">{formatCurrency(mensalidade.saldo)}</td>
                                      <td className="px-4 py-3">{mensalidade.status}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        );
                      })}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </section>
      </main>
    </div>
  );
}
