"use client";

import { apiFetch } from "@/lib/api";
import { formatDateBR } from "@/lib/format";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Turma = { id: number; nome: string };

type Mensalidade = {
  id: number | string;
  prevista?: boolean;
  plano_financeiro_id?: number | null;
  mes_referencia: number | null;
  ano_referencia: number | null;
  valor_final: number;
  valor_pago: number;
  saldo: number;
  status: string;
  data_vencimento: string | null;
  responsavel_nome: string | null;
  plano_nome: string | null;
  alunas?: { id: number; nome: string }[];
};

type AlunaTurma = {
  id: number;
  nome: string;
  responsavel_nome: string | null;
  mensalidades?: {
    pagas?: Mensalidade[];
    em_aberto?: Mensalidade[];
    atrasadas?: Mensalidade[];
  };
};

type LinhaMensalidade = {
  aluna: AlunaTurma;
  mensalidade: Mensalidade | null;
  status: "PAGA" | "ATRASADA" | "PENDENTE" | "SEM_MENSALIDADE";
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

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

export default function TurmasMensalidadePage() {
  const today = new Date();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunas, setAlunas] = useState<AlunaTurma[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [mes, setMes] = useState(String(today.getMonth() + 1));
  const [ano, setAno] = useState(String(today.getFullYear()));
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [loadingAlunas, setLoadingAlunas] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [payment, setPayment] = useState<LinhaMensalidade | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    valor_pago: "",
    data_pagamento: new Date().toISOString().split("T")[0],
    forma_pagamento: "PIX",
  });

  useEffect(() => {
    loadTurmas();
  }, []);

  useEffect(() => {
    if (turmaId) {
      loadAlunas(turmaId);
    } else {
      setAlunas([]);
    }
  }, [turmaId]);

  const loadTurmas = async () => {
    setLoadingTurmas(true);
    setError(null);
    try {
      const response = await apiFetch("/api/turmas?sort=nome");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar turmas");
      const lista = Array.isArray(data) ? data : [];
      setTurmas(lista);
      setTurmaId((current) => current || String(lista[0]?.id || ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar turmas");
      setTurmas([]);
    } finally {
      setLoadingTurmas(false);
    }
  };

  const loadAlunas = async (selectedTurmaId: string) => {
    setLoadingAlunas(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/turmas/${selectedTurmaId}/alunos`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar alunos da turma");
      setAlunas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar alunos da turma");
      setAlunas([]);
    } finally {
      setLoadingAlunas(false);
    }
  };

  const openPayment = (linha: LinhaMensalidade) => {
    if (!linha.mensalidade) return;
    setPayment(linha);
    setSuccess(null);
    setError(null);
    setPaymentForm({
      valor_pago: String(Number(linha.mensalidade.saldo || linha.mensalidade.valor_final || 0)),
      data_pagamento: new Date().toISOString().split("T")[0],
      forma_pagamento: "PIX",
    });
  };

  const gerarContaPrevista = async (mensalidade: Mensalidade) => {
    const response = await apiFetch("/api/mensalidades/gerar-grupo", {
      method: "POST",
      body: JSON.stringify({
        grupo_financeiro_id: mensalidade.plano_financeiro_id,
        mes_referencia: mensalidade.mes_referencia,
        ano_referencia: mensalidade.ano_referencia,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao gerar mensalidade");
    return data.id;
  };

  const savePayment = async () => {
    if (!payment?.mensalidade || !turmaId) return;

    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      let id = payment.mensalidade.id;
      if (payment.mensalidade.prevista) {
        id = await gerarContaPrevista(payment.mensalidade);
      }

      const response = await apiFetch(`/api/mensalidades/${id}/pagar`, {
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
      setSuccess(`Mensalidade de ${payment.aluna.nome} marcada como paga.`);
      await loadAlunas(turmaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar pagamento");
    } finally {
      setProcessing(false);
    }
  };

  const linhas = useMemo<LinhaMensalidade[]>(
    () => alunas.map((aluna) => {
      const mensalidade = findMensalidadeDoMes(aluna, Number(mes), Number(ano));
      return { aluna, mensalidade, status: mensalidade ? normalizeStatus(mensalidade.status) : "SEM_MENSALIDADE" };
    }),
    [alunas, mes, ano]
  );

  const resumo = useMemo(() => linhas.reduce(
    (acc, linha) => {
      acc.total += 1;
      if (linha.status === "PAGA") acc.pagas += 1;
      if (linha.status === "ATRASADA") acc.atrasadas += 1;
      if (linha.status === "PENDENTE") acc.pendentes += 1;
      if (linha.status === "SEM_MENSALIDADE") acc.semMensalidade += 1;
      return acc;
    },
    { total: 0, pagas: 0, atrasadas: 0, pendentes: 0, semMensalidade: 0 }
  ), [linhas]);

  const turmaSelecionada = turmas.find((turma) => String(turma.id) === turmaId);

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Mensalidades</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Turmas Mensalidade</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#4B5563]">Consulte os alunos da turma escolhida e o status da mensalidade no mês selecionado.</p>
          </div>
          <Link href="/funcionarios" className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
            Voltar
          </Link>
        </div>

        {success && <div className="mb-6 rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">{success}</div>}
        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

        <section className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
            <Select label="Turma" value={turmaId} onChange={setTurmaId} disabled={loadingTurmas} options={turmas.map((turma) => [String(turma.id), turma.nome])} placeholder="Selecione uma turma" />
            <Select label="Mês" value={mes} onChange={setMes} options={meses} placeholder="Mês" />
            <Field label="Ano" value={ano} onChange={setAno} placeholder="2026" />
            <button type="button" disabled={!turmaId || loadingAlunas} onClick={() => turmaId && loadAlunas(turmaId)} className="rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">
              Atualizar
            </button>
          </div>
        </section>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Alunos" value={String(resumo.total)} />
          <SummaryCard label="Pagas" value={String(resumo.pagas)} />
          <SummaryCard label="Atrasadas" value={String(resumo.atrasadas)} />
          <SummaryCard label="Pendentes" value={String(resumo.pendentes)} />
          {resumo.semMensalidade > 0 && <SummaryCard label="Sem mensalidade" value={String(resumo.semMensalidade)} />}
        </div>

        <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Resultado</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">{turmaSelecionada ? turmaSelecionada.nome : "Turma"} - {formatReferencia(Number(mes), Number(ano))}</h2>
          </div>

          {loadingAlunas ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando alunos e mensalidades...</p>
          ) : !turmaId ? (
            <p className="text-sm text-[#2B2B2B]/70">Selecione uma turma para consultar as mensalidades.</p>
          ) : linhas.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhum aluno encontrado nesta turma.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Aluno</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Responsável</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Mês</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Plano</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Vencimento</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Valor</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Pago</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Saldo</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Status</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {linhas.map((linha) => (
                    <tr key={linha.aluna.id} className="bg-white hover:bg-[#F2F2F2]">
                      <td className="px-4 py-4 font-semibold text-[#1F2A5A]">{linha.aluna.nome}</td>
                      <td className="px-4 py-4">{linha.aluna.responsavel_nome || linha.mensalidade?.responsavel_nome || "-"}</td>
                      <td className="px-4 py-4">{formatReferencia(Number(mes), Number(ano))}</td>
                      <td className="px-4 py-4">{linha.mensalidade?.plano_nome || "-"}</td>
                      <td className="px-4 py-4">{formatDate(linha.mensalidade?.data_vencimento || null)}</td>
                      <td className="px-4 py-4">{linha.mensalidade ? currency.format(Number(linha.mensalidade.valor_final || 0)) : "-"}</td>
                      <td className="px-4 py-4">{linha.mensalidade ? currency.format(Number(linha.mensalidade.valor_pago || 0)) : "-"}</td>
                      <td className="px-4 py-4">{linha.mensalidade ? currency.format(Number(linha.mensalidade.saldo || 0)) : "-"}</td>
                      <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(linha.status)}`}>{statusLabel(linha.status)}</span></td>
                      <td className="px-4 py-4">
                        {linha.mensalidade && !["PAGA", "CANCELADA"].includes(String(linha.mensalidade.status || "").toUpperCase()) ? (
                          <button type="button" onClick={() => openPayment(linha)} className="rounded-full bg-[#E61E4D]/10 px-3 py-1 text-xs font-semibold text-[#E61E4D] transition hover:bg-[#E61E4D]/20">
                            Marcar paga
                          </button>
                        ) : (
                          <span className="text-xs text-[#4B5563]">-</span>
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
          <section className="mt-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Pagamento</p>
                <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Marcar mensalidade como paga</h2>
                <p className="mt-2 text-sm text-[#4B5563]">{payment.aluna.nome} - {formatReferencia(Number(mes), Number(ano))}</p>
              </div>
              <button type="button" onClick={() => setPayment(null)} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
                Cancelar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Valor pago" value={paymentForm.valor_pago} onChange={(value) => setPaymentForm((prev) => ({ ...prev, valor_pago: value }))} placeholder="0.00" />
              <DateField label="Data do pagamento" value={paymentForm.data_pagamento} onChange={(value) => setPaymentForm((prev) => ({ ...prev, data_pagamento: value }))} />
              <Select label="Forma de pagamento" value={paymentForm.forma_pagamento} onChange={(value) => setPaymentForm((prev) => ({ ...prev, forma_pagamento: value }))} options={[["PIX", "Pix"], ["CARTAO", "Cartão"], ["DINHEIRO", "Dinheiro"], ["TRANSFERENCIA", "Transferência"]]} placeholder="Forma" />
            </div>

            <button type="button" disabled={processing} onClick={savePayment} className="mt-5 rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">
              Confirmar pagamento
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

function findMensalidadeDoMes(aluna: AlunaTurma, mes: number, ano: number) {
  const contas = [
    ...(aluna.mensalidades?.pagas || []),
    ...(aluna.mensalidades?.atrasadas || []),
    ...(aluna.mensalidades?.em_aberto || []),
  ];

  return contas.find((conta) => {
    const mesmaReferencia = Number(conta.mes_referencia) === mes && Number(conta.ano_referencia) === ano;
    const pertenceAluna = !Array.isArray(conta.alunas) || conta.alunas.length === 0 || conta.alunas.some((item) => Number(item.id) === Number(aluna.id));
    return mesmaReferencia && pertenceAluna;
  }) || null;
}

function normalizeStatus(status?: string): LinhaMensalidade["status"] {
  const value = String(status || "PENDENTE").toUpperCase();
  if (value === "PAGA") return "PAGA";
  if (value === "ATRASADA" || value === "ATRASADA_COM_MULTA") return "ATRASADA";
  return "PENDENTE";
}

function statusLabel(status: LinhaMensalidade["status"]) {
  if (status === "PAGA") return "Paga";
  if (status === "ATRASADA") return "Atrasada";
  if (status === "SEM_MENSALIDADE") return "Sem mensalidade";
  return "Pendente";
}

function statusClassName(status: LinhaMensalidade["status"]) {
  if (status === "PAGA") return "bg-[#6A4FBF]/10 text-[#6A4FBF]";
  if (status === "ATRASADA") return "bg-[#E61E4D]/10 text-[#E61E4D]";
  if (status === "SEM_MENSALIDADE") return "bg-[#F3F4F6] text-[#4B5563]";
  return "bg-[#F59E0B]/10 text-[#92400E]";
}

function formatReferencia(mes: number, ano: number) {
  const nomeMes = meses.find(([value]) => Number(value) === Number(mes))?.[1] || String(mes || "");
  return `${nomeMes}/${ano || ""}`;
}

function formatDate(value: string | null) {
  return formatDateBR(value);
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F9FAFB] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-[#6A4FBF]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#1F2A5A]">{value}</p>
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder, disabled = false }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; placeholder: string; disabled?: boolean }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20 disabled:opacity-60">
        <option value="">{placeholder}</option>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <input type="text" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20" placeholder={placeholder} />
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20" />
    </div>
  );
}
