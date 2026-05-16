"use client";

import { apiFetch } from "@/lib/api";
import { formatDateBR } from "@/lib/format";
import SearchableSelect from "@/components/SearchableSelect";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Conta = {
  id: number | string;
  prevista?: boolean;
  plano_financeiro_id?: number | null;
  mes_referencia?: number | null;
  ano_referencia?: number | null;
  valor_base?: number;
  valor_final: number;
  multa?: number;
  valor_pago: number;
  saldo: number;
  status: string;
  data_vencimento?: string | null;
  responsavel_nome?: string | null;
  plano_nome?: string | null;
  espetaculo_nome?: string | null;
  coreografia_nome?: string | null;
  papel_nome?: string | null;
  numero_parcela?: number;
  total_parcelas?: number;
};

type Venda = {
  id: number;
  data: string | null;
  valor_total: number;
  status: string;
  itens?: { produto_nome: string; quantidade: number }[];
};

type Aluno = {
  id: number;
  nome: string;
  cpf?: string;
  data_matricula?: string;
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const meses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function ContasAlunoPage() {
  const params = useParams<{ id: string }>();
  const alunoId = params.id;
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [mensalidades, setMensalidades] = useState<Conta[]>([]);
  const [fantasias, setFantasias] = useState<Conta[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [payment, setPayment] = useState<{ type: "mensalidade" | "fantasia" | "venda"; item: Conta | Venda } | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    valor_pago: "",
    data_pagamento: new Date().toISOString().split("T")[0],
    forma_pagamento: "PIX",
  });

  useEffect(() => {
    loadAluno();
    loadContas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId, statusFilter]);

  const resumo = useMemo(() => {
    const base = { total: 0, pago: 0, saldo: 0, pendentes: 0, pagas: 0 };
    [...mensalidades, ...fantasias].forEach((item) => {
      base.total += Number(item.valor_final || 0);
      base.pago += Number(item.valor_pago || 0);
      base.saldo += Number(item.saldo || 0);
      if (item.status === "PAGA") base.pagas += 1;
      if (!["PAGA", "CANCELADA"].includes(item.status)) base.pendentes += 1;
    });
    vendas.forEach((item) => {
      const valor = Number(item.valor_total || 0);
      base.total += valor;
      if (item.status === "PAGO") {
        base.pago += valor;
        base.pagas += 1;
      } else if (item.status !== "CANCELADO") {
        base.saldo += valor;
        base.pendentes += 1;
      }
    });
    return base;
  }, [mensalidades, fantasias, vendas]);

  async function loadAluno() {
    try {
      const response = await apiFetch(`/api/alunos/${alunoId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar aluno");
      setAluno(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar aluno");
    }
  }

  async function loadContas() {
    try {
      setLoading(true);
      setError(null);
      const mensalidadesParams = new URLSearchParams({ aluno_id: String(alunoId) });
      const vendasParams = new URLSearchParams({ aluno_id: String(alunoId) });
      if (statusFilter) {
        mensalidadesParams.set("status", statusFilter);
        vendasParams.set("status", mapStatusVenda(statusFilter));
      }
      const [mensalidadesData, fantasiasData, vendasData] = await Promise.all([
        fetchJson(`/api/mensalidades?${mensalidadesParams.toString()}`),
        fetchJson(`/api/mensalidades/fantasias?${mensalidadesParams.toString()}`),
        fetchJson(`/api/vendas?${vendasParams.toString()}`),
      ]);
      setMensalidades(Array.isArray(mensalidadesData) ? mensalidadesData : []);
      setFantasias(Array.isArray(fantasiasData) ? fantasiasData : []);
      setVendas(Array.isArray(vendasData) ? vendasData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(message: string, action: () => Promise<void>) {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);
      await action();
      setSuccess(message);
      await loadContas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar operação");
    } finally {
      setProcessing(false);
    }
  }

  function openPayment(type: "mensalidade" | "fantasia" | "venda", item: Conta | Venda) {
    const valor = "saldo" in item && item.saldo > 0 ? item.saldo : "valor_total" in item ? item.valor_total : item.valor_final;
    setPayment({ type, item });
    setPaymentForm({ valor_pago: String(valor || 0), data_pagamento: new Date().toISOString().split("T")[0], forma_pagamento: "PIX" });
  }

  async function savePayment() {
    if (!payment) return;
    await runAction("Pagamento registrado.", async () => {
      const path = payment.type === "venda" ? `/api/vendas/${payment.item.id}/pagar` : `/api/mensalidades/${payment.item.id}/pagar`;
      const response = await apiFetch(path, {
        method: "POST",
        body: JSON.stringify({
          valor_pago: Number(paymentForm.valor_pago),
          data_pagamento: paymentForm.data_pagamento,
          forma_pagamento: paymentForm.forma_pagamento,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao registrar pagamento");
      setPayment(null);
    });
  }

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Financeiro do aluno</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">{aluno?.nome || "Contas do aluno"}</h1>
            {aluno && <p className="mt-2 text-sm text-[#4B5563]">CPF {aluno.cpf || "-"} | Matrícula {formatDateBR(aluno.data_matricula)}</p>}
          </div>
          <Link href="/funcionarios/alunos" className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
            Voltar
          </Link>
        </div>

        {success && <div className="mb-6 rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">{success}</div>}
        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <SummaryCard label="Total" value={currency.format(resumo.total)} />
          <SummaryCard label="Pago" value={currency.format(resumo.pago)} />
          <SummaryCard label="Em aberto" value={currency.format(resumo.saldo)} />
          <SummaryCard label="Status" value={`${resumo.pendentes} pendente(s) / ${resumo.pagas} paga(s)`} />
        </div>

        <section className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={[["PENDENTE", "Pendente"], ["ATRASADA", "Atrasada"], ["ATRASADA_COM_MULTA", "Atrasada com multa"], ["PAGA", "Paga"], ["CANCELADA", "Cancelada"]]} placeholder="Todos" />
        </section>

        <ContaTable title="Mensalidades" items={mensalidades} loading={loading} kind="mensalidade" onPay={openPayment} />
        <ContaTable title="Cobranças de fantasia" items={fantasias} loading={loading} kind="fantasia" onPay={openPayment} />
        <VendaTable vendas={vendas} loading={loading} onPay={openPayment} />

        {payment && (
          <section className="mt-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Pagamento</p>
                <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Marcar conta como paga</h2>
              </div>
              <button type="button" onClick={() => setPayment(null)} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF]">Cancelar</button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Valor pago" value={paymentForm.valor_pago} onChange={(value) => setPaymentForm((prev) => ({ ...prev, valor_pago: value }))} />
              <Field label="Data do pagamento" type="date" value={paymentForm.data_pagamento} onChange={(value) => setPaymentForm((prev) => ({ ...prev, data_pagamento: value }))} />
              <Select label="Forma de pagamento" value={paymentForm.forma_pagamento} onChange={(value) => setPaymentForm((prev) => ({ ...prev, forma_pagamento: value }))} options={[["PIX", "Pix"], ["CARTAO", "Cartão"], ["DINHEIRO", "Dinheiro"], ["TRANSFERENCIA", "Transferência"]]} />
            </div>
            <button type="button" disabled={processing} onClick={savePayment} className="mt-6 rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              Confirmar pagamento
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

function ContaTable({ title, items, loading, kind, onPay }: { title: string; items: Conta[]; loading: boolean; kind: "mensalidade" | "fantasia"; onPay: (type: "mensalidade" | "fantasia", item: Conta) => void }) {
  return (
    <section className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold text-[#1F2A5A]">{title} ({items.length})</h2>
      {loading ? <p className="text-sm text-[#2B2B2B]/70">Carregando contas...</p> : items.length === 0 ? <p className="text-sm text-[#2B2B2B]/70">Nenhuma conta encontrada.</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
            <thead>
              <tr className="bg-[#F9FAFB]">
                <Th>Referência</Th><Th>Responsável</Th><Th>Detalhe</Th><Th>Vencimento</Th><Th>Total</Th><Th>Pago</Th><Th>Saldo</Th><Th>Status</Th><Th>Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {items.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-[#F2F2F2]">
                  <Td>{formatReferencia(item.mes_referencia, item.ano_referencia) || `${item.numero_parcela || "-"} / ${item.total_parcelas || "-"}`}</Td>
                  <Td>{item.responsavel_nome || "-"}</Td>
                  <Td>{item.plano_nome || item.espetaculo_nome || item.coreografia_nome || item.papel_nome || "-"}</Td>
                  <Td>{formatDateBR(item.data_vencimento)}</Td>
                  <Td>{currency.format(item.valor_final)}</Td>
                  <Td>{currency.format(item.valor_pago)}</Td>
                  <Td>{currency.format(item.saldo)}</Td>
                  <Td>{item.status}{item.prevista ? " (prevista)" : ""}</Td>
                  <Td>{!["PAGA", "CANCELADA"].includes(item.status) ? <SmallButton onClick={() => onPay(kind, item)}>Marcar paga</SmallButton> : "-"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function VendaTable({ vendas, loading, onPay }: { vendas: Venda[]; loading: boolean; onPay: (type: "venda", item: Venda) => void }) {
  return (
    <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold text-[#1F2A5A]">Produtos e outras contas ({vendas.length})</h2>
      {loading ? <p className="text-sm text-[#2B2B2B]/70">Carregando vendas...</p> : vendas.length === 0 ? <p className="text-sm text-[#2B2B2B]/70">Nenhuma venda encontrada.</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
            <thead><tr className="bg-[#F9FAFB]"><Th>Data</Th><Th>Itens</Th><Th>Total</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {vendas.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-[#F2F2F2]">
                  <Td>{formatDateBR(item.data)}</Td><Td>{formatItensVenda(item)}</Td><Td>{currency.format(item.valor_total)}</Td><Td>{item.status}</Td>
                  <Td>{!["PAGO", "CANCELADO"].includes(item.status) ? <SmallButton onClick={() => onPay("venda", item)}>Marcar paga</SmallButton> : "-"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F9FAFB] p-5"><p className="text-xs uppercase tracking-[0.18em] text-[#6A4FBF]">{label}</p><p className="mt-2 text-lg font-semibold text-[#1F2A5A]">{value}</p></div>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <div><label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none" /></div>;
}

function Select({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; placeholder?: string }) {
  return <SearchableSelect label={label} value={value} onChange={onChange} options={options} placeholder={placeholder || "Selecione"} inputClassName="bg-[#F9FAFB]" />;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold text-[#1F2A5A]">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4">{children}</td>;
}

function SmallButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-full bg-[#E61E4D]/10 px-3 py-1 text-xs text-[#E61E4D] transition hover:bg-[#E61E4D]/20">{children}</button>;
}

function formatReferencia(mes?: number | null, ano?: number | null) {
  if (!mes && !ano) return "";
  return `${meses[Number(mes)] || mes}/${ano || ""}`;
}

function formatItensVenda(venda: Venda) {
  if (!Array.isArray(venda.itens) || venda.itens.length === 0) return "-";
  return venda.itens.map((item) => `${item.quantidade}x ${item.produto_nome}`).join(", ");
}

function mapStatusVenda(status: string) {
  if (status === "PAGA") return "PAGO";
  if (status === "CANCELADA") return "CANCELADO";
  return status;
}

async function fetchJson(path: string) {
  const response = await apiFetch(path);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erro ao carregar dados");
  return data;
}
