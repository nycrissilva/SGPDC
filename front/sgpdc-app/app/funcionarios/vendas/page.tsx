"use client";

import { apiFetch } from "@/lib/api";
import { formatDateBR } from "@/lib/format";
import SearchableSelect from "@/components/SearchableSelect";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Produto = {
  id: number;
  nome: string;
  descricao: string | null;
  valor_unitario: number;
  status: string;
};

type Matricula = {
  id: number;
  aluno_id: number;
  aluno_nome: string;
  data_matricula: string | null;
  status: string;
};

type VendaItem = {
  id: number;
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
};

type Venda = {
  id: number;
  matricula_id: number;
  aluno_nome: string;
  data: string;
  valor_total: number;
  status: string;
  itens: VendaItem[];
};

type ItemForm = {
  produto_id: string;
  quantidade: string;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function VendasPage() {
  const today = new Date().toISOString().split("T")[0];
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saleForm, setSaleForm] = useState({
    matricula_id: "",
    data: today,
  });
  const [items, setItems] = useState<ItemForm[]>([{ produto_id: "", quantidade: "1" }]);
  const [filters, setFilters] = useState({ aluno_id: "", status: "" });

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadVendas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const produtosAtivos = useMemo(() => produtos.filter((produto) => produto.status === "ATIVO"), [produtos]);

  const totalForm = useMemo(() => {
    return items.reduce((total, item) => {
      const produto = produtosAtivos.find((option) => option.id === Number(item.produto_id));
      return total + Number(item.quantidade || 0) * Number(produto?.valor_unitario || 0);
    }, 0);
  }, [items, produtosAtivos]);

  const resumo = useMemo(() => {
    return vendas.reduce(
      (acc, venda) => {
        const status = normalizeVendaStatus(venda.status);
        if (status !== "CANCELADO") acc.total += Number(venda.valor_total || 0);
        if (status === "PAGO") acc.pagas += 1;
        if (status === "PENDENTE") acc.pendentes += 1;
        if (status === "CANCELADO") acc.canceladas += 1;
        return acc;
      },
      { total: 0, pagas: 0, pendentes: 0, canceladas: 0 }
    );
  }, [vendas]);

  const loadInitial = async () => {
    await Promise.all([loadProdutos(), loadMatriculas(), loadVendas()]);
  };

  const loadProdutos = async () => {
    try {
      const response = await apiFetch("/api/vendas/produtos?incluir_inativos=true");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar produtos");
      setProdutos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar produtos");
    }
  };

  const loadMatriculas = async () => {
    try {
      const response = await apiFetch("/api/vendas/matriculas");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar matrículas");
      setMatriculas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar matrículas");
    }
  };

  const loadVendas = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.aluno_id) params.set("aluno_id", filters.aluno_id);
      if (filters.status) params.set("status", filters.status);
      const response = await apiFetch(`/api/vendas${params.toString() ? `?${params.toString()}` : ""}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar vendas");
      setVendas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar vendas");
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
      await loadVendas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar operação");
    } finally {
      setProcessing(false);
    }
  };

  const addItem = () => setItems((prev) => [...prev, { produto_id: "", quantidade: "1" }]);

  const removeItem = (index: number) => {
    setItems((prev) => prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateItem = (index: number, field: keyof ItemForm, value: string) => {
    setItems((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  const registerSale = () => runAction("Venda registrada com sucesso.", async () => {
    const response = await apiFetch("/api/vendas", {
      method: "POST",
      body: JSON.stringify({
        matricula_id: Number(saleForm.matricula_id),
        data: saleForm.data,
        itens: items.map((item) => ({
          produto_id: Number(item.produto_id),
          quantidade: Number(item.quantidade),
        })),
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao registrar venda");
    setSaleForm({ matricula_id: "", data: today });
    setItems([{ produto_id: "", quantidade: "1" }]);
  });

  const cancelSale = (venda: Venda) => runAction("Venda cancelada com sucesso.", async () => {
    const response = await apiFetch(`/api/vendas/${venda.id}/cancelar`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao cancelar venda");
  });

  const paySale = (venda: Venda) => runAction("Venda marcada como paga.", async () => {
    const response = await apiFetch(`/api/vendas/${venda.id}/pagar`, {
      method: "POST",
      body: JSON.stringify({
        valor_pago: venda.valor_total,
        data_pagamento: today,
        forma_pagamento: "NAO_INFORMADO",
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao marcar venda como paga");
  });

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Receitas extras</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Vendas</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/funcionarios/produtos" className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
              Gerenciar produtos
            </Link>
            <Link href="/funcionarios" className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
              Voltar
            </Link>
          </div>
        </div>

        {success && <div className="mb-6 rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">{success}</div>}
        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <SummaryCard label="Receita confirmada" value={currency.format(resumo.total)} />
          <SummaryCard label="Pagas" value={String(resumo.pagas)} />
          <SummaryCard label="Pendentes" value={String(resumo.pendentes)} />
          <SummaryCard label="Canceladas" value={String(resumo.canceladas)} />
        </div>

        <div className="mb-8">
          <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Nova venda</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Registrar venda</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Select label="Matrícula" value={saleForm.matricula_id} onChange={(value) => setSaleForm((prev) => ({ ...prev, matricula_id: value }))} options={matriculas.map((item) => [String(item.id), `${item.aluno_nome} - matrícula ${item.id}`])} placeholder="Selecione" />
              <Field label="Data da venda" type="date" value={saleForm.data} onChange={(value) => setSaleForm((prev) => ({ ...prev, data: value }))} placeholder="dd/mm/aaaa" />
            </div>

            <div className="mt-6 space-y-4">
              {items.map((item, index) => {
                const produto = produtosAtivos.find((option) => option.id === Number(item.produto_id));
                const subtotal = Number(item.quantidade || 0) * Number(produto?.valor_unitario || 0);
                return (
                  <div key={index} className="grid gap-4 rounded-[24px] border border-[#E5E7EB] bg-[#F9FAFB] p-4 md:grid-cols-[1fr_120px_120px_auto] md:items-end">
                    <Select label="Produto" value={item.produto_id} onChange={(value) => updateItem(index, "produto_id", value)} options={produtosAtivos.map((produtoOption) => [String(produtoOption.id), `${produtoOption.nome} - ${currency.format(produtoOption.valor_unitario)}`])} placeholder="Selecione" />
                    <Field label="Quantidade" type="number" value={item.quantidade} onChange={(value) => updateItem(index, "quantidade", value)} placeholder="1" />
                    <div>
                      <p className="mb-2 text-sm font-medium text-[#1F2A5A]">Subtotal</p>
                      <p className="rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1F2A5A]">{currency.format(subtotal)}</p>
                    </div>
                    <button type="button" onClick={() => removeItem(index)} className="rounded-full bg-[#E61E4D]/10 px-4 py-3 text-sm font-semibold text-[#E61E4D] transition hover:bg-[#E61E4D]/20">
                      Remover
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={addItem} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
                Adicionar produto
              </button>
              <p className="text-lg font-semibold text-[#1F2A5A]">Total: {currency.format(totalForm)}</p>
            </div>

            <button type="button" disabled={processing} onClick={registerSale} className="mt-6 rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">
              Confirmar venda
            </button>
          </section>
        </div>

        <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Consulta</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Vendas registradas ({vendas.length})</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Aluno" value={filters.aluno_id} onChange={(value) => setFilters((prev) => ({ ...prev, aluno_id: value }))} options={matriculas.map((item) => [String(item.aluno_id), item.aluno_nome])} placeholder="Todos" />
              <Select label="Status" value={filters.status} onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))} options={[["PENDENTE", "Pendente"], ["PAGO", "Pago"], ["CANCELADO", "Cancelado"]]} placeholder="Todos" />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando vendas...</p>
          ) : vendas.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhuma venda encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Data</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Aluno</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Itens</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Total</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Status</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {vendas.map((venda) => {
                    const status = normalizeVendaStatus(venda.status);
                    return (
                      <tr key={venda.id} className="bg-white hover:bg-[#F2F2F2]">
                        <td className="px-4 py-4">{formatDate(venda.data)}</td>
                        <td className="px-4 py-4 font-medium">{venda.aluno_nome}</td>
                        <td className="px-4 py-4">
                          {venda.itens.map((item) => `${item.quantidade}x ${item.produto_nome}`).join(", ")}
                        </td>
                        <td className="px-4 py-4">{currency.format(venda.valor_total)}</td>
                        <td className="px-4 py-4">{status}</td>
                        <td className="px-4 py-4">
                          {status !== "CANCELADO" ? (
                            <div className="flex flex-wrap gap-2">
                              {status !== "PAGO" && (
                                <button type="button" onClick={() => paySale(venda)} className="rounded-full bg-[#6A4FBF]/10 px-3 py-1 text-xs text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
                                  Marcar paga
                                </button>
                              )}
                              <button type="button" onClick={() => cancelSale(venda)} className="rounded-full bg-[#E61E4D]/10 px-3 py-1 text-xs text-[#E61E4D] transition hover:bg-[#E61E4D]/20">
                                Cancelar
                              </button>
                            </div>
                          ) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
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

function Select({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; placeholder: string }) {
  return <SearchableSelect label={label} value={value} onChange={onChange} options={options} placeholder={placeholder} inputClassName="bg-[#F9FAFB]" />;
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20" placeholder={placeholder} />
    </div>
  );
}

function normalizeVendaStatus(status: string) {
  const value = String(status || "").toUpperCase();
  if (value === "PAGA") return "PAGO";
  if (value === "CANCELADA") return "CANCELADO";
  if (value === "CONFIRMADA") return "PENDENTE";
  return value || "PENDENTE";
}

function formatDate(value: string | null) {
  return formatDateBR(value);
}
