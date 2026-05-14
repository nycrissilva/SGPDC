"use client";

import { apiFetch } from "@/lib/api";
import { formatDateBR } from "@/lib/format";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Espetaculo = {
  id: number;
  nome: string;
  data: string | null;
  descricao: string | null;
  status: string;
  total_coreografias: number;
};

type CoreografiaResumo = {
  id: number;
  espetaculo_coreografia_id: number | null;
  espetaculo_id: number;
  espetaculo_nome: string;
  espetaculo_ids?: number[];
  espetaculos?: { id: number; nome: string; espetaculo_coreografia_id: number }[];
  nome: string;
  tipo: string | null;
  descricao: string | null;
  status: string;
  valor_fantasia_geral: number | null;
  total_papeis: number;
  total_participantes: number;
};

type Papel = {
  id: number;
  nome: string;
  valor_fantasia: number;
  status: string;
};

type Participante = {
  id: number;
  aluno_id: number;
  aluno_nome: string;
  papel_id: number;
  papel_nome: string;
  valor_papel: number;
  valor_fantasia: number | null;
  valor_cobranca: number;
};

type CoreografiaDetalhe = CoreografiaResumo & {
  papeis: Papel[];
  participantes: Participante[];
};

type Aluno = {
  id: number;
  nome: string;
};

type Turma = {
  id: number;
  nome: string;
  modalidade?: string;
  nivel?: string;
};

type AlunoTurma = Aluno & {
  matricula_id: number;
  turma_id: number;
  turma_nome: string;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const emptyEspetaculo = { nome: "", data: "", descricao: "", status: "ATIVO" };
const emptyCoreografia = { espetaculo_id: "", espetaculo_ids: [] as string[], nome: "", tipo: "", descricao: "", valor_fantasia_geral: "", status: "ATIVO" };
const emptyPapel = { id: "", nome: "", valor_fantasia: "", status: "ATIVO" };
const emptyParticipante = { id: "", aluno_id: "", papel_id: "", valor_fantasia: "" };
const emptyLote = { turma_id: "", papel_id: "", valor_fantasia: "" };

export default function EspetaculosPage() {
  const [espetaculos, setEspetaculos] = useState<Espetaculo[]>([]);
  const [coreografias, setCoreografias] = useState<CoreografiaResumo[]>([]);
  const [coreografia, setCoreografia] = useState<CoreografiaDetalhe | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunosTurma, setAlunosTurma] = useState<AlunoTurma[]>([]);
  const [selectedAlunoIds, setSelectedAlunoIds] = useState<number[]>([]);
  const [loteForm, setLoteForm] = useState(emptyLote);
  const [ajustesAluna, setAjustesAluna] = useState<Record<number, { papel_id: string; valor_fantasia: string }>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingEspetaculoId, setEditingEspetaculoId] = useState<number | null>(null);
  const [editingCoreografiaId, setEditingCoreografiaId] = useState<number | null>(null);
  const [espetaculoForm, setEspetaculoForm] = useState(emptyEspetaculo);
  const [coreografiaForm, setCoreografiaForm] = useState(emptyCoreografia);
  const [papelForm, setPapelForm] = useState(emptyPapel);
  const [participanteForm, setParticipanteForm] = useState(emptyParticipante);
  const [billingDueDate, setBillingDueDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadInitial();
  }, []);

  const resumo = useMemo(() => {
    const ativos = espetaculos.filter((item) => item.status === "ATIVO").length;
    const coreografiasAtivas = coreografias.filter((item) => item.status === "ATIVO").length;
    const participantes = coreografias.reduce((total, item) => total + Number(item.total_participantes || 0), 0);
    return { ativos, coreografiasAtivas, participantes };
  }, [espetaculos, coreografias]);

  const loadInitial = async () => {
    try {
      setLoading(true);
      setError(null);
      const [espetaculosResponse, coreografiasResponse, alunosResponse, turmasResponse] = await Promise.all([
        apiFetch("/api/espetaculos?incluir_inativos=true"),
        apiFetch("/api/coreografias?incluir_inativas=true"),
        apiFetch("/api/alunos"),
        apiFetch("/api/turmas?sort=nome"),
      ]);
      const espetaculosData = await espetaculosResponse.json();
      const coreografiasData = await coreografiasResponse.json();
      const alunosData = await alunosResponse.json();
      const turmasData = await turmasResponse.json();
      if (!espetaculosResponse.ok) throw new Error(espetaculosData.error || "Erro ao carregar espetaculos");
      if (!coreografiasResponse.ok) throw new Error(coreografiasData.error || "Erro ao carregar coreografias");
      setEspetaculos(Array.isArray(espetaculosData) ? espetaculosData : []);
      setCoreografias(Array.isArray(coreografiasData) ? coreografiasData : []);
      setAlunos(Array.isArray(alunosData) ? alunosData : []);
      setTurmas(Array.isArray(turmasData) ? turmasData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const loadCoreografia = async (id: number, contexto?: { espetaculo_id?: number; espetaculo_coreografia_id?: number | null }) => {
    const params = new URLSearchParams();
    if (contexto?.espetaculo_coreografia_id) params.set("espetaculo_coreografia_id", String(contexto.espetaculo_coreografia_id));
    if (contexto?.espetaculo_id) params.set("espetaculo_id", String(contexto.espetaculo_id));
    const response = await apiFetch(`/api/coreografias/${id}${params.toString() ? `?${params.toString()}` : ""}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao carregar coreografia");
    setCoreografia(data);
  };

  const loadAlunosTurma = async (turmaId: string, detalhe = coreografia) => {
    setLoteForm((prev) => ({
      ...prev,
      turma_id: turmaId,
      papel_id: detalhe?.papeis.filter((item) => item.status === "ATIVO").length === 1
        ? String(detalhe.papeis.find((item) => item.status === "ATIVO")?.id || "")
        : prev.papel_id,
    }));

    if (!turmaId) {
      setAlunosTurma([]);
      setSelectedAlunoIds([]);
      setAjustesAluna({});
      return;
    }

    const response = await apiFetch(`/api/turmas/${turmaId}/alunos`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao carregar alunas da turma");
    const lista = Array.isArray(data) ? data : [];
    setAlunosTurma(lista);
    setSelectedAlunoIds(lista.map((item: AlunoTurma) => item.id));
    setAjustesAluna({});
  };

  const pesquisarAlunasTurma = async () => {
    try {
      setError(null);
      await loadAlunosTurma(loteForm.turma_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar alunas da turma");
    }
  };

  const refresh = async () => {
    await loadInitial();
    if (coreografia) await loadCoreografia(coreografia.id, {
      espetaculo_id: coreografia.espetaculo_id,
      espetaculo_coreografia_id: coreografia.espetaculo_coreografia_id,
    });
  };

  const runAction = async (message: string, action: () => Promise<string | void>) => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);
      const result = await action();
      setSuccess(result || message);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar operacao");
    } finally {
      setProcessing(false);
    }
  };

  const saveEspetaculo = () => runAction("Espetaculo salvo com sucesso.", async () => {
    const response = await apiFetch(editingEspetaculoId ? `/api/espetaculos/${editingEspetaculoId}` : "/api/espetaculos", {
      method: editingEspetaculoId ? "PUT" : "POST",
      body: JSON.stringify(espetaculoForm),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao salvar espetaculo");
    setEditingEspetaculoId(null);
    setEspetaculoForm(emptyEspetaculo);
  });

  const editEspetaculo = (item: Espetaculo) => {
    setEditingEspetaculoId(item.id);
    setEspetaculoForm({
      nome: item.nome,
      data: item.data || "",
      descricao: item.descricao || "",
      status: item.status || "ATIVO",
    });
  };

  const inactivateEspetaculo = (item: Espetaculo) => runAction("Espetaculo inativado com sucesso.", async () => {
    let response = await apiFetch(`/api/espetaculos/${item.id}`, { method: "DELETE", body: JSON.stringify({ confirmar_cobrancas_pendentes: false }) });
    let data = await response.json();
    if (response.status === 409 && data.requer_confirmacao) {
      const confirmed = window.confirm("Existem cobrancas de fantasia pendentes. Deseja inativar mesmo assim?");
      if (!confirmed) throw new Error("Inativacao cancelada");
      response = await apiFetch(`/api/espetaculos/${item.id}`, { method: "DELETE", body: JSON.stringify({ confirmar_cobrancas_pendentes: true }) });
      data = await response.json();
    }
    if (!response.ok) throw new Error(data.error || "Erro ao inativar espetaculo");
  });

  const saveCoreografia = () => runAction("Coreografia salva com sucesso.", async () => {
    const payload = {
      ...coreografiaForm,
      espetaculo_id: Number(coreografiaForm.espetaculo_ids[0] || coreografiaForm.espetaculo_id),
      espetaculo_ids: coreografiaForm.espetaculo_ids.map(Number),
      valor_fantasia_geral: coreografiaForm.valor_fantasia_geral === "" ? null : Number(coreografiaForm.valor_fantasia_geral),
    };
    const response = await apiFetch(editingCoreografiaId ? `/api/coreografias/${editingCoreografiaId}` : "/api/coreografias", {
      method: editingCoreografiaId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao salvar coreografia");
      setEditingCoreografiaId(null);
      setCoreografiaForm(emptyCoreografia);
  });

  const editCoreografia = async (item: CoreografiaResumo) => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (item.espetaculo_coreografia_id) params.set("espetaculo_coreografia_id", String(item.espetaculo_coreografia_id));
      const response = await apiFetch(`/api/coreografias/${item.id}${params.toString() ? `?${params.toString()}` : ""}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar coreografia");
      const ids = data.espetaculo_ids?.length ? data.espetaculo_ids : [item.espetaculo_id];
      setEditingCoreografiaId(item.id);
      setCoreografiaForm({
        espetaculo_id: String(ids[0] || ""),
        espetaculo_ids: ids.map(String),
        nome: data.nome,
        tipo: data.tipo || "",
        descricao: data.descricao || "",
        valor_fantasia_geral: data.valor_fantasia_geral === null ? "" : String(data.valor_fantasia_geral),
        status: data.status || "ATIVO",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar coreografia");
    }
  };

  const selectCoreografia = async (item: CoreografiaResumo) => {
    try {
      setError(null);
      await loadCoreografia(item.id, {
        espetaculo_id: item.espetaculo_id,
        espetaculo_coreografia_id: item.espetaculo_coreografia_id,
      });
      setPapelForm(emptyPapel);
      setParticipanteForm(emptyParticipante);
      setLoteForm(emptyLote);
      setAlunosTurma([]);
      setSelectedAlunoIds([]);
      setAjustesAluna({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao selecionar coreografia");
    }
  };

  const inactivateCoreografia = (item: CoreografiaResumo) => runAction("Coreografia inativada com sucesso.", async () => {
    const response = await apiFetch(`/api/coreografias/${item.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao inativar coreografia");
    if (coreografia?.id === item.id) setCoreografia(null);
  });

  const savePapel = () => {
    if (!coreografia) return;
    return runAction("Papel salvo com sucesso.", async () => {
      const response = await apiFetch(`/api/coreografias/${coreografia.id}/papeis`, {
        method: "POST",
        body: JSON.stringify({
          id: papelForm.id ? Number(papelForm.id) : undefined,
          nome: papelForm.nome,
          valor_fantasia: Number(papelForm.valor_fantasia),
          status: papelForm.status,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar papel");
      setPapelForm(emptyPapel);
    });
  };

  const editPapel = (papel: Papel) => {
    setPapelForm({ id: String(papel.id), nome: papel.nome, valor_fantasia: String(papel.valor_fantasia), status: papel.status });
  };

  const inactivatePapel = (papel: Papel) => {
    if (!coreografia) return;
    return runAction("Papel inativado com sucesso.", async () => {
      const response = await apiFetch(`/api/coreografias/${coreografia.id}/papeis/${papel.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao inativar papel");
    });
  };

  const saveParticipante = () => {
    if (!coreografia) return;
    return runAction("Participante salvo com sucesso.", async () => {
      const response = await apiFetch(`/api/coreografias/${coreografia.id}/participantes`, {
        method: "POST",
        body: JSON.stringify({
          id: participanteForm.id ? Number(participanteForm.id) : undefined,
          aluno_id: Number(participanteForm.aluno_id),
          papel_id: Number(participanteForm.papel_id),
          valor_fantasia: participanteForm.valor_fantasia === "" ? null : Number(participanteForm.valor_fantasia),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar participante");
      setParticipanteForm(emptyParticipante);
    });
  };

  const saveParticipantesLote = () => {
    if (!coreografia) return;
    return runAction("Participantes salvas com sucesso.", async () => {
      if (selectedAlunoIds.length === 0) throw new Error("Selecione ao menos uma aluna");

      let salvas = 0;
      for (const alunoId of selectedAlunoIds) {
        const ajuste = ajustesAluna[alunoId];
        const papelId = Number(ajuste?.papel_id || loteForm.papel_id);
        if (!papelId) throw new Error("Selecione um papel para todas as alunas marcadas");

        const valorIndividual = ajuste?.valor_fantasia ?? loteForm.valor_fantasia;
        const response = await apiFetch(`/api/coreografias/${coreografia.id}/participantes`, {
          method: "POST",
          body: JSON.stringify({
            aluno_id: alunoId,
            papel_id: papelId,
            valor_fantasia: valorIndividual === "" ? null : Number(valorIndividual),
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erro ao salvar participante");
        salvas += 1;
      }

      setParticipanteForm(emptyParticipante);
      return `${salvas} participante(s) salva(s).`;
    });
  };

  const editParticipante = (item: Participante) => {
    setParticipanteForm({
      id: String(item.id),
      aluno_id: String(item.aluno_id),
      papel_id: String(item.papel_id),
      valor_fantasia: item.valor_fantasia === null ? "" : String(item.valor_fantasia),
    });
  };

  const toggleAluno = (alunoId: number) => {
    setSelectedAlunoIds((prev) => (
      prev.includes(alunoId) ? prev.filter((id) => id !== alunoId) : [...prev, alunoId]
    ));
  };

  const toggleTodosAlunos = () => {
    setSelectedAlunoIds((prev) => (
      prev.length === alunosTurma.length ? [] : alunosTurma.map((item) => item.id)
    ));
  };

  const updateAjusteAluna = (alunoId: number, field: "papel_id" | "valor_fantasia", value: string) => {
    setAjustesAluna((prev) => ({
      ...prev,
      [alunoId]: {
        papel_id: prev[alunoId]?.papel_id || "",
        valor_fantasia: prev[alunoId]?.valor_fantasia || "",
        [field]: value,
      },
    }));
  };

  const removeParticipante = (item: Participante) => {
    if (!coreografia) return;
    return runAction("Participante removido da coreografia.", async () => {
      const response = await apiFetch(`/api/coreografias/${coreografia.id}/participantes/${item.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao remover participante");
    });
  };

  const gerarCobrancas = () => {
    if (!coreografia) return;
    return runAction("Cobrancas geradas com sucesso.", async () => {
      const response = await apiFetch(`/api/coreografias/${coreografia.id}/gerar-cobrancas-fantasia`, {
        method: "POST",
        body: JSON.stringify({
          data_vencimento: billingDueDate,
          espetaculo_id: coreografia.espetaculo_id,
          espetaculo_coreografia_id: coreografia.espetaculo_coreografia_id,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao gerar cobrancas");
      return `${data.geradas} cobranca(s) gerada(s). ${data.ignoradas} ignorada(s).`;
    });
  };

  const toggleEspetaculoCoreografia = (espetaculoId: number) => {
    setCoreografiaForm((prev) => {
      const value = String(espetaculoId);
      const selected = prev.espetaculo_ids.includes(value)
        ? prev.espetaculo_ids.filter((id) => id !== value)
        : [...prev.espetaculo_ids, value];
      return { ...prev, espetaculo_ids: selected, espetaculo_id: selected[0] || "" };
    });
  };

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Eventos artisticos</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Espetaculos e Coreografias</h1>
          </div>
          <Link href="/funcionarios/mensalidades" className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
            Ver cobrancas
          </Link>
        </div>

        {success && <div className="mb-6 rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">{success}</div>}
        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <SummaryCard label="Espetaculos ativos" value={String(resumo.ativos)} />
          <SummaryCard label="Coreografias ativas" value={String(resumo.coreografiasAtivas)} />
          <SummaryCard label="Participantes vinculados" value={String(resumo.participantes)} />
        </div>

        <section className="mb-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <FormHeader overline="Espetaculo" title={editingEspetaculoId ? "Editar espetaculo" : "Novo espetaculo"} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome" value={espetaculoForm.nome} onChange={(value) => setEspetaculoForm((prev) => ({ ...prev, nome: value }))} placeholder="Festival de fim de ano" />
              <Field label="Data" type="date" value={espetaculoForm.data} onChange={(value) => setEspetaculoForm((prev) => ({ ...prev, data: value }))} placeholder="dd/mm/aaaa" />
              <Field label="Descricao" value={espetaculoForm.descricao} onChange={(value) => setEspetaculoForm((prev) => ({ ...prev, descricao: value }))} placeholder="Observacoes do evento" />
              {editingEspetaculoId ? (
                <Select label="Status" value={espetaculoForm.status} onChange={(value) => setEspetaculoForm((prev) => ({ ...prev, status: value }))} options={[["ATIVO", "Ativo"], ["INATIVO", "Inativo"]]} placeholder="Status" />
              ) : <ReadOnly label="Status" value="ATIVO" />}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <PrimaryButton disabled={processing} onClick={saveEspetaculo}>Salvar espetaculo</PrimaryButton>
              {editingEspetaculoId && <SecondaryButton onClick={() => { setEditingEspetaculoId(null); setEspetaculoForm(emptyEspetaculo); }}>Cancelar</SecondaryButton>}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <FormHeader overline="Coreografia" title={editingCoreografiaId ? "Editar coreografia" : "Nova coreografia"} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="mb-2 block text-sm font-medium text-[#1F2A5A]">Espetaculos</p>
                <div className="grid gap-2 rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 sm:grid-cols-2">
                  {espetaculos.length === 0 ? (
                    <p className="text-sm text-[#4B5563]">Cadastre um espetaculo antes de vincular coreografias.</p>
                  ) : espetaculos.map((item) => (
                    <label key={item.id} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm font-medium text-[#1F2A5A]">
                      <input
                        type="checkbox"
                        checked={coreografiaForm.espetaculo_ids.includes(String(item.id))}
                        onChange={() => toggleEspetaculoCoreografia(item.id)}
                        className="h-4 w-4 accent-[#E61E4D]"
                      />
                      {item.nome}
                    </label>
                  ))}
                </div>
              </div>
              <Field label="Nome" value={coreografiaForm.nome} onChange={(value) => setCoreografiaForm((prev) => ({ ...prev, nome: value }))} placeholder="Circo" />
              <Field label="Tipo" value={coreografiaForm.tipo} onChange={(value) => setCoreografiaForm((prev) => ({ ...prev, tipo: value }))} placeholder="Grupo, solo, duo" />
              <Field label="Valor geral opcional" value={coreografiaForm.valor_fantasia_geral} onChange={(value) => setCoreografiaForm((prev) => ({ ...prev, valor_fantasia_geral: value }))} placeholder="0.00" />
              <Field label="Descricao" value={coreografiaForm.descricao} onChange={(value) => setCoreografiaForm((prev) => ({ ...prev, descricao: value }))} placeholder="Turma inteira, parte da turma..." />
              {editingCoreografiaId ? (
                <Select label="Status" value={coreografiaForm.status} onChange={(value) => setCoreografiaForm((prev) => ({ ...prev, status: value }))} options={[["ATIVO", "Ativo"], ["INATIVO", "Inativo"]]} placeholder="Status" />
              ) : <ReadOnly label="Status" value="ATIVO" />}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <PrimaryButton disabled={processing} onClick={saveCoreografia}>Salvar coreografia</PrimaryButton>
              {editingCoreografiaId && <SecondaryButton onClick={() => { setEditingCoreografiaId(null); setCoreografiaForm(emptyCoreografia); }}>Cancelar</SecondaryButton>}
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <FormHeader overline="Consulta" title={`Coreografias cadastradas (${coreografias.length})`} />
          {loading ? <p className="text-sm text-[#4B5563]">Carregando...</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <Th>Coreografia</Th>
                    <Th>Espetaculo</Th>
                    <Th>Papeis</Th>
                    <Th>Participantes</Th>
                    <Th>Status</Th>
                    <Th>Acoes</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {coreografias.map((item) => (
                    <tr key={item.id} className="bg-white hover:bg-[#F9FAFB]">
                      <Td><strong>{item.nome}</strong><br /><span className="text-xs text-[#4B5563]">{item.tipo || "-"}</span></Td>
                      <Td>{item.espetaculo_nome}</Td>
                      <Td>{item.total_papeis}</Td>
                      <Td>{item.total_participantes}</Td>
                      <Td>{item.status}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-2">
                          <SmallButton onClick={() => selectCoreografia(item)}>Abrir</SmallButton>
                          <SmallButton onClick={() => editCoreografia(item)}>Editar</SmallButton>
                          {item.status === "ATIVO" && <DangerSmallButton onClick={() => inactivateCoreografia(item)}>Inativar</DangerSmallButton>}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mb-8 rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <FormHeader overline="Espetaculos" title={`Eventos cadastrados (${espetaculos.length})`} />
          <div className="grid gap-3 md:grid-cols-2">
            {espetaculos.map((item) => (
              <div key={item.id} className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-[#1F2A5A]">{item.nome}</p>
                    <p className="mt-1 text-sm text-[#4B5563]">{formatDate(item.data)} - {item.status} - {item.total_coreografias} coreografia(s)</p>
                    <p className="mt-1 text-sm text-[#4B5563]">{item.descricao || "-"}</p>
                  </div>
                  <div className="flex gap-2">
                    <SmallButton onClick={() => editEspetaculo(item)}>Editar</SmallButton>
                    {item.status === "ATIVO" && <DangerSmallButton onClick={() => inactivateEspetaculo(item)}>Inativar</DangerSmallButton>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {coreografia && (
          <section className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Detalhes</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1F2A5A]">{coreografia.nome}</h2>
                <p className="mt-1 text-sm text-[#4B5563]">{coreografia.espetaculo_nome} - {coreografia.descricao || "Sem descricao"}</p>
              </div>
              <SecondaryButton onClick={() => setCoreografia(null)}>Fechar</SecondaryButton>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-5">
                <FormHeader overline="Papeis" title="Valores por fantasia" />
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Papel" value={papelForm.nome} onChange={(value) => setPapelForm((prev) => ({ ...prev, nome: value }))} placeholder="Palhaco" />
                  <Field label="Valor" value={papelForm.valor_fantasia} onChange={(value) => setPapelForm((prev) => ({ ...prev, valor_fantasia: value }))} placeholder="500.00" />
                  <Select label="Status" value={papelForm.status} onChange={(value) => setPapelForm((prev) => ({ ...prev, status: value }))} options={[["ATIVO", "Ativo"], ["INATIVO", "Inativo"]]} placeholder="Status" />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <PrimaryButton disabled={processing} onClick={savePapel}>Salvar papel</PrimaryButton>
                  {papelForm.id && <SecondaryButton onClick={() => setPapelForm(emptyPapel)}>Cancelar</SecondaryButton>}
                </div>
                <div className="mt-5 space-y-2">
                  {coreografia.papeis.map((papel) => (
                    <div key={papel.id} className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 text-sm">
                      <span><strong>{papel.nome}</strong> - {currency.format(papel.valor_fantasia)} - {papel.status}</span>
                      <span className="flex gap-2">
                        <SmallButton onClick={() => editPapel(papel)}>Editar</SmallButton>
                        {papel.status === "ATIVO" && <DangerSmallButton onClick={() => inactivatePapel(papel)}>Inativar</DangerSmallButton>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-5">
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <FormHeader overline="Participantes" title="Adicionar alunas na coreografia" />
                  <PrimaryButton disabled={processing || selectedAlunoIds.length === 0 || alunosTurma.length === 0} onClick={saveParticipantesLote}>
                    Salvar {selectedAlunoIds.length || ""} selecionada(s)
                  </PrimaryButton>
                </div>

                <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_0.8fr_auto] lg:items-end">
                    <Select label="Turma" value={loteForm.turma_id} onChange={(value) => setLoteForm((prev) => ({ ...prev, turma_id: value }))} options={turmas.map((item) => [String(item.id), `${item.nome}${item.nivel ? ` - ${item.nivel}` : ""}`])} placeholder="Selecione" />
                    <Select label="Papel padrao" value={loteForm.papel_id} onChange={(value) => setLoteForm((prev) => ({ ...prev, papel_id: value }))} options={coreografia.papeis.filter((item) => item.status === "ATIVO").map((item) => [String(item.id), `${item.nome} - ${currency.format(item.valor_fantasia)}`])} placeholder={coreografia.papeis.filter((item) => item.status === "ATIVO").length === 1 ? "Preenchido automaticamente" : "Selecione"} />
                    <Field label="Valor padrao ajustado" value={loteForm.valor_fantasia} onChange={(value) => setLoteForm((prev) => ({ ...prev, valor_fantasia: value }))} placeholder="Opcional" />
                    <SecondaryButton onClick={pesquisarAlunasTurma}>Pesquisar</SecondaryButton>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
                  <div className="flex flex-col gap-3 border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex items-center gap-3 text-sm font-semibold text-[#1F2A5A]">
                      <input type="checkbox" checked={alunosTurma.length > 0 && selectedAlunoIds.length === alunosTurma.length} onChange={toggleTodosAlunos} disabled={alunosTurma.length === 0} className="h-4 w-4 accent-[#E61E4D]" />
                      Alunas da turma
                    </label>
                    <span className="text-sm font-medium text-[#4B5563]">{selectedAlunoIds.length} de {alunosTurma.length} selecionada(s)</span>
                  </div>

                  {alunosTurma.length === 0 ? (
                    <div className="p-6 text-sm text-[#4B5563]">Selecione uma turma para carregar as alunas.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                        <thead className="bg-white">
                          <tr>
                            <Th>Aluna</Th>
                            <Th>Papel diferente</Th>
                            <Th>Valor individual</Th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                          {alunosTurma.map((aluna) => {
                            const selected = selectedAlunoIds.includes(aluna.id);
                            const papelUnico = coreografia.papeis.filter((item) => item.status === "ATIVO").length === 1;
                            return (
                              <tr key={aluna.id} className={selected ? "bg-white" : "bg-[#F9FAFB] text-[#4B5563]"}>
                                <Td>
                                  <label className="flex items-center gap-3 font-medium text-[#1F2A5A]">
                                    <input type="checkbox" checked={selected} onChange={() => toggleAluno(aluna.id)} className="h-4 w-4 accent-[#E61E4D]" />
                                    {aluna.nome}
                                  </label>
                                </Td>
                                <Td>
                                  <select value={ajustesAluna[aluna.id]?.papel_id || ""} onChange={(event) => updateAjusteAluna(aluna.id, "papel_id", event.target.value)} className="w-full min-w-[180px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20">
                                    <option value="">{papelUnico || loteForm.papel_id ? "Usar padrao" : "Escolha"}</option>
                                    {coreografia.papeis.filter((item) => item.status === "ATIVO").map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                                  </select>
                                </Td>
                                <Td>
                                  <input value={ajustesAluna[aluna.id]?.valor_fantasia || ""} onChange={(event) => updateAjusteAluna(aluna.id, "valor_fantasia", event.target.value)} className="w-full min-w-[140px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20" placeholder="Opcional" />
                                </Td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <details className="mt-5 rounded-lg border border-[#E5E7EB] bg-white">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#1F2A5A]">Adicionar ou editar aluna avulsa</summary>
                  <div className="border-t border-[#E5E7EB] p-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Select label="Aluna" value={participanteForm.aluno_id} onChange={(value) => setParticipanteForm((prev) => ({ ...prev, aluno_id: value }))} options={alunos.map((item) => [String(item.id), item.nome])} placeholder="Selecione" />
                      <Select label="Papel" value={participanteForm.papel_id} onChange={(value) => setParticipanteForm((prev) => ({ ...prev, papel_id: value }))} options={coreografia.papeis.filter((item) => item.status === "ATIVO").map((item) => [String(item.id), item.nome])} placeholder="Selecione" />
                      <Field label="Valor individual" value={participanteForm.valor_fantasia} onChange={(value) => setParticipanteForm((prev) => ({ ...prev, valor_fantasia: value }))} placeholder="Opcional" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <PrimaryButton disabled={processing} onClick={saveParticipante}>Salvar avulsa</PrimaryButton>
                      {participanteForm.id && <SecondaryButton onClick={() => setParticipanteForm(emptyParticipante)}>Cancelar</SecondaryButton>}
                    </div>
                  </div>
                </details>

                <div className="mt-6 space-y-2">
                  <p className="text-sm font-semibold text-[#1F2A5A]">Participantes vinculadas</p>
                  {coreografia.participantes.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 text-sm">
                      <span><strong>{item.aluno_nome}</strong> - {item.papel_nome} - {currency.format(item.valor_cobranca)}</span>
                      <span className="flex gap-2">
                        <SmallButton onClick={() => editParticipante(item)}>Editar</SmallButton>
                        <DangerSmallButton onClick={() => removeParticipante(item)}>Remover</DangerSmallButton>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-5">
              <FormHeader overline="Fantasia" title="Gerar cobrancas da coreografia" />
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <Field label="Data de vencimento" type="date" value={billingDueDate} onChange={setBillingDueDate} placeholder="dd/mm/aaaa" />
                <PrimaryButton disabled={processing || coreografia.participantes.length === 0} onClick={gerarCobrancas}>Gerar cobrancas</PrimaryButton>
              </div>
            </div>
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

function FormHeader({ overline, title }: { overline: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">{overline}</p>
      <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">{title}</h2>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20" placeholder={placeholder} />
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; placeholder: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20">
        <option value="">{placeholder}</option>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[#1F2A5A]">{label}</p>
      <p className="rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1F2A5A]">{value}</p>
    </div>
  );
}

function PrimaryButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">{children}</button>;
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">{children}</button>;
}

function SmallButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-full bg-[#6A4FBF]/10 px-3 py-1 text-xs text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">{children}</button>;
}

function DangerSmallButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-full bg-[#E61E4D]/10 px-3 py-1 text-xs text-[#E61E4D] transition hover:bg-[#E61E4D]/20">{children}</button>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold text-[#1F2A5A]">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4">{children}</td>;
}

function formatDate(value: string | null) {
  return formatDateBR(value);
}
