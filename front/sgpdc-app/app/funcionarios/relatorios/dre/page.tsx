"use client";

import { useEffect, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import { apiFetch } from "@/lib/api";

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
  ["3", "Março"],
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

export default function DrePage() {
  const [dre, setDre] = useState<Dre | null>(null);
  const [filters, setFilters] = useState({
    tipo_periodo: "MENSAL",
    mes: String(today.getMonth() + 1),
    ano: String(today.getFullYear()),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDre();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxChartValue = Math.max(1, ...(dre ? dre.linhas.map((item) => Math.abs(item.valor)) : [0]));

  const loadDre = async (activeFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("tipo_periodo", activeFilters.tipo_periodo);
      params.set("ano", activeFilters.ano);
      if (activeFilters.tipo_periodo === "MENSAL") params.set("mes", activeFilters.mes);
      const response = await apiFetch(`/api/relatorios-financeiros/dre?${params.toString()}`);
      const data = await readApiJson(response);
      if (!response.ok) throw new Error(data.error || "Erro ao carregar DRE");
      setDre(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar DRE");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async (event: React.FormEvent) => {
    event.preventDefault();
    await loadDre(filters);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-[#1F2A5A] p-6 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-[#F2F2F2]/80">Relatório</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">DRE</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#F8FAFC]/90">
          Demonstrativo do Resultado do Exercício com apuração por competência e comparação de período.
        </p>
      </section>

      {error && <div className="rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <form onSubmit={applyFilters} className="mb-8 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Demonstrativo</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Filtros do DRE</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <Select label="Período" value={filters.tipo_periodo} onChange={(value) => setFilters((prev) => ({ ...prev, tipo_periodo: value }))} options={[["MENSAL", "Mensal"], ["ANUAL", "Anual"]]} />
            {filters.tipo_periodo === "MENSAL" ? (
              <Select label="Mês" value={filters.mes} onChange={(value) => setFilters((prev) => ({ ...prev, mes: value }))} options={meses} />
            ) : (
              <div className="hidden lg:block" />
            )}
            <Field label="Ano" value={filters.ano} onChange={(value) => setFilters((prev) => ({ ...prev, ano: value }))} />
            <button type="submit" className="rounded-full bg-[#1F2A5A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6A4FBF]">
              Emitir DRE
            </button>
          </div>
        </form>

        {loading ? (
          <p className="text-sm text-[#4B5563]">Carregando DRE...</p>
        ) : dre ? (
          <DrePanel dre={dre} max={maxChartValue} />
        ) : (
          <EmptyState text="Não foi possível carregar o DRE." />
        )}
      </section>
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
        <SummaryMini label="Período" value={dre.periodo} />
        <SummaryMini label="Resultado" value={currency.format(dre.resultado_periodo)} tone={dre.resultado_periodo >= 0 ? "positive" : "negative"} />
        <SummaryMini label="Situação" value={dre.situacao === "SUPERAVIT" ? "Superávit" : "Déficit"} tone={dre.situacao === "SUPERAVIT" ? "positive" : "negative"} />
      </div>

      <div className="rounded-[18px] bg-[#F9FAFB] p-4 text-sm text-[#4B5563]">
        Regime de competência: valores apurados pela ocorrência do fato gerador. Comparação com {dre.periodo_comparacao}.
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
              <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Descrição</th>
              <th className="px-4 py-3 text-right font-semibold text-[#1F2A5A]">{dre.periodo}</th>
              <th className="px-4 py-3 text-right font-semibold text-[#1F2A5A]">{dre.periodo_comparacao}</th>
              <th className="px-4 py-3 text-right font-semibold text-[#1F2A5A]">Variação</th>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
}) {
  return <SearchableSelect label={label} value={value} onChange={onChange} options={options} placeholder="Selecione" />;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20" />
    </div>
  );
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
      ? "Rota de DRE não encontrada. Reinicie o backend para carregar a nova API."
      : `A API retornou uma resposta inesperada: ${preview}`
  );
}
