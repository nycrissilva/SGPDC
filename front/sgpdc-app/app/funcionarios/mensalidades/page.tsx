"use client";

import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PessoaFiltro = {
  id: number;
  nome: string;
};

type Mensalidade = {
  id: number | string;
  prevista?: boolean;
  plano_financeiro_id: number | null;
  tipo_receita: string;
  mes_referencia: number | null;
  ano_referencia: number | null;
  valor_base: number;
  valor_final: number;
  multa: number;
  valor_pago: number;
  saldo: number;
  status: string;
  data_vencimento: string | null;
  responsavel_nome: string | null;
  plano_nome: string | null;
  tipo_grupo: string | null;
  alunas: PessoaFiltro[];
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

export default function MensalidadesPage() {
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [responsaveis, setResponsaveis] = useState<PessoaFiltro[]>([]);
  const [alunos, setAlunos] = useState<PessoaFiltro[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const today = new Date();
  const [generation, setGeneration] = useState({
    mes_referencia: String(today.getMonth() + 1),
    ano_referencia: String(today.getFullYear()),
  });
  const [valorMulta, setValorMulta] = useState("");
  const [editing, setEditing] = useState<Mensalidade | null>(null);
  const [payment, setPayment] = useState<Mensalidade | null>(null);
  const [editForm, setEditForm] = useState({
    mes_referencia: "",
    ano_referencia: "",
    valor_base: "",
    valor_final: "",
    multa: "",
    status: "PENDENTE",
    data_vencimento: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    valor_pago: "",
    data_pagamento: new Date().toISOString().split("T")[0],
    forma_pagamento: "PIX",
  });
  const [filters, setFilters] = useState({
    responsavel_id: "",
    aluno_id: "",
    mes_referencia: "",
    ano_referencia: "",
    status: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFilters((prev) => ({
      ...prev,
      responsavel_id: params.get("responsavel_id") || "",
      aluno_id: params.get("aluno_id") || "",
      status: params.get("status") || "",
    }));
    loadRefs();
    loadConfiguracaoMulta();
  }, []);

  useEffect(() => {
    loadMensalidades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadRefs = async () => {
    try {
      const [responsaveisResponse, alunosResponse] = await Promise.all([
        apiFetch("/api/responsaveis"),
        apiFetch("/api/alunos"),
      ]);
      if (responsaveisResponse.ok) setResponsaveis(await responsaveisResponse.json());
      if (alunosResponse.ok) setAlunos(await alunosResponse.json());
    } catch {
      setResponsaveis([]);
      setAlunos([]);
    }
  };

  const loadMensalidades = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const response = await apiFetch(`/api/mensalidades${params.toString() ? `?${params.toString()}` : ""}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar mensalidades");
      setMensalidades(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar mensalidades");
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguracaoMulta = async () => {
    try {
      const response = await apiFetch("/api/mensalidades/configuracao-multa");
      const data = await response.json();
      if (response.ok) setValorMulta(String(Number(data.valor_multa_mensalidade || 0)));
    } catch {
      setValorMulta("0");
    }
  };

  const resumo = useMemo(() => {
    return mensalidades.reduce(
      (acc, item) => {
        acc.total += Number(item.valor_final || 0) + Number(item.multa || 0);
        acc.pago += Number(item.valor_pago || 0);
        acc.saldo += Number(item.saldo || 0);
        if (item.status === "PENDENTE") acc.pendentes += 1;
        if (item.status === "PAGA") acc.pagas += 1;
        return acc;
      },
      { total: 0, pago: 0, saldo: 0, pendentes: 0, pagas: 0 }
    );
  }, [mensalidades]);

  const handleFilter = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ responsavel_id: "", aluno_id: "", mes_referencia: "", ano_referencia: "", status: "" });
  };

  const runAction = async (message: string, action: () => Promise<string>) => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);
      const resultMessage = await action();
      setSuccess(resultMessage || message);
      await loadMensalidades();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar operacao");
    } finally {
      setProcessing(false);
    }
  };

  const gerarMensalidades = () => runAction("Mensalidades geradas com sucesso.", async () => {
    const response = await apiFetch("/api/mensalidades/gerar", {
      method: "POST",
      body: JSON.stringify({
        mes_referencia: Number(generation.mes_referencia),
        ano_referencia: Number(generation.ano_referencia),
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao gerar mensalidades");
    return `${data.geradas} mensalidade(s) gerada(s). ${data.ignoradas} ignorada(s) por ja existirem.`;
  });

  const salvarMulta = () => runAction("Multa atualizada com sucesso.", async () => {
    const response = await apiFetch("/api/mensalidades/configuracao-multa", {
      method: "PUT",
      body: JSON.stringify({ valor_multa_mensalidade: Number(valorMulta) }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao salvar multa");
    return "Valor da multa atualizado com sucesso.";
  });

  const atualizarAtrasos = () => runAction("Atrasos atualizados com sucesso.", async () => {
    const response = await apiFetch("/api/mensalidades/atualizar-atrasos", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao atualizar atrasos");
    return "Mensalidades pendentes vencidas foram atualizadas.";
  });

  const aplicarMultas = () => runAction("Multas aplicadas com sucesso.", async () => {
    const response = await apiFetch("/api/mensalidades/aplicar-multas", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao aplicar multas");
    return "Multas aplicadas nas mensalidades elegiveis.";
  });

  const openEdit = (item: Mensalidade) => {
    setPayment(null);
    setEditing(item);
    setEditForm({
      mes_referencia: String(item.mes_referencia || ""),
      ano_referencia: String(item.ano_referencia || ""),
      valor_base: String(item.valor_base || 0),
      valor_final: String(item.valor_final || 0),
      multa: String(item.multa || 0),
      status: item.status || "PENDENTE",
      data_vencimento: item.data_vencimento || "",
    });
  };

  const openPayment = (item: Mensalidade) => {
    setEditing(null);
    setPayment(item);
    setPaymentForm({
      valor_pago: String(item.saldo > 0 ? item.saldo : item.valor_final),
      data_pagamento: new Date().toISOString().split("T")[0],
      forma_pagamento: "PIX",
    });
  };

  const gerarContaPrevista = async (item: Mensalidade) => {
    const response = await apiFetch("/api/mensalidades/gerar-grupo", {
      method: "POST",
      body: JSON.stringify({
        grupo_financeiro_id: item.plano_financeiro_id,
        mes_referencia: item.mes_referencia,
        ano_referencia: item.ano_referencia,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao gerar mensalidade");
    await loadMensalidades();
    return data.id;
  };

  const saveEdit = async () => {
    if (!editing) return;
    await runAction("Mensalidade atualizada com sucesso.", async () => {
      let id = editing.id;
      if (editing.prevista) id = await gerarContaPrevista(editing);
      const response = await apiFetch(`/api/mensalidades/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          mes_referencia: Number(editForm.mes_referencia),
          ano_referencia: Number(editForm.ano_referencia),
          valor_base: Number(editForm.valor_base),
          valor_final: Number(editForm.valor_final),
          multa: Number(editForm.multa),
          status: editForm.status,
          data_vencimento: editForm.data_vencimento,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao editar mensalidade");
      setEditing(null);
      return "Mensalidade atualizada com sucesso.";
    });
  };

  const savePayment = async () => {
    if (!payment) return;
    await runAction("Mensalidade marcada como paga.", async () => {
      let id = payment.id;
      if (payment.prevista) id = await gerarContaPrevista(payment);
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
      return "Mensalidade marcada como paga.";
    });
  };

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Financeiro</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Mensalidades</h1>
          </div>
          <Link href="/funcionarios" className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
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

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Geracao</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Gerar mensalidades do mes</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Select label="Mes" value={generation.mes_referencia} onChange={(value) => setGeneration((prev) => ({ ...prev, mes_referencia: value }))} options={meses} placeholder="Mes" />
              <Field label="Ano" value={generation.ano_referencia} onChange={(value) => setGeneration((prev) => ({ ...prev, ano_referencia: value }))} placeholder="2026" />
              <button type="button" disabled={processing} onClick={gerarMensalidades} className="rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">
                Gerar
              </button>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Multa</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Configuracao</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Valor da multa" value={valorMulta} onChange={setValorMulta} placeholder="0.00" />
              <button type="button" disabled={processing} onClick={salvarMulta} className="rounded-full bg-[#1F2A5A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6A4FBF] disabled:opacity-50">
                Salvar
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-3 rounded-[32px] border border-[#E5E7EB] bg-[#F9FAFB] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Rotinas</p>
            <p className="mt-2 text-sm text-[#4B5563]">Atualize atrasos apos o dia 15 e aplique multa somente apos o ultimo dia do mes.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" disabled={processing} onClick={atualizarAtrasos} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20 disabled:opacity-50">
              Atualizar atrasos
            </button>
            <button type="button" disabled={processing} onClick={aplicarMultas} className="rounded-full bg-[#E61E4D]/10 px-5 py-3 text-sm font-semibold text-[#E61E4D] transition hover:bg-[#E61E4D]/20 disabled:opacity-50">
              Aplicar multas
            </button>
          </div>
        </div>

        <div className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Filtros</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Consulta de cobrancas</h2>
            </div>
            <button type="button" onClick={clearFilters} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
              Limpar filtros
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <Select label="Responsavel" value={filters.responsavel_id} onChange={(value) => handleFilter("responsavel_id", value)} options={responsaveis.map((item) => [String(item.id), item.nome])} placeholder="Todos" />
            <Select label="Aluna" value={filters.aluno_id} onChange={(value) => handleFilter("aluno_id", value)} options={alunos.map((item) => [String(item.id), item.nome])} placeholder="Todas" />
            <Select label="Mes" value={filters.mes_referencia} onChange={(value) => handleFilter("mes_referencia", value)} options={meses} placeholder="Todos" />
            <Field label="Ano" value={filters.ano_referencia} onChange={(value) => handleFilter("ano_referencia", value)} placeholder="2026" />
            <Select label="Status" value={filters.status} onChange={(value) => handleFilter("status", value)} options={[["PENDENTE", "Pendente"], ["ATRASADA", "Atrasada"], ["ATRASADA_COM_MULTA", "Atrasada com multa"], ["PAGA", "Paga"], ["CANCELADA", "Cancelada"]]} placeholder="Todos" />
          </div>
        </div>

        <div className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Resultado</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Mensalidades encontradas ({mensalidades.length})</h2>
          </div>

          {loading ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando mensalidades...</p>
          ) : mensalidades.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhuma mensalidade encontrada para os filtros selecionados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Referencia</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Responsavel</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Alunas</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Plano</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Vencimento</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Total</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Pago</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Saldo</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Status</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {mensalidades.map((item) => (
                    <tr key={item.id} className="bg-white hover:bg-[#F2F2F2]">
                      <td className="px-4 py-4">{formatReferencia(item.mes_referencia, item.ano_referencia)}</td>
                      <td className="px-4 py-4 font-medium">{item.responsavel_nome || "-"}</td>
                      <td className="px-4 py-4">{item.alunas.map((aluna) => aluna.nome).join(", ") || "-"}</td>
                      <td className="px-4 py-4">{item.plano_nome || "-"}</td>
                      <td className="px-4 py-4">{formatDate(item.data_vencimento)}</td>
                      <td className="px-4 py-4">{currency.format(item.valor_final)}</td>
                      <td className="px-4 py-4">{currency.format(item.valor_pago)}</td>
                      <td className="px-4 py-4">{currency.format(item.saldo)}</td>
                      <td className="px-4 py-4">{item.status}{item.prevista ? " (prevista)" : ""}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {item.prevista && (
                            <button type="button" onClick={() => runAction("Mensalidade gerada.", async () => { await gerarContaPrevista(item); return "Mensalidade gerada."; })} className="rounded-full bg-[#1F2A5A]/10 px-3 py-1 text-xs text-[#1F2A5A] transition hover:bg-[#1F2A5A]/20">
                              Gerar
                            </button>
                          )}
                          <button type="button" onClick={() => openEdit(item)} className="rounded-full bg-[#6A4FBF]/10 px-3 py-1 text-xs text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
                            Editar
                          </button>
                          {!["PAGA", "CANCELADA"].includes(item.status) && (
                            <button type="button" onClick={() => openPayment(item)} className="rounded-full bg-[#E61E4D]/10 px-3 py-1 text-xs text-[#E61E4D] transition hover:bg-[#E61E4D]/20">
                              Marcar paga
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {(editing || payment) && (
          <div className="mt-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            {editing && (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Edicao</p>
                    <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Editar mensalidade</h2>
                  </div>
                  <button type="button" onClick={() => setEditing(null)} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">Cancelar</button>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <Select label="Mes" value={editForm.mes_referencia} onChange={(value) => setEditForm((prev) => ({ ...prev, mes_referencia: value }))} options={meses} placeholder="Mes" />
                  <Field label="Ano" value={editForm.ano_referencia} onChange={(value) => setEditForm((prev) => ({ ...prev, ano_referencia: value }))} placeholder="2026" />
                  <Field label="Valor base" value={editForm.valor_base} onChange={(value) => setEditForm((prev) => ({ ...prev, valor_base: value }))} placeholder="0.00" />
                  <Field label="Multa" value={editForm.multa} onChange={(value) => setEditForm((prev) => ({ ...prev, multa: value }))} placeholder="0.00" />
                  <Field label="Valor final" value={editForm.valor_final} onChange={(value) => setEditForm((prev) => ({ ...prev, valor_final: value }))} placeholder="0.00" />
                  <Field label="Vencimento" value={editForm.data_vencimento} onChange={(value) => setEditForm((prev) => ({ ...prev, data_vencimento: value }))} placeholder="YYYY-MM-DD" />
                  <Select label="Status" value={editForm.status} onChange={(value) => setEditForm((prev) => ({ ...prev, status: value }))} options={[["PENDENTE", "Pendente"], ["ATRASADA", "Atrasada"], ["ATRASADA_COM_MULTA", "Atrasada com multa"], ["PAGA", "Paga"], ["CANCELADA", "Cancelada"]]} placeholder="Status" />
                </div>
                <button type="button" disabled={processing} onClick={saveEdit} className="rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">Salvar alteracoes</button>
              </div>
            )}

            {payment && (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Pagamento</p>
                    <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Marcar mensalidade como paga</h2>
                  </div>
                  <button type="button" onClick={() => setPayment(null)} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">Cancelar</button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Valor pago" value={paymentForm.valor_pago} onChange={(value) => setPaymentForm((prev) => ({ ...prev, valor_pago: value }))} placeholder="0.00" />
                  <Field label="Data do pagamento" value={paymentForm.data_pagamento} onChange={(value) => setPaymentForm((prev) => ({ ...prev, data_pagamento: value }))} placeholder="YYYY-MM-DD" />
                  <Select label="Forma de pagamento" value={paymentForm.forma_pagamento} onChange={(value) => setPaymentForm((prev) => ({ ...prev, forma_pagamento: value }))} options={[["PIX", "Pix"], ["CARTAO", "Cartao"], ["DINHEIRO", "Dinheiro"], ["TRANSFERENCIA", "Transferencia"]]} placeholder="Forma" />
                </div>
                <button type="button" disabled={processing} onClick={savePayment} className="rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">Confirmar pagamento</button>
              </div>
            )}
          </div>
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

function Select({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; placeholder: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20">
        <option value="">{placeholder}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} inputMode="numeric" className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20" placeholder={placeholder} />
    </div>
  );
}

function formatReferencia(mes: number | null, ano: number | null) {
  if (!mes && !ano) return "-";
  const nomeMes = meses.find(([value]) => Number(value) === Number(mes))?.[1] || String(mes || "");
  return `${nomeMes}/${ano || ""}`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}
