"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiBase } from "@/lib/api";

const MODALIDADES = [
  { value: "DANÇA_CLÁSSICA", label: "Dança Clássica" },
  { value: "DANÇA_MODERNA", label: "Dança Moderna" },
  { value: "JAZZ", label: "Jazz" },
  { value: "HIP_HOP", label: "Hip Hop" },
  { value: "CONTEMPORÂNEA", label: "Contemporânea" },
];

export default function RelatorioTurmasPage() {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    nivel: "",
    modalidade: "",
    professorId: "",
    sort: "nome",
  });

  useEffect(() => {
    loadProfessores();
    loadRelatorio();
  }, []);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filtros.modalidade) params.set("modalidade", filtros.modalidade);
    if (filtros.nivel) params.set("nivel", filtros.nivel);
    if (filtros.professorId) params.set("professorId", filtros.professorId);
    if (filtros.sort) params.set("sort", filtros.sort);
    return params.toString() ? `?${params.toString()}` : "";
  };

  const loadProfessores = async () => {
    try {
      const response = await fetch(`${apiBase}/api/professores`);
      const data = await response.json();
      setProfessores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar professores:", err);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadRelatorio();
  };

  const handleClear = async () => {
    const newState = { nivel: "", modalidade: "", professorId: "", sort: "nome" };
    setFiltros(newState);
    await loadRelatorio(newState);
  };

  const loadRelatorio = async (overrideFilters?: typeof filtros) => {
    try {
      setLoading(true);
      setError(null);
      const activeFilters = overrideFilters ?? filtros;
      const params = new URLSearchParams();
      if (activeFilters.modalidade) params.set("modalidade", activeFilters.modalidade);
      if (activeFilters.nivel) params.set("nivel", activeFilters.nivel);
      if (activeFilters.professorId) params.set("professorId", activeFilters.professorId);
      if (activeFilters.sort) params.set("sort", activeFilters.sort);
      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(`${apiBase}/api/turmas${query}`);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Erro ao carregar relatório");
      }
      const data = await response.json();
      setTurmas(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("Erro ao carregar relatório:", err);
    } finally {
      setLoading(false);
    }
  };

  const turmaCount = useMemo(() => turmas.length, [turmas]);

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
                    <tr key={turma.id} className="bg-white hover:bg-[#F2F2F2]">
                      <td className="px-4 py-4 font-medium">{turma.nome}</td>
                      <td className="px-4 py-4">{turma.modalidade}</td>
                      <td className="px-4 py-4">{turma.nivel}</td>
                      <td className="px-4 py-4">
                        {turma.professor_names?.length > 0 ? turma.professor_names.join(", ") : "—"}
                      </td>
                      <td className="px-4 py-4">{turma.dia_semana || "—"}</td>
                      <td className="px-4 py-4">
                        {turma.horario_inicio && turma.horario_fim
                          ? `${turma.horario_inicio} - ${turma.horario_fim}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
