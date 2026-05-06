"use client";

import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TipoDespesa = {
  id: number;
  nome: string;
  descricao: string | null;
  status: string;
};

type Parcela = {
  id: number;
  despesa_id: number;
  numero_parcela: number;
  total_parcelas: number;
  valor: number;
  data_vencimento: string | null;
  data_pagamento: string | null;
  forma_pagamento: string | null;
  status: string;
};

type Despesa = {
  id: number;
  tipo_despesa_id: number;
  tipo_despesa_nome: string;
  descricao: string;
  valor_total: number;
  data_despesa: string;
  forma_pagamento_prevista: string;
  quantidade_parcelas: number;
  data_primeiro_vencimento: string;
  status: string;
  valor_pago: number;
  saldo: number;
  parcelas_abertas: number;
  parcelas_pagas: number;
  parcelas: Parcela[];
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const emptyForm = (today: string) => ({
  descricao: "",
  tipo_despesa_id: "",
  valor_total: "",
  data_despesa: today,
  forma_pagamento_prevista: "PIX",
  pagamento: "A_VISTA",
  quantidade_parcelas: "1",
  data_primeiro_vencimento: today,
});

export default function DespesasPage() {
  const today = new Date().toISOString().split("T")[0];
  const [tipos, setTipos] = useState<TipoDespesa[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<Despesa | null>(null);
  const [paying, setPaying] = useState<Parcela | null>(null);
  const [form, setForm] = useState(emptyForm(today));
  const [paymentForm, setPaymentForm] = useState({
    data_pagamento: today,
    forma_pagamento: "PIX",
  });
  const [tipoForm, setTipoForm] = useState({ nome: "", descricao: "" });
  const [filters, setFilters] = useState({
    tipo_despesa_id: "",
    status: "",
    em_aberto: "",
  });

  useEffect(() => {
    loadTipos();
    loadDespesas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadDespesas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const resumo = useMemo(() => {
    return despesas.reduce(
      (acc, despesa) => {
        acc.total += Number(despesa.valor_total || 0);
        acc.pago += Number(despesa.valor_pago || 0);
        acc.saldo += Number(despesa.saldo || 0);
        if (despesa.status === "QUITADA") acc.quitadas += 1;
        if (despesa.status === "PENDENTE") acc.pendentes += 1;
        return acc;
      },
      { total: 0, pago: 0, saldo: 0, pendentes: 0, quitadas: 0 }
    );
  }, [despesas]);

  const loadTipos = async () => {
    try {
      const response = await apiFetch("/api/despesas/tipos?incluir_inativos=true");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar categorias");
      setTipos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar categorias");
    }
  };

  const loadDespesas = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.tipo_despesa_id) params.set("tipo_despesa_id", filters.tipo_despesa_id);
      if (filters.status) params.set("status", filters.status);
      if (filters.em_aberto) params.set("em_aberto", "true");
      const response = await apiFetch(`/api/despesas${params.toString() ? `?${params.toString()}` : ""}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar despesas");
      setDespesas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar despesas");
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (message: string, action: () => Promise<void>) => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);
      await action();
      setSuccess(message);
      await Promise.all([loadTipos(), loadDespesas()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar operacao");
    } finally {
      setProcessing(false);
    }
  };

  const submitDespesa = () => runAction(editing ? "Despesa atualizada com sucesso." : "Despesa lancada com sucesso.", async () => {
    const parcelas = form.pagamento === "PARCELADO" ? Number(form.quantidade_parcelas) : 1;
    const response = await apiFetch(editing ? `/api/despesas/${editing.id}` : "/api/despesas", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify({
        descricao: form.descricao,
        tipo_despesa_id: Number(form.tipo_despesa_id),
        valor_total: Number(form.valor_total),
        data_despesa: form.data_despesa,
        forma_pagamento_prevista: form.forma_pagamento_prevista,
        pagamento: form.pagamento,
        quantidade_parcelas: parcelas,
        data_primeiro_vencimento: form.data_primeiro_vencimento,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao salvar despesa");
    setEditing(null);
    setForm(emptyForm(today));
  });

  const createTipo = () => runAction("Categoria cadastrada com sucesso.", async () => {
    const response = await apiFetch("/api/despesas/tipos", {
      method: "POST",
      body: JSON.stringify(tipoForm),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao cadastrar categoria");
    setTipoForm({ nome: "", descricao: "" });
    setForm((prev) => ({ ...prev, tipo_despesa_id: String(data.id) }));
  });

  const openEdit = (despesa: Despesa) => {
    setPaying(null);
    setEditing(despesa);
    setForm({
      descricao: despesa.descricao,
      tipo_despesa_id: String(despesa.tipo_despesa_id),
      valor_total: String(despesa.valor_total),
      data_despesa: despesa.data_despesa || today,
      forma_pagamento_prevista: despesa.forma_pagamento_prevista || "PIX",
      pagamento: despesa.quantidade_parcelas > 1 ? "PARCELADO" : "A_VISTA",
      quantidade_parcelas: String(despesa.quantidade_parcelas || 1),
      data_primeiro_vencimento: despesa.data_primeiro_vencimento || today,
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm(today));
  };

  const openPayment = (parcela: Parcela) => {
    setEditing(null);
    setPaying(parcela);
    setPaymentForm({ data_pagamento: today, forma_pagamento: "PIX" });
  };

  const quitarParcela = () => {
    if (!paying) return;
    runAction("Parcela quitada com sucesso.", async () => {
      const response = await apiFetch(`/api/despesas/parcelas/${paying.id}/quitar`, {
        method: "POST",
        body: JSON.stringify(paymentForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao quitar parcela");
      setPaying(null);
    });
  };

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Financeiro</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Despesas</h1>
          </div>
          <Link href="/funcionarios" className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
            Voltar
          </Link>
        </div>

        {success && <div className="mb-6 rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">{success}</div>}
        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <SummaryCard label="Total lancado" value={currency.format(resumo.total)} />
          <SummaryCard label="Pago" value={currency.format(resumo.pago)} />
          <SummaryCard label="Em aberto" value={currency.format(resumo.saldo)} />
          <SummaryCard label="Status" value={`${resumo.pendentes} pendente(s) / ${resumo.quitadas} quitada(s)`} />
        </div>

        <div className="mb-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">{editing ? "Edicao" : "Lancamento"}</p>
                <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">{editing ? `Editar despesa #${editing.id}` : "Lancar despesa"}</h2>
              </div>
              {editing && (
                <button type="button" onClick={cancelEdit} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
                  Cancelar edicao
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Descricao" value={form.descricao} onChange={(value) => setForm((prev) => ({ ...prev, descricao: value }))} placeholder="Ex.: Conta de energia" />
              <Select label="Categoria" value={form.tipo_despesa_id} onChange={(value) => setForm((prev) => ({ ...prev, tipo_despesa_id: value }))} options={tipos.filter((tipo) => tipo.status === "ATIVO").map((tipo) => [String(tipo.id), tipo.nome])} placeholder="Selecione uma categoria" disabledPlaceholder />
              <Field label="Valor total" value={form.valor_total} onChange={(value) => setForm((prev) => ({ ...prev, valor_total: value }))} placeholder="0.00" />
              <Field label="Data da despesa" type="date" value={form.data_despesa} onChange={(value) => setForm((prev) => ({ ...prev, data_despesa: value }))} placeholder="YYYY-MM-DD" />
              <Select label="Forma prevista" value={form.forma_pagamento_prevista} onChange={(value) => setForm((prev) => ({ ...prev, forma_pagamento_prevista: value }))} options={[["PIX", "Pix"], ["CARTAO", "Cartao"], ["DINHEIRO", "Dinheiro"], ["BOLETO", "Boleto"], ["TRANSFERENCIA", "Transferencia"]]} />
              <Select label="Pagamento" value={form.pagamento} onChange={(value) => setForm((prev) => ({ ...prev, pagamento: value, quantidade_parcelas: value === "A_VISTA" ? "1" : prev.quantidade_parcelas }))} options={[["A_VISTA", "A vista"], ["PARCELADO", "Parcelado"]]} />
              {form.pagamento === "PARCELADO" && (
                <Field label="Quantidade de parcelas" value={form.quantidade_parcelas} onChange={(value) => setForm((prev) => ({ ...prev, quantidade_parcelas: value }))} placeholder="2" />
              )}
              <Field label="Primeiro vencimento" type="date" value={form.data_primeiro_vencimento} onChange={(value) => setForm((prev) => ({ ...prev, data_primeiro_vencimento: value }))} placeholder="YYYY-MM-DD" />
            </div>

            <button type="button" disabled={processing} onClick={submitDespesa} className="mt-6 rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">
              {editing ? "Salvar alteracoes" : "Lancar despesa"}
            </button>
          </section>

          <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Categorias</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Nova categoria</h2>
            </div>
            <div className="space-y-4">
              <Field label="Nome" value={tipoForm.nome} onChange={(value) => setTipoForm((prev) => ({ ...prev, nome: value }))} placeholder="Ex.: Manutencao" />
              <Field label="Descricao" value={tipoForm.descricao} onChange={(value) => setTipoForm((prev) => ({ ...prev, descricao: value }))} placeholder="Opcional" />
              <button type="button" disabled={processing} onClick={createTipo} className="rounded-full bg-[#1F2A5A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6A4FBF] disabled:opacity-50">
                Cadastrar categoria
              </button>
            </div>
          </section>
        </div>

        <section className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-[#F9FAFB] p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Filtros</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Consultar despesas</h2>
            </div>
            <button type="button" onClick={() => setFilters({ tipo_despesa_id: "", status: "", em_aberto: "" })} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
              Limpar filtros
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Select label="Categoria" value={filters.tipo_despesa_id} onChange={(value) => setFilters((prev) => ({ ...prev, tipo_despesa_id: value }))} options={tipos.map((tipo) => [String(tipo.id), tipo.nome])} placeholder="Todas as categorias" />
            <Select label="Status da despesa" value={filters.status} onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))} options={[["PENDENTE", "Pendente"], ["QUITADA", "Quitada"], ["CANCELADA", "Cancelada"]]} placeholder="Todos os status" />
            <Select label="Parcelas" value={filters.em_aberto} onChange={(value) => setFilters((prev) => ({ ...prev, em_aberto: value }))} options={[["SIM", "Com parcelas pendentes"]]} placeholder="Todas as despesas" />
          </div>
        </section>

        <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Contas a pagar</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Despesas lancadas ({despesas.length})</h2>
          </div>

          {loading ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando despesas...</p>
          ) : despesas.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhuma despesa encontrada.</p>
          ) : (
            <div className="space-y-5">
              {despesas.map((despesa) => (
                <div key={despesa.id} className="rounded-[24px] border border-[#E5E7EB] bg-white p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#1F2A5A]">{despesa.descricao}</p>
                      <p className="mt-1 text-sm text-[#4B5563]">{despesa.tipo_despesa_nome} - {formatDate(despesa.data_despesa)} - {despesa.status}</p>
                      <p className="mt-2 text-sm text-[#4B5563]">Total {currency.format(despesa.valor_total)} | Pago {currency.format(despesa.valor_pago)} | Aberto {currency.format(despesa.saldo)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {despesa.parcelas_pagas === 0 && despesa.status !== "QUITADA" && (
                        <button type="button" onClick={() => openEdit(despesa)} className="rounded-full bg-[#6A4FBF]/10 px-3 py-2 text-xs font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
                          Editar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                      <thead>
                        <tr className="bg-[#F9FAFB]">
                          <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Parcela</th>
                          <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Vencimento</th>
                          <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Valor</th>
                          <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Status</th>
                          <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Pagamento</th>
                          <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Acoes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {despesa.parcelas.map((parcela) => (
                          <tr key={parcela.id} className="bg-white hover:bg-[#F2F2F2]">
                            <td className="px-4 py-4">{parcela.numero_parcela}/{parcela.total_parcelas}</td>
                            <td className="px-4 py-4">{formatDate(parcela.data_vencimento)}</td>
                            <td className="px-4 py-4">{currency.format(parcela.valor)}</td>
                            <td className="px-4 py-4">{parcela.status}</td>
                            <td className="px-4 py-4">{parcela.data_pagamento ? `${formatDate(parcela.data_pagamento)} - ${parcela.forma_pagamento}` : "-"}</td>
                            <td className="px-4 py-4">
                              {["PENDENTE", "ATRASADA"].includes(parcela.status) ? (
                                <button type="button" onClick={() => openPayment(parcela)} className="rounded-full bg-[#E61E4D]/10 px-3 py-1 text-xs text-[#E61E4D] transition hover:bg-[#E61E4D]/20">
                                  Quitar
                                </button>
                              ) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {paying && (
          <section className="mt-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Quitacao</p>
                <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Quitar parcela {paying.numero_parcela}/{paying.total_parcelas}</h2>
              </div>
              <button type="button" onClick={() => setPaying(null)} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
                Cancelar
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="mb-2 text-sm font-medium text-[#1F2A5A]">Valor</p>
                <p className="rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm font-semibold text-[#1F2A5A]">{currency.format(paying.valor)}</p>
              </div>
              <Field label="Data do pagamento" type="date" value={paymentForm.data_pagamento} onChange={(value) => setPaymentForm((prev) => ({ ...prev, data_pagamento: value }))} placeholder="YYYY-MM-DD" />
              <Select label="Forma de pagamento" value={paymentForm.forma_pagamento} onChange={(value) => setPaymentForm((prev) => ({ ...prev, forma_pagamento: value }))} options={[["PIX", "Pix"], ["CARTAO", "Cartao"], ["DINHEIRO", "Dinheiro"], ["BOLETO", "Boleto"], ["TRANSFERENCIA", "Transferencia"]]} />
            </div>
            <button type="button" disabled={processing} onClick={quitarParcela} className="mt-6 rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">
              Confirmar quitacao
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F9FAFB] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-[#6A4FBF]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#1F2A5A]">{value}</p>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabledPlaceholder = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
  placeholder?: string;
  disabledPlaceholder?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20">
        {placeholder && <option value="" disabled={disabledPlaceholder}>{placeholder}</option>}
        {options.map(([optionValue, optionLabel], index) => (
          <option key={`${optionValue}-${index}`} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} inputMode={type === "text" ? "decimal" : undefined} className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20" placeholder={placeholder} />
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}
