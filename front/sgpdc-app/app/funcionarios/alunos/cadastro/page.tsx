"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import SearchableSelect from "@/components/SearchableSelect";

type Responsavel = { id: number; nome: string };
type Turma = { id: number; nome: string };
type Aluna = { id: number; nome: string };
type ResponsavelFormData = {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  data_nascimento: string;
  parentesco: string;
};
type PlanoMensalidade = {
  id: number;
  nome: string;
  tipo_plano: "INDIVIDUAL" | "COMBINADO" | "FAMILIAR";
  qtd_alunas: number;
  qtd_cursos: number;
  valor_cartao_pix: number;
  valor_dinheiro: number;
};
type PlanoFinanceiroAtivo = {
  id: number;
  tipo_grupo: "INDIVIDUAL" | "FAMILIAR";
  plano_mensalidade_id: number;
  plano: PlanoMensalidade;
  alunas: Aluna[];
};

const initialResponsavelFormData: ResponsavelFormData = {
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
  data_nascimento: "",
  parentesco: "",
};

export default function CadastroAlunoPage() {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunas, setAlunas] = useState<Aluna[]>([]);
  const [planos, setPlanos] = useState<PlanoMensalidade[]>([]);
  const [planosFinanceiros, setPlanosFinanceiros] = useState<PlanoFinanceiroAtivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [responsavelModalOpen, setResponsavelModalOpen] = useState(false);
  const [savingResponsavel, setSavingResponsavel] = useState(false);
  const [responsavelError, setResponsavelError] = useState<string | null>(null);
  const [loadingPlanosFinanceiros, setLoadingPlanosFinanceiros] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [responsavelFormData, setResponsavelFormData] = useState<ResponsavelFormData>(initialResponsavelFormData);
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    data_nascimento: "",
    data_matricula: new Date().toISOString().split("T")[0],
    responsavel_id: "",
    status: "ATIVO",
    turma_ids: [] as number[],
    tipo_cobranca: "INDIVIDUAL" as "INDIVIDUAL" | "FAMILIAR",
    plano_mensalidade_id: "",
    data_inicio_cobranca: new Date().toISOString().split("T")[0],
    acao_plano_financeiro: "CRIAR" as "CRIAR" | "VINCULAR" | "SUBSTITUIR",
    grupo_financeiro_id: "",
    aluna_ids: [] as number[],
  });

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!formData.responsavel_id) {
      setPlanosFinanceiros([]);
      setFormData((prev) => ({ ...prev, acao_plano_financeiro: "CRIAR", grupo_financeiro_id: "" }));
      return;
    }
    loadPlanosFinanceiros(formData.responsavel_id);
  }, [formData.responsavel_id]);

  const loadInitialData = async () => {
    await Promise.all([loadResponsaveis(), loadTurmas(), loadAlunas(), loadPlanos()]);
  };

  const loadResponsaveis = async () => {
    const response = await apiFetch("/api/responsaveis");
    if (response.ok) setResponsaveis(await response.json());
  };

  const loadTurmas = async () => {
    const response = await apiFetch("/api/turmas");
    if (response.ok) setTurmas(await response.json());
  };

  const loadAlunas = async () => {
    const response = await apiFetch("/api/alunos");
    if (response.ok) setAlunas(await response.json());
  };

  const loadPlanos = async () => {
    const response = await apiFetch("/api/planos-mensalidade?ativos=true");
    if (response.ok) setPlanos(await response.json());
  };

  const loadPlanosFinanceiros = async (responsavelId: string) => {
    try {
      setLoadingPlanosFinanceiros(true);
      const response = await apiFetch(`/api/planos-financeiros/responsavel/${responsavelId}/ativos`);
      const data = await response.json();
      const lista = Array.isArray(data) ? data : [];
      setPlanosFinanceiros(lista);
      const primeiroFamiliar = lista.find((plano) => plano.tipo_grupo === "FAMILIAR");
      const planoInicial = primeiroFamiliar || lista[0];
      setFormData((prev) => ({
        ...prev,
        acao_plano_financeiro: primeiroFamiliar ? "VINCULAR" : "CRIAR",
        grupo_financeiro_id: planoInicial?.id ? String(planoInicial.id) : "",
        plano_mensalidade_id: planoInicial?.plano_mensalidade_id ? String(planoInicial.plano_mensalidade_id) : prev.plano_mensalidade_id,
        tipo_cobranca: planoInicial?.tipo_grupo || prev.tipo_cobranca,
      }));
    } catch {
      setPlanosFinanceiros([]);
    } finally {
      setLoadingPlanosFinanceiros(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResponsavelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setResponsavelFormData((prev) => ({ ...prev, [name]: value }));
  };

  const closeResponsavelModal = () => {
    if (savingResponsavel) return;
    setResponsavelModalOpen(false);
    setResponsavelError(null);
    setResponsavelFormData(initialResponsavelFormData);
  };

  const handleResponsavelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingResponsavel(true);
    setResponsavelError(null);

    try {
      const response = await apiFetch("/api/responsaveis", {
        method: "POST",
        body: JSON.stringify({ ...responsavelFormData, status: "ATIVO" }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao cadastrar responsável");
      }

      const novoResponsavelId = Number(data.id);
      if (!Number.isInteger(novoResponsavelId) || novoResponsavelId <= 0) {
        throw new Error("Responsável cadastrado sem id válido");
      }

      const novoResponsavel = { id: novoResponsavelId, nome: responsavelFormData.nome };
      setResponsaveis((prev) => {
        const semDuplicado = prev.filter((responsavel) => responsavel.id !== novoResponsavelId);
        return [...semDuplicado, novoResponsavel].sort((a, b) => a.nome.localeCompare(b.nome));
      });
      setFormData((prev) => ({ ...prev, responsavel_id: String(novoResponsavelId) }));
      setResponsavelModalOpen(false);
      setResponsavelFormData(initialResponsavelFormData);
      await loadResponsaveis();
    } catch (err) {
      setResponsavelError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSavingResponsavel(false);
    }
  };

  const handleTurmaToggle = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      turma_ids: prev.turma_ids.includes(id) ? prev.turma_ids.filter((turmaId) => turmaId !== id) : [...prev.turma_ids, id],
    }));
  };

  const handleAlunaToggle = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      aluna_ids: prev.aluna_ids.includes(id) ? prev.aluna_ids.filter((alunaId) => alunaId !== id) : [...prev.aluna_ids, id],
    }));
  };

  const selectedPlanoFinanceiro = planosFinanceiros.find((plano) => String(plano.id) === formData.grupo_financeiro_id);
  const selectedPlanoMensalidade = planos.find((plano) => String(plano.id) === formData.plano_mensalidade_id);
  const planoFinanceiroIndividual = selectedPlanoFinanceiro?.tipo_grupo === "INDIVIDUAL";
  const planosFamiliares = planosFinanceiros.filter((plano) => plano.tipo_grupo === "FAMILIAR");
  const planosMensalidadeDisponiveis = planos.filter((plano) =>
    formData.tipo_cobranca === "FAMILIAR" ? plano.tipo_plano === "FAMILIAR" : plano.tipo_plano !== "FAMILIAR"
  );

  const handleTipoCobrancaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tipo = e.target.value as "INDIVIDUAL" | "FAMILIAR";
    const planoAtual = planos.find((item) => String(item.id) === formData.plano_mensalidade_id);
    const planoAtualCompativel = tipo === "FAMILIAR" ? planoAtual?.tipo_plano === "FAMILIAR" : planoAtual?.tipo_plano !== "FAMILIAR";

    setFormData((prev) => ({
      ...prev,
      tipo_cobranca: tipo,
      plano_mensalidade_id: planoAtualCompativel ? prev.plano_mensalidade_id : "",
      aluna_ids: tipo === "FAMILIAR" ? prev.aluna_ids : [],
    }));
  };

  const handlePlanoMensalidadeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const planoId = e.target.value;
    const plano = planos.find((item) => String(item.id) === planoId);
    setFormData((prev) => ({
      ...prev,
      plano_mensalidade_id: planoId,
      tipo_cobranca: plano?.tipo_plano === "FAMILIAR" ? "FAMILIAR" : "INDIVIDUAL",
      aluna_ids: plano?.tipo_plano === "FAMILIAR" ? prev.aluna_ids : [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.turma_ids.length === 0) {
      setError("Selecione ao menos uma turma para matricular o aluno.");
      setLoading(false);
      return;
    }

    if (!formData.responsavel_id || !formData.plano_mensalidade_id || !formData.data_inicio_cobranca) {
      setError("Preencha os dados do Plano Financeiro.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        responsavel_id: Number(formData.responsavel_id),
        turma_ids: formData.turma_ids,
        plano_financeiro: {
          responsavel_financeiro_id: Number(formData.responsavel_id),
          tipo_cobranca: formData.tipo_cobranca,
          plano_mensalidade_id: Number(formData.plano_mensalidade_id),
          data_inicio: formData.data_inicio_cobranca,
          acao: formData.acao_plano_financeiro,
          grupo_financeiro_id: formData.grupo_financeiro_id ? Number(formData.grupo_financeiro_id) : null,
          aluna_ids:
            formData.tipo_cobranca === "FAMILIAR" && formData.acao_plano_financeiro === "SUBSTITUIR"
              ? selectedPlanoFinanceiro?.alunas.map((aluna) => aluna.id) || []
              : formData.tipo_cobranca === "FAMILIAR" && formData.acao_plano_financeiro === "CRIAR"
                ? formData.aluna_ids
                : [],
        },
      };

      const response = await apiFetch("/api/alunos", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao cadastrar aluno");
      }

      setSuccess(true);
      setFormData({
        nome: "",
        cpf: "",
        telefone: "",
        email: "",
        data_nascimento: "",
        data_matricula: new Date().toISOString().split("T")[0],
        responsavel_id: "",
        status: "ATIVO",
        turma_ids: [],
        tipo_cobranca: "INDIVIDUAL",
        plano_mensalidade_id: "",
        data_inicio_cobranca: new Date().toISOString().split("T")[0],
        acao_plano_financeiro: "CRIAR",
        grupo_financeiro_id: "",
        aluna_ids: [],
      });
      setPlanosFinanceiros([]);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Cadastro</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Nova Matrícula</h1>
          </div>
          <Link href="/funcionarios/alunos" className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
            Voltar
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[32px] border border-[#E5E7EB] bg-white p-8 shadow-sm space-y-8">
          {error && <div className="rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}
          {success && <div className="rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">Matrícula cadastrada com sucesso!</div>}

          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-[#1F2A5A]">Dados da Matrícula</h2>
            <Field label="Nome *" name="nome" value={formData.nome} onChange={handleChange} required placeholder="Nome completo" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CPF *" name="cpf" value={formData.cpf} onChange={handleChange} required placeholder="000.000.000-00" />
              <Field label="Telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
            </div>
            <Field label="Email *" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="aluno@example.com" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Data de Nascimento *" name="data_nascimento" type="date" value={formData.data_nascimento} onChange={handleChange} required />
              <Field label="Data da Matrícula *" name="data_matricula" type="date" value={formData.data_matricula} onChange={handleChange} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="grid grid-cols-[minmax(0,1fr)_3rem] items-end gap-2">
                  <Select label="Responsável *" name="responsavel_id" value={formData.responsavel_id} onChange={handleChange} required options={responsaveis.map((resp) => [String(resp.id), resp.nome])} placeholder="Selecionar responsável" />
                  <button
                    type="button"
                    onClick={() => {
                      setResponsavelError(null);
                      setResponsavelModalOpen(true);
                    }}
                    aria-label="Cadastrar novo responsável"
                    title="Cadastrar novo responsável"
                    className="mb-0 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#1F2A5A] bg-white text-2xl font-semibold leading-none text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]"
                  >
                    +
                  </button>
                </div>
              </div>
                <div className="rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm font-semibold text-[#1F2A5A]">
                  Status: ATIVO
                </div>
            </div>
            <Checklist title="Turmas *" empty="Nenhuma turma ativa disponível." items={turmas} selectedIds={formData.turma_ids} onToggle={handleTurmaToggle} />
          </section>

          <section className="space-y-5 rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
            <h2 className="text-lg font-semibold text-[#1F2A5A]">Plano Financeiro</h2>
            {loadingPlanosFinanceiros && <p className="text-sm text-[#2B2B2B]/70">Consultando plano financeiro do responsável...</p>}
            {planosFinanceiros.length > 0 && (
              <div className="rounded-3xl bg-[#6A4FBF]/10 p-4 text-sm text-[#1F2A5A]">
                <p className="font-semibold">Este responsável já possui um plano financeiro ativo.</p>
                {selectedPlanoFinanceiro && (
                  <p className="mt-2">
                    Plano atual: {selectedPlanoFinanceiro.plano.nome} ({selectedPlanoFinanceiro.tipo_grupo === "INDIVIDUAL" ? "Individual" : "Familiar"}).
                  </p>
                )}
                {planoFinanceiroIndividual && (
                  <p className="mt-2 text-[#E61E4D]">
                    Este plano é individual, então não permite vincular outro aluno. Para cobrar os alunos juntos, substitua por um plano familiar.
                  </p>
                )}
                {selectedPlanoFinanceiro?.alunas.length ? (
                  <p className="mt-2">Alunos vinculados: {selectedPlanoFinanceiro.alunas.map((aluna) => aluna.nome).join(", ")}</p>
                ) : null}
              </div>
            )}
            {planosFinanceiros.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <RadioCard label="Criar novo plano financeiro" checked={formData.acao_plano_financeiro === "CRIAR"} onChange={() => setFormData((prev) => ({ ...prev, acao_plano_financeiro: "CRIAR", grupo_financeiro_id: "" }))} />
                {planosFamiliares.length > 0 && (
                  <RadioCard label="Vincular ao plano familiar existente" checked={formData.acao_plano_financeiro === "VINCULAR"} onChange={() => setFormData((prev) => ({ ...prev, acao_plano_financeiro: "VINCULAR", grupo_financeiro_id: String(planosFamiliares[0].id), plano_mensalidade_id: String(planosFamiliares[0].plano_mensalidade_id), tipo_cobranca: "FAMILIAR" }))} />
                )}
                {planosFinanceiros.some((plano) => plano.tipo_grupo === "INDIVIDUAL") && (
                  <RadioCard label="Substituir individual por familiar" checked={formData.acao_plano_financeiro === "SUBSTITUIR"} onChange={() => {
                    const planoIndividual = planosFinanceiros.find((plano) => plano.tipo_grupo === "INDIVIDUAL") || planosFinanceiros[0];
                    const planoFamiliar = planos.find((plano) => plano.tipo_plano === "FAMILIAR");
                    setFormData((prev) => ({ ...prev, acao_plano_financeiro: "SUBSTITUIR", grupo_financeiro_id: String(planoIndividual.id), tipo_cobranca: "FAMILIAR", plano_mensalidade_id: planoFamiliar ? String(planoFamiliar.id) : prev.plano_mensalidade_id }));
                  }} />
                )}
              </div>
            )}
            {(formData.acao_plano_financeiro === "VINCULAR" || formData.acao_plano_financeiro === "SUBSTITUIR") && planosFinanceiros.length > 0 && (
              <Select
                label={formData.acao_plano_financeiro === "SUBSTITUIR" ? "Plano individual que será substituído" : "Plano financeiro existente"}
                name="grupo_financeiro_id"
                value={formData.grupo_financeiro_id}
                onChange={handleChange}
                required
                options={(formData.acao_plano_financeiro === "VINCULAR" ? planosFamiliares : planosFinanceiros.filter((plano) => plano.tipo_grupo === "INDIVIDUAL")).map((plano) => [String(plano.id), `${plano.plano.nome} - ${plano.tipo_grupo}`])}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Tipo de cobrança *" name="tipo_cobranca" value={formData.tipo_cobranca} onChange={handleTipoCobrancaChange} options={[["INDIVIDUAL", "Individual"], ["FAMILIAR", "Familiar"]]} />
              <Select label="Plano de mensalidade *" name="plano_mensalidade_id" value={formData.plano_mensalidade_id} onChange={handlePlanoMensalidadeChange} required options={planosMensalidadeDisponiveis.map((plano) => [String(plano.id), `${plano.nome} (${plano.tipo_plano === "FAMILIAR" ? "Familiar" : "Individual"}) - Cartão/Pix R$ ${Number(plano.valor_cartao_pix).toFixed(2)} | Dinheiro R$ ${Number(plano.valor_dinheiro).toFixed(2)}`])} placeholder="Selecionar plano" />
            </div>
            {selectedPlanoMensalidade && (
              <p className="text-sm text-[#4B5563]">
                O plano selecionado está configurado como {selectedPlanoMensalidade.tipo_plano === "FAMILIAR" ? "familiar" : "individual"}.
              </p>
            )}
            <Field label="Data de início da cobrança *" name="data_inicio_cobranca" type="date" value={formData.data_inicio_cobranca} onChange={handleChange} required />
            {formData.tipo_cobranca === "FAMILIAR" && formData.acao_plano_financeiro === "CRIAR" && (
              <Checklist title="Outros alunos deste plano familiar" empty="Nenhum aluno cadastrado para vincular." items={alunas} selectedIds={formData.aluna_ids} onToggle={handleAlunaToggle} />
            )}
          </section>

          <button type="submit" disabled={loading} className="w-full rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">
            {loading ? "Cadastrando..." : "Cadastrar Matrícula"}
          </button>
        </form>
      </main>

      {responsavelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2A5A]/40 px-4 py-6">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Responsável</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1F2A5A]">Novo Responsável</h2>
              </div>
              <button
                type="button"
                onClick={closeResponsavelModal}
                disabled={savingResponsavel}
                aria-label="Fechar modal"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] text-xl text-[#1F2A5A] transition hover:border-[#E61E4D] hover:text-[#E61E4D] disabled:opacity-50"
              >
                x
              </button>
            </div>

            <form onSubmit={handleResponsavelSubmit} className="space-y-5">
              {responsavelError && <div className="rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{responsavelError}</div>}

              <Field label="Nome *" name="nome" value={responsavelFormData.nome} onChange={handleResponsavelChange} required placeholder="Nome completo" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="CPF *" name="cpf" value={responsavelFormData.cpf} onChange={handleResponsavelChange} required placeholder="000.000.000-00" />
                <Field label="Telefone" name="telefone" type="tel" value={responsavelFormData.telefone} onChange={handleResponsavelChange} placeholder="(11) 99999-9999" />
              </div>
              <Field label="Email *" name="email" type="email" value={responsavelFormData.email} onChange={handleResponsavelChange} required placeholder="responsavel@example.com" />
              <Field label="Data de nascimento" name="data_nascimento" type="date" value={responsavelFormData.data_nascimento} onChange={handleResponsavelChange} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Parentesco *"
                  name="parentesco"
                  value={responsavelFormData.parentesco}
                  onChange={handleResponsavelChange}
                  required
                  options={[
                    ["PAI", "Pai"],
                    ["MAE", "Mãe"],
                    ["AVO_PATERNA", "Avó Paterna"],
                    ["AVO_PATERNO", "Avô Paterno"],
                    ["AVO_MATERNA", "Avó Materna"],
                    ["AVO_MATERNO", "Avô Materno"],
                    ["TIA", "Tia"],
                    ["TIO", "Tio"],
                    ["TUTOR", "Tutor"],
                  ]}
                  placeholder="Selecionar parentesco"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeResponsavelModal}
                  disabled={savingResponsavel}
                  className="rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF] disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingResponsavel}
                  className="rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50"
                >
                  {savingResponsavel ? "Cadastrando..." : "Cadastrar Responsável"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <input {...props} className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20" />
    </div>
  );
}

function Select({ label, options, placeholder, value, onChange, name, disabled }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[][]; placeholder?: string }) {
  return (
    <SearchableSelect
      label={label}
      value={String(value || "")}
      onChange={(nextValue) => onChange?.({ target: { name, value: nextValue } } as React.ChangeEvent<HTMLSelectElement>)}
      options={options}
      placeholder={placeholder || "Selecione"}
      disabled={disabled}
    />
  );
}

function Checklist({ title, empty, items, selectedIds, onToggle }: { title: string; empty: string; items: { id: number; nome: string }[]; selectedIds: number[]; onToggle: (id: number) => void }) {
  return (
    <div className="rounded-3xl border border-[#E5E7EB] bg-white p-4">
      <p className="mb-3 text-sm font-medium text-[#1F2A5A]">{title}</p>
      {items.length === 0 ? <p className="text-sm text-[#2B2B2B]/70">{empty}</p> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 transition hover:border-[#6A4FBF]">
              <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => onToggle(item.id)} className="h-4 w-4 rounded border-[#6A4FBF] text-[#6A4FBF] focus:ring-[#6A4FBF]" />
              <span className="text-sm text-[#2B2B2B]">{item.nome}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function RadioCard({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2A5A] transition hover:border-[#6A4FBF]">
      <input type="radio" checked={checked} onChange={onChange} className="h-4 w-4 border-[#6A4FBF] text-[#6A4FBF] focus:ring-[#6A4FBF]" />
      {label}
    </label>
  );
}
