"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatDateBR } from "@/lib/format";

type Turma = {
  id: number;
  nome: string;
};

type TipoDespesa = {
  id: number;
  nome: string;
};

type Movimentacao = {
  tipo_movimentacao: "RECEITA" | "DESPESA";
  categoria: string;
  descricao: string;
  pessoa: string | null;
  turma: string | null;
  data_movimentacao: string | null;
  valor: number;
  forma_pagamento: string | null;
  status: string | null;
};

type RelatorioReceitasDespesas = {
  movimentacoes: Movimentacao[];
  total_receitas: number;
  total_despesas: number;
  saldo_periodo: number;
};

type DreGrupo = {
  categoria: string;
  valor: number;
};

type Dre = {
  periodo: string;
  periodo_comparacao: string;
  regime: string;
  linhas: DreLinha[];
  receitas: DreGrupo[];
  despesas: DreGrupo[];
  total_receitas: number;
  total_despesas: number;
  resultado_periodo: number;
  situacao: "SUPERAVIT" | "DEFICIT";
};

type DreLinha = {
  id: string;
  grupo: string;
  descricao: string;
  valor: number;
  valor_comparacao: number;
  variacao: number;
  variacao_percentual: number | null;
  nivel: "detail" | "subtotal" | "total";
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const meses = [
  ["1", "Janeiro"],
  ["2", "Fevereiro"],
  ["3", "Marco"],
  ["4", "Abril"],
  ["5", "Maio"],
  ["6", "Junho"],
  ["7", "Julho"],
  ["8", "Agosto"],
  ["9", "Setembro"],
  ["10", "Outubro"],
  ["11", "Novembro"],
  ["12", "Dezembro"],
];

const today = new Date();
const initialFilters = {
  categoria: "",
  data_inicio: formatInputDate(new Date(today.getFullYear(), today.getMonth(), 1)),
  data_fim: formatInputDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
  turma_id: "",
  tipo_movimentacao: "",
};

export default function FuncionariosPage() {
  const [relatorio, setRelatorio] = useState<RelatorioReceitasDespesas | null>(null);
  const [dre, setDre] = useState<Dre | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [tiposDespesa, setTiposDespesa] = useState<TipoDespesa[]>([]);
  const [filters, setFilters] = useState(initialFilters);
  const [dreFilters, setDreFilters] = useState({
    tipo_periodo: "MENSAL",
    mes: String(today.getMonth() + 1),
    ano: String(today.getFullYear()),
  });
  const [loading, setLoading] = useState(true);
  const [dreLoading, setDreLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRefs();
    loadRelatorio();
    loadDre();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoriaOptions = useMemo(() => {
    const options = [
      ["MENSALIDADE", "Mensalidades"],
      ["VENDA", "Vendas"],
      ...tiposDespesa.map((tipo) => [String(tipo.id), `Despesa: ${tipo.nome}`]),
    ];
    return options;
  }, [tiposDespesa]);

  const chartData = useMemo(() => {
    const agrupado = new Map<string, { receitas: number; despesas: number }>();
    (relatorio?.movimentacoes || []).forEach((item) => {
      const label = item.categoria || "Sem categoria";
      const atual = agrupado.get(label) || { receitas: 0, despesas: 0 };
      if (item.tipo_movimentacao === "RECEITA") atual.receitas += Number(item.valor || 0);
      if (item.tipo_movimentacao === "DESPESA") atual.despesas += Number(item.valor || 0);
      agrupado.set(label, atual);
    });
    return Array.from(agrupado.entries())
      .map(([categoria, valores]) => ({ categoria, ...valores }))
      .sort((a, b) => (b.receitas + b.despesas) - (a.receitas + a.despesas))
      .slice(0, 6);
  }, [relatorio]);

  const maxChartValue = Math.max(
    1,
    ...chartData.map((item) => Math.max(item.receitas, item.despesas)),
    ...(dre ? dre.linhas.map((item) => Math.abs(item.valor)) : [0])
  );

  const loadRefs = async () => {
    try {
      const [turmasResponse, tiposResponse] = await Promise.all([
        apiFetch("/api/turmas?sort=nome"),
        apiFetch("/api/despesas/tipos?incluir_inativos=true"),
      ]);
      if (turmasResponse.ok) setTurmas(await turmasResponse.json());
      if (tiposResponse.ok) setTiposDespesa(await tiposResponse.json());
    } catch {
      setTurmas([]);
      setTiposDespesa([]);
    }
  };

  const loadRelatorio = async (activeFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const response = await apiFetch(`/api/relatorios-financeiros/receitas-despesas?${params.toString()}`);
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.error || "Erro ao carregar receitas e despesas");
      setRelatorio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar relatorio");
    } finally {
      setLoading(false);
    }
  };

  const loadDre = async () => {
    try {
      setDreLoading(true);
      const params = new URLSearchParams();
      params.set("tipo_periodo", dreFilters.tipo_periodo);
      params.set("ano", dreFilters.ano);
      if (dreFilters.tipo_periodo === "MENSAL") params.set("mes", dreFilters.mes);
      const response = await apiFetch(`/api/relatorios-financeiros/dre?${params.toString()}`);
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.error || "Erro ao carregar DRE");
      setDre(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar DRE");
    } finally {
      setDreLoading(false);
    }
  };

  const applyFilters = async (event: React.FormEvent) => {
    event.preventDefault();
    await loadRelatorio(filters);
  };

  const applyDreFilters = async (event: React.FormEvent) => {
    event.preventDefault();
    await loadDre();
  };

  const clearFilters = async () => {
    setFilters(initialFilters);
    await loadRelatorio(initialFilters);
  };

  const movimentos = relatorio?.movimentacoes || [];
  const hasMovimentos = movimentos.length > 0;

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-[#1F2A5A] p-6 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-[#F2F2F2]/80">Diretoria</p>
        <div className="mt-4 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Painel financeiro</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#F8FAFC]/90">
              Receitas, despesas, saldo do periodo e DRE consolidados para acompanhamento administrativo.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/funcionarios/relatorios/turmas" className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
              Relatorio de turmas
            </Link>
            <Link href="/funcionarios/relatorios/presencas" className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
              Relatorio de presencas
            </Link>
          </div>
        </div>
      </section>

      {error && <div className="rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Total de receitas" value={currency.format(relatorio?.total_receitas || 0)} />
        <SummaryCard label="Total de despesas" value={currency.format(relatorio?.total_despesas || 0)} />
        <SummaryCard label="Saldo do periodo" value={currency.format(relatorio?.saldo_periodo || 0)} tone={(relatorio?.saldo_periodo || 0) >= 0 ? "positive" : "negative"} />
        <SummaryCard label="Movimentacoes" value={String(movimentos.length)} />
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-[#F9FAFB] p-6 shadow-sm">
        <form onSubmit={applyFilters} className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Estoria 21</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Relatorio de receitas e despesas</h2>
            </div>
            <button type="button" onClick={clearFilters} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
              Limpar filtros
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Select label="Categoria" value={filters.categoria} onChange={(value) => setFilters((prev) => ({ ...prev, categoria: value }))} options={categoriaOptions} placeholder="Todas" />
            <Field label="Periodo inicial" type="date" value={filters.data_inicio} onChange={(value) => setFilters((prev) => ({ ...prev, data_inicio: value }))} />
            <Field label="Periodo final" type="date" value={filters.data_fim} onChange={(value) => setFilters((prev) => ({ ...prev, data_fim: value }))} />
            <Select label="Turma" value={filters.turma_id} onChange={(value) => setFilters((prev) => ({ ...prev, turma_id: value }))} options={turmas.map((turma) => [String(turma.id), turma.nome])} placeholder="Todas" />
            <Select label="Tipo" value={filters.tipo_movimentacao} onChange={(value) => setFilters((prev) => ({ ...prev, tipo_movimentacao: value }))} options={[["RECEITA", "Receita"], ["DESPESA", "Despesa"]]} placeholder="Todos" />
          </div>

          <button type="submit" className="rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A]">
            Aplicar filtros
          </button>
        </form>
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Grafico</p>
          <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Receitas x despesas por categoria</h2>
        </div>
        {chartData.length === 0 ? (
          <EmptyState text="Nenhum dado para montar o grafico com os filtros selecionados." />
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {chartData.map((item) => (
              <ChartRow key={item.categoria} label={formatCategoria(item.categoria)} receitas={item.receitas} despesas={item.despesas} max={maxChartValue} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <form onSubmit={applyDreFilters} className="mb-8 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Estoria 22</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">DRE</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <Select label="Periodo" value={dreFilters.tipo_periodo} onChange={(value) => setDreFilters((prev) => ({ ...prev, tipo_periodo: value }))} options={[["MENSAL", "Mensal"], ["ANUAL", "Anual"]]} />
            {dreFilters.tipo_periodo === "MENSAL" ? (
              <Select label="Mes" value={dreFilters.mes} onChange={(value) => setDreFilters((prev) => ({ ...prev, mes: value }))} options={meses} />
            ) : (
              <div className="hidden lg:block" />
            )}
            <Field label="Ano" value={dreFilters.ano} onChange={(value) => setDreFilters((prev) => ({ ...prev, ano: value }))} />
            <button type="submit" className="rounded-full bg-[#1F2A5A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6A4FBF]">
              Emitir DRE
            </button>
          </div>
        </form>

        {dreLoading ? (
          <p className="text-sm text-[#4B5563]">Carregando DRE...</p>
        ) : dre ? (
          <DrePanel dre={dre} max={maxChartValue} />
        ) : (
          <EmptyState text="Nao foi possivel carregar o DRE." />
        )}
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Resultado</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Movimentacoes financeiras</h2>
          </div>
          <p className="text-sm text-[#4B5563]">
            {loading ? "Atualizando..." : `${movimentos.length} registro(s) encontrado(s)`}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-[#4B5563]">Carregando relatorio...</p>
        ) : !hasMovimentos ? (
          <EmptyState text="Nao existem dados para os filtros selecionados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
              <thead>
                <tr className="bg-[#F9FAFB]">
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Categoria</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Descricao</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Aluno/Responsavel</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Turma</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Data</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Valor</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Forma</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {movimentos.map((item, index) => (
                  <tr key={`${item.tipo_movimentacao}-${index}-${item.data_movimentacao}`} className="bg-white hover:bg-[#F2F2F2]">
                    <td className="px-4 py-4 font-semibold text-[#1F2A5A]">{item.tipo_movimentacao === "RECEITA" ? "Receita" : "Despesa"}</td>
                    <td className="px-4 py-4">{formatCategoria(item.categoria)}</td>
                    <td className="px-4 py-4">{item.descricao}</td>
                    <td className="px-4 py-4">{item.pessoa || "-"}</td>
                    <td className="px-4 py-4">{item.turma || "-"}</td>
                    <td className="px-4 py-4">{formatDate(item.data_movimentacao)}</td>
                    <td className={`px-4 py-4 font-semibold ${item.tipo_movimentacao === "RECEITA" ? "text-[#0F766E]" : "text-[#B42318]"}`}>{currency.format(item.valor)}</td>
                    <td className="px-4 py-4">{formatCategoria(item.forma_pagamento || "-")}</td>
                    <td className="px-4 py-4">{formatCategoria(item.status || "-")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "positive" | "negative" }) {
  const toneClass = tone === "positive" ? "text-[#0F766E]" : tone === "negative" ? "text-[#B42318]" : "text-[#1F2A5A]";
  return (
    <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-[#6A4FBF]">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function ChartRow({ label, receitas, despesas, max }: { label: string; receitas: number; despesas: number; max: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#1F2A5A]">{label}</p>
        <p className="text-xs text-[#4B5563]">{currency.format(receitas - despesas)}</p>
      </div>
      <div className="space-y-2">
        <Bar label="Receitas" value={receitas} max={max} color="bg-[#0F766E]" />
        <Bar label="Despesas" value={despesas} max={max} color="bg-[#E61E4D]" />
      </div>
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = `${Math.max(4, Math.min(100, (value / max) * 100))}%`;
  return (
    <div className="grid grid-cols-[72px_1fr_96px] items-center gap-3 text-xs text-[#4B5563]">
      <span>{label}</span>
      <div className="h-3 overflow-hidden rounded-full bg-[#E5E7EB]">
        <div className={`h-full rounded-full ${color}`} style={{ width }} />
      </div>
      <span className="text-right">{currency.format(value)}</span>
    </div>
  );
}

function DrePanel({ dre, max }: { dre: Dre; max: number }) {
  const principais = dre.linhas.filter((linha) => ["receita_bruta", "receita_liquida", "lucro_bruto", "resultado_operacional_liquido", "resultado_liquido"].includes(linha.id));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryMini label="Periodo" value={dre.periodo} />
        <SummaryMini label="Resultado" value={currency.format(dre.resultado_periodo)} tone={dre.resultado_periodo >= 0 ? "positive" : "negative"} />
        <SummaryMini label="Situacao" value={dre.situacao === "SUPERAVIT" ? "Superavit" : "Deficit"} tone={dre.situacao === "SUPERAVIT" ? "positive" : "negative"} />
      </div>

      <div className="rounded-[18px] bg-[#F9FAFB] p-4 text-sm text-[#4B5563]">
        Regime de competencia: valores apurados pela ocorrencia do fato gerador. Comparacao com {dre.periodo_comparacao}.
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#1F2A5A]">Indicadores principais</h3>
        {principais.map((linha) => (
          <Bar key={linha.id} label={shortLabel(linha.grupo)} value={Math.abs(linha.valor)} max={max} color={linha.valor >= 0 ? "bg-[#0F766E]" : "bg-[#E61E4D]"} />
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
          <thead>
            <tr className="bg-[#F9FAFB]">
              <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Estrutura DRE</th>
              <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Descricao</th>
              <th className="px-4 py-3 text-right font-semibold text-[#1F2A5A]">{dre.periodo}</th>
              <th className="px-4 py-3 text-right font-semibold text-[#1F2A5A]">{dre.periodo_comparacao}</th>
              <th className="px-4 py-3 text-right font-semibold text-[#1F2A5A]">Variacao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {dre.linhas.map((linha) => (
              <tr key={linha.id} className={linha.nivel === "total" ? "bg-[#1F2A5A] text-white" : linha.nivel === "subtotal" ? "bg-[#EEF2FF]" : "bg-white hover:bg-[#F9FAFB]"}>
                <td className={`px-4 py-4 font-semibold ${linha.nivel === "total" ? "text-white" : "text-[#1F2A5A]"}`}>{linha.grupo}</td>
                <td className="px-4 py-4">{linha.descricao}</td>
                <td className={`px-4 py-4 text-right font-semibold ${linha.nivel !== "total" && linha.valor < 0 ? "text-[#B42318]" : ""}`}>{formatSignedCurrency(linha.valor)}</td>
                <td className={`px-4 py-4 text-right ${linha.nivel !== "total" && linha.valor_comparacao < 0 ? "text-[#B42318]" : ""}`}>{formatSignedCurrency(linha.valor_comparacao)}</td>
                <td className={`px-4 py-4 text-right font-semibold ${linha.nivel === "total" ? "text-white" : linha.variacao >= 0 ? "text-[#0F766E]" : "text-[#B42318]"}`}>
                  {formatSignedCurrency(linha.variacao)}
                  <span className="ml-2 text-xs opacity-80">{formatPercent(linha.variacao_percentual)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryMini({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "positive" | "negative" }) {
  const toneClass = tone === "positive" ? "text-[#0F766E]" : tone === "negative" ? "text-[#B42318]" : "text-[#1F2A5A]";
  return (
    <div className="rounded-[18px] border border-[#E5E7EB] bg-[#F9FAFB] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[#6A4FBF]">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-[18px] bg-[#F9FAFB] p-4 text-sm text-[#4B5563]">{text}</p>;
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([optionValue, optionLabel]) => (
          <option key={`${label}-${optionValue}`} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20" />
    </div>
  );
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string | null) {
  return formatDateBR(value);
}

function formatCategoria(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function shortLabel(value: string) {
  return value.replace("RESULTADO OPERACIONAL LIQUIDO", "OPERACIONAL").replace("RESULTADO LIQUIDO", "LIQUIDO").replace("RECEITA ", "");
}

function formatSignedCurrency(value: number) {
  if (value < 0) return `(${currency.format(Math.abs(value))})`;
  return currency.format(value);
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1).replace(".", ",")}%`;
}

async function readApiJson(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();

  const text = await response.text();
  const preview = text.replace(/\s+/g, " ").slice(0, 120);
  throw new Error(
    response.status === 404
      ? "Rota de relatorio financeiro nao encontrada. Reinicie o backend para carregar a nova API."
      : `A API retornou uma resposta inesperada: ${preview}`
  );
}
