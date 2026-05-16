"use client";

import { useEffect, useMemo, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import { apiFetch } from "@/lib/api";
import { formatDateBR } from "@/lib/format";

type Fantasia = {
  id: number;
  valor_base: number;
  valor_final: number;
  multa: number;
  valor_pago: number;
  saldo: number;
  status: string;
  data_vencimento: string | null;
  numero_parcela: number;
  total_parcelas: number;
  aluno_id: number | null;
  aluno_nome: string | null;
  espetaculo_nome: string | null;
  coreografia_nome: string | null;
  papel_nome: string | null;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const statusOptions = [
  ["ABERTAS", "Em aberto"],
  ["PENDENTE", "Pendentes"],
  ["ATRASADA", "Atrasadas"],
  ["ATRASADA_COM_MULTA", "Atrasadas com multa"],
  ["PAGA", "Pagas"],
  ["CANCELADA", "Canceladas"],
];

export default function CobrancaFantasiaPage() {
  const [fantasias, setFantasias] = useState<Fantasia[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [payment, setPayment] = useState<Fantasia | null>(null);
  const [filters, setFilters] = useState({
    busca: "",
    status: "ABERTAS",
  });
  const [paymentForm, setPaymentForm] = useState({
    valor_pago: "",
    data_pagamento: new Date().toISOString().split("T")[0],
    forma_pagamento: "PIX",
  });

  useEffect(() => {
    loadFantasias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  const alunaOptions = useMemo(() => {
    const options = new Map<string, string>();
    fantasias.forEach((item) => {
      const nome = item.aluno_nome?.trim();
      if (nome) options.set(nome, nome);
    });
    return Array.from(options.entries()).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [fantasias]);

  const filteredFantasias = useMemo(() => {
    const termo = normalize(filters.busca);
    return fantasias.filter((item) => {
      if (filters.status === "ABERTAS" && ["PAGA", "CANCELADA"].includes(item.status)) return false;
      const searchable = [
        item.aluno_nome,
        item.espetaculo_nome,
        item.coreografia_nome,
        item.papel_nome,
        item.status,
      ].filter(Boolean).join(" ");
      return !termo || normalize(searchable).includes(termo);
    });
  }, [fantasias, filters.busca, filters.status]);

  const resumo = useMemo(() => {
    return filteredFantasias.reduce(
      (acc, item) => {
        acc.total += Number(item.valor_final || 0);
        acc.pago += Number(item.valor_pago || 0);
        acc.saldo += Number(item.saldo || 0);
        if (item.status === "PAGA") acc.pagas += 1;
        if (!["PAGA", "CANCELADA"].includes(item.status)) acc.abertas += 1;
        return acc;
      },
      { total: 0, pago: 0, saldo: 0, abertas: 0, pagas: 0 }
    );
  }, [filteredFantasias]);

  const loadFantasias = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "ABERTAS") params.set("status", filters.status);
      const response = await apiFetch(`/api/mensalidades/fantasias${params.toString() ? `?${params.toString()}` : ""}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar cobranças de fantasia");
      setFantasias(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar cobranças de fantasia");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ busca: "", status: "ABERTAS" });
  };

  const openPayment = (item: Fantasia) => {
    setPayment(item);
    setSuccess(null);
    setError(null);
    setPaymentForm({
      valor_pago: String(item.saldo > 0 ? item.saldo : item.valor_final),
      data_pagamento: new Date().toISOString().split("T")[0],
      forma_pagamento: "PIX",
    });
  };

  const savePayment = async () => {
    if (!payment) return;
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);
      const response = await apiFetch(`/api/mensalidades/${payment.id}/pagar`, {
        method: "POST",
        body: JSON.stringify({
          valor_pago: parseMoney(paymentForm.valor_pago),
          data_pagamento: paymentForm.data_pagamento,
          forma_pagamento: paymentForm.forma_pagamento,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao registrar pagamento");
      setPayment(null);
      setSuccess("Cobrança de fantasia marcada como paga.");
      await loadFantasias();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar pagamento");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-[#1F2A5A] p-6 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-[#F2F2F2]/80">Espetáculos</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Cobrança de Fantasia</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#F8FAFC]/90">
          Consulte alunas, valores das fantasias, parcelas e pagamentos em aberto.
        </p>
      </section>

      {success && <div className="rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">{success}</div>}
      {error && <div className="rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Total filtrado" value={currency.format(resumo.total)} />
        <SummaryCard label="Pago" value={currency.format(resumo.pago)} />
        <SummaryCard label="Em aberto" value={currency.format(resumo.saldo)} />
        <SummaryCard label="Status" value={`${resumo.abertas} aberta(s) / ${resumo.pagas} paga(s)`} />
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-[#F9FAFB] p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Busca</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Pesquisar cobranças</h2>
          </div>
          <button type="button" onClick={clearFilters} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
            Limpar filtros
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <SearchableSelect
            label="Buscar por aluna, espetáculo, coreografia ou papel"
            value={filters.busca}
            onChange={(value) => setFilters((prev) => ({ ...prev, busca: value }))}
            options={alunaOptions}
            placeholder="Digite para pesquisar"
            inputClassName="bg-white"
            searchOnType
          />
          <SearchableSelect
            label="Status"
            value={filters.status}
            onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
            options={statusOptions}
            placeholder="Todos"
            inputClassName="bg-white"
          />
        </div>
      </section>

      <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Resultado</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Alunas e fantasias ({filteredFantasias.length})</h2>
          </div>
          <p className="text-sm text-[#4B5563]">{loading ? "Atualizando..." : `${fantasias.length} cobrança(s) carregada(s)`}</p>
        </div>

        {loading ? (
          <p className="text-sm text-[#4B5563]">Carregando cobranças de fantasia...</p>
        ) : filteredFantasias.length === 0 ? (
          <p className="rounded-[18px] bg-[#F9FAFB] p-4 text-sm text-[#4B5563]">Nenhuma cobrança encontrada para os filtros selecionados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
              <thead>
                <tr className="bg-[#F9FAFB]">
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Aluna</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Espetáculo</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Coreografia</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Papel</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Parcela</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Vencimento</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Valor</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Pago</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Saldo</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Status</th>
                  <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredFantasias.map((item) => (
                  <tr key={item.id} className="bg-white hover:bg-[#F2F2F2]">
                    <td className="px-4 py-4 font-medium text-[#1F2A5A]">{item.aluno_nome || "-"}</td>
                    <td className="px-4 py-4">{item.espetaculo_nome || "-"}</td>
                    <td className="px-4 py-4">{item.coreografia_nome || "-"}</td>
                    <td className="px-4 py-4">{item.papel_nome || "-"}</td>
                    <td className="px-4 py-4">{item.numero_parcela}/{item.total_parcelas}</td>
                    <td className="px-4 py-4">{formatDateBR(item.data_vencimento)}</td>
                    <td className="px-4 py-4">{currency.format(item.valor_final)}</td>
                    <td className="px-4 py-4">{currency.format(item.valor_pago)}</td>
                    <td className={`px-4 py-4 font-semibold ${item.saldo > 0 ? "text-[#B42318]" : "text-[#0F766E]"}`}>{currency.format(item.saldo)}</td>
                    <td className="px-4 py-4">{formatStatus(item.status)}</td>
                    <td className="px-4 py-4">
                      {!["PAGA", "CANCELADA"].includes(item.status) ? (
                        <button type="button" onClick={() => openPayment(item)} className="rounded-full bg-[#E61E4D]/10 px-3 py-1 text-xs font-semibold text-[#E61E4D] transition hover:bg-[#E61E4D]/20">
                          Marcar paga
                        </button>
                      ) : (
                        <span className="text-xs text-[#4B5563]">Encerrada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {payment && (
        <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Pagamento</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Marcar fantasia como paga</h2>
              <p className="mt-1 text-sm text-[#4B5563]">{payment.aluno_nome || "Aluna"} - {payment.coreografia_nome || "Coreografia"}</p>
            </div>
            <button type="button" onClick={() => setPayment(null)} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
              Cancelar
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Valor pago" value={paymentForm.valor_pago} onChange={(value) => setPaymentForm((prev) => ({ ...prev, valor_pago: value }))} placeholder="0.00" />
            <Field label="Data do pagamento" type="date" value={paymentForm.data_pagamento} onChange={(value) => setPaymentForm((prev) => ({ ...prev, data_pagamento: value }))} placeholder="dd/mm/aaaa" />
            <SearchableSelect
              label="Forma de pagamento"
              value={paymentForm.forma_pagamento}
              onChange={(value) => setPaymentForm((prev) => ({ ...prev, forma_pagamento: value }))}
              options={[["PIX", "Pix"], ["CARTAO", "Cartão"], ["DINHEIRO", "Dinheiro"], ["TRANSFERENCIA", "Transferência"]]}
              placeholder="Forma"
              inputClassName="bg-[#F9FAFB]"
            />
          </div>

          <button type="button" disabled={processing} onClick={savePayment} className="mt-5 rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">
            Confirmar pagamento
          </button>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-[#6A4FBF]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#1F2A5A]">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20" placeholder={placeholder} />
    </div>
  );
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseMoney(value: string) {
  const normalized = value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value;
  return Number(normalized);
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
