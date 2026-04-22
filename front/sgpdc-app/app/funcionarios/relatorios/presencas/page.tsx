"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Turma = {
  id: number;
  nome: string;
};

type Aluno = {
  id: number;
  nome: string;
};

type RegistroPresenca = {
  aluno_id: number;
  aluno_nome: string;
  turma_id: number;
  turma_nome: string;
  data_aula: string;
  presente: boolean;
};

type ResumoPresenca = {
  aluno_id: number;
  aluno_nome: string;
  total_aulas: number;
  total_presencas: number;
  total_ausencias: number;
  percentual_presenca: number;
};

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

const formatDate = (value: string) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR") : "";

export default function RelatorioPresencasPage() {
  const hoje = new Date().toISOString().split("T")[0];
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [registros, setRegistros] = useState<RegistroPresenca[]>([]);
  const [resumo, setResumo] = useState<ResumoPresenca[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFiltros, setLoadingFiltros] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    turmaId: "",
    alunoId: "",
    dataInicial: hoje,
    dataFinal: hoje,
  });

  useEffect(() => {
    loadFiltros();
  }, []);

  const loadFiltros = async () => {
    setLoadingFiltros(true);
    try {
      const [turmasRes, alunosRes] = await Promise.all([
        apiFetch("/api/turmas?sort=nome"),
        apiFetch("/api/alunos"),
      ]);

      const [turmasData, alunosData] = await Promise.all([
        parseJsonSafe(turmasRes),
        parseJsonSafe(alunosRes),
      ]);

      setTurmas(Array.isArray(turmasData) ? turmasData : []);
      setAlunos(Array.isArray(alunosData) ? alunosData : []);
    } catch {
      setError("Não foi possí­vel carregar os filtros do relatório.");
    } finally {
      setLoadingFiltros(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = event.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const handleBuscar = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!filtros.dataInicial || !filtros.dataFinal) {
      setError("Informe a data inicial e a data final para gerar o relatório.");
      return;
    }

    if (filtros.dataInicial > filtros.dataFinal) {
      setError("A data inicial não pode ser maior que a data final.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        dataInicial: filtros.dataInicial,
        dataFinal: filtros.dataFinal,
      });

      if (filtros.turmaId) params.set("turmaId", filtros.turmaId);
      if (filtros.alunoId) params.set("alunoId", filtros.alunoId);

      const response = await apiFetch(`/api/presencas/relatorio?${params.toString()}`);
      const data = await parseJsonSafe(response);

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao gerar relatÃ³rio");
      }

      setRegistros(Array.isArray(data?.registros) ? data.registros : []);
      setResumo(Array.isArray(data?.resumo) ? data.resumo : []);
      setInfo(data?.message || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido ao gerar relatório";
      setError(message);
      setRegistros([]);
      setResumo([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFiltros({
      turmaId: "",
      alunoId: "",
      dataInicial: hoje,
      dataFinal: hoje,
    });
    setRegistros([]);
    setResumo([]);
    setError(null);
    setInfo(null);
  };

  const exportarExcel = () => {
    if (registros.length === 0) {
      setError("Gere um relatório com registros antes de exportar.");
      return;
    }

    const linhasDetalhe = registros
      .map(
        (registro) => `
          <tr>
            <td>${registro.aluno_nome}</td>
            <td>${registro.turma_nome}</td>
            <td>${formatDate(registro.data_aula)}</td>
            <td>${registro.presente ? "PRESENTE" : "AUSENTE"}</td>
          </tr>`
      )
      .join("");

    const linhasResumo = resumo
      .map(
        (item) => `
          <tr>
            <td>${item.aluno_nome}</td>
            <td>${item.total_aulas}</td>
            <td>${item.total_presencas}</td>
            <td>${item.total_ausencias}</td>
            <td>${item.percentual_presenca.toFixed(2)}%</td>
          </tr>`
      )
      .join("");

    const html = `
      <html>
        <head><meta charset="utf-8" /></head>
        <body>
          <h2>Relatório de Presença</h2>
          <p>Período: ${formatDate(filtros.dataInicial)} a ${formatDate(filtros.dataFinal)}</p>
          <table border="1">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Data da Aula</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${linhasDetalhe}</tbody>
          </table>
          <br />
          <table border="1">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Total de Aulas</th>
                <th>Presenças</th>
                <th>Ausências</th>
                <th>Frequência</th>
              </tr>
            </thead>
            <tbody>${linhasResumo}</tbody>
          </table>
        </body>
      </html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-presenca-${filtros.dataInicial}-${filtros.dataFinal}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalRegistros = useMemo(() => registros.length, [registros]);

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Relatório</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Relatório de Presença</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#4B5563]">
              Consulte a frequência dos alunos por turma, período e aluno, com resumo de presenças, ausências e percentual.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/funcionarios/relatorios" className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
              Voltar
            </Link>
            <button
              type="button"
              onClick={exportarExcel}
              className="inline-flex items-center rounded-full bg-[#6A4FBF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5B3EB4]"
            >
              Exportar Excel
            </button>
          </div>
        </div>

        <section className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <form onSubmit={handleBuscar} className="grid gap-4 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Turma</label>
              <select
                name="turmaId"
                value={filtros.turmaId}
                onChange={handleChange}
                disabled={loadingFiltros}
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#6A4FBF] focus:ring-2 focus:ring-[#6A4FBF]/20"
              >
                <option value="">Todas</option>
                {turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Aluno</label>
              <select
                name="alunoId"
                value={filtros.alunoId}
                onChange={handleChange}
                disabled={loadingFiltros}
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#6A4FBF] focus:ring-2 focus:ring-[#6A4FBF]/20"
              >
                <option value="">Todos</option>
                {alunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Data inicial</label>
              <input
                type="date"
                name="dataInicial"
                value={filtros.dataInicial}
                onChange={handleChange}
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#6A4FBF] focus:ring-2 focus:ring-[#6A4FBF]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Data final</label>
              <input
                type="date"
                name="dataFinal"
                value={filtros.dataFinal}
                onChange={handleChange}
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#6A4FBF] focus:ring-2 focus:ring-[#6A4FBF]/20"
              />
            </div>

            <div className="flex gap-3 lg:col-span-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-60"
              >
                {loading ? "Gerando..." : "Gerar relatÃ³rio"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center justify-center rounded-full bg-[#F3F4F6] px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:bg-[#E5E7EB]"
              >
                Limpar
              </button>
            </div>
          </form>
        </section>

        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}
        {info && <div className="mb-6 rounded-lg bg-[#1F2A5A]/10 p-4 text-sm text-[#1F2A5A]">{info}</div>}

        <section className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Resumo</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Frequência por Aluno</h2>
            </div>
            <p className="text-sm text-[#4B5563]">Período consultado: {formatDate(filtros.dataInicial)} a {formatDate(filtros.dataFinal)}</p>
          </div>

          {loading ? (
            <p className="text-sm text-[#2B2B2B]/70">Calculando resumo...</p>
          ) : resumo.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhum dado resumido para exibir.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {resumo.map((item) => (
                <article key={item.aluno_id} className="rounded-[24px] border border-[#E5E7EB] bg-[#F9FAFB] p-5">
                  <p className="text-sm font-semibold text-[#1F2A5A]">{item.aluno_nome}</p>
                  <p className="mt-3 text-sm text-[#4B5563]">Presenças: {item.total_presencas}</p>
                  <p className="text-sm text-[#4B5563]">Ausências: {item.total_ausencias}</p>
                  <p className="text-sm text-[#4B5563]">Total de aulas: {item.total_aulas}</p>
                  <p className="mt-3 text-lg font-semibold text-[#6A4FBF]">{item.percentual_presenca.toFixed(2)}%</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Resultado</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Registros Encontrados ({totalRegistros})</h2>
            </div>
            <p className="text-sm text-[#4B5563]">Os dados abaixo refletem fielmente as presenças já registradas no sistema.</p>
          </div>

          {loading ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando registros...</p>
          ) : registros.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhum registro encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Aluno</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Turma</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Data da aula</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {registros.map((registro, index) => (
                    <tr key={`${registro.aluno_id}-${registro.turma_id}-${registro.data_aula}-${index}`} className="bg-white hover:bg-[#F2F2F2]">
                      <td className="px-4 py-4 font-medium text-[#1F2A5A]">{registro.aluno_nome}</td>
                      <td className="px-4 py-4">{registro.turma_nome}</td>
                      <td className="px-4 py-4">{formatDate(registro.data_aula)}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${registro.presente ? "bg-[#6A4FBF]/10 text-[#6A4FBF]" : "bg-[#E61E4D]/10 text-[#E61E4D]"}`}>
                          {registro.presente ? "PRESENTE" : "AUSENTE"}
                        </span>
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
