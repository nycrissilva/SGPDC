"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Responsavel = { id: number; nome: string };
type Turma = { id: number; nome: string };
type Aluna = { id: number; nome: string };
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

export default function CadastroAlunoPage() {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunas, setAlunas] = useState<Aluna[]>([]);
  const [planos, setPlanos] = useState<PlanoMensalidade[]>([]);
  const [planosFinanceiros, setPlanosFinanceiros] = useState<PlanoFinanceiroAtivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlanosFinanceiros, setLoadingPlanosFinanceiros] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Nova Matricula</h1>
          </div>
          <Link href="/funcionarios/alunos" className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
            Voltar
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[32px] border border-[#E5E7EB] bg-white p-8 shadow-sm space-y-8">
          {error && <div className="rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}
          {success && <div className="rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">Matricula cadastrada com sucesso!</div>}

          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-[#1F2A5A]">Dados da Matricula</h2>
            <Field label="Nome *" name="nome" value={formData.nome} onChange={handleChange} required placeholder="Nome completo" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CPF *" name="cpf" value={formData.cpf} onChange={handleChange} required placeholder="000.000.000-00" />
              <Field label="Telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
            </div>
            <Field label="Email *" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="aluno@example.com" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Data de Nascimento *" name="data_nascimento" type="date" value={formData.data_nascimento} onChange={handleChange} required />
              <Field label="Data da Matricula *" name="data_matricula" type="date" value={formData.data_matricula} onChange={handleChange} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Responsavel *" name="responsavel_id" value={formData.responsavel_id} onChange={handleChange} required options={responsaveis.map((resp) => [String(resp.id), resp.nome])} placeholder="Selecionar responsavel" />
              <Select label="Status" name="status" value={formData.status} onChange={handleChange} options={[["ATIVO", "Ativo"], ["INATIVO", "Inativo"]]} />
            </div>
            <Checklist title="Turmas *" empty="Nenhuma turma ativa disponivel." items={turmas} selectedIds={formData.turma_ids} onToggle={handleTurmaToggle} />
          </section>

          <section className="space-y-5 rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
            <h2 className="text-lg font-semibold text-[#1F2A5A]">Plano Financeiro</h2>
            {loadingPlanosFinanceiros && <p className="text-sm text-[#2B2B2B]/70">Consultando plano financeiro do responsavel...</p>}
            {planosFinanceiros.length > 0 && (
              <div className="rounded-3xl bg-[#6A4FBF]/10 p-4 text-sm text-[#1F2A5A]">
                <p className="font-semibold">Este responsavel ja possui um plano financeiro ativo.</p>
                {selectedPlanoFinanceiro && (
                  <p className="mt-2">
                    Plano atual: {selectedPlanoFinanceiro.plano.nome} ({selectedPlanoFinanceiro.tipo_grupo === "INDIVIDUAL" ? "Individual" : "Familiar"}).
                  </p>
                )}
                {planoFinanceiroIndividual && (
                  <p className="mt-2 text-[#E61E4D]">
                    Este plano e individual, entao nao permite vincular outra aluna. Para cobrar as alunas juntas, substitua por um plano familiar.
                  </p>
                )}
                {selectedPlanoFinanceiro?.alunas.length ? (
                  <p className="mt-2">Alunas vinculadas: {selectedPlanoFinanceiro.alunas.map((aluna) => aluna.nome).join(", ")}</p>
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
                label={formData.acao_plano_financeiro === "SUBSTITUIR" ? "Plano individual que sera substituido" : "Plano financeiro existente"}
                name="grupo_financeiro_id"
                value={formData.grupo_financeiro_id}
                onChange={handleChange}
                required
                options={(formData.acao_plano_financeiro === "VINCULAR" ? planosFamiliares : planosFinanceiros.filter((plano) => plano.tipo_grupo === "INDIVIDUAL")).map((plano) => [String(plano.id), `${plano.plano.nome} - ${plano.tipo_grupo}`])}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Tipo de cobranca *" name="tipo_cobranca" value={formData.tipo_cobranca} onChange={handleTipoCobrancaChange} options={[["INDIVIDUAL", "Individual"], ["FAMILIAR", "Familiar"]]} />
              <Select label="Plano de mensalidade *" name="plano_mensalidade_id" value={formData.plano_mensalidade_id} onChange={handlePlanoMensalidadeChange} required options={planosMensalidadeDisponiveis.map((plano) => [String(plano.id), `${plano.nome} (${plano.tipo_plano === "FAMILIAR" ? "Familiar" : "Individual"}) - Cartao/Pix R$ ${Number(plano.valor_cartao_pix).toFixed(2)} | Dinheiro R$ ${Number(plano.valor_dinheiro).toFixed(2)}`])} placeholder="Selecionar plano" />
            </div>
            {selectedPlanoMensalidade && (
              <p className="text-sm text-[#4B5563]">
                O plano selecionado esta configurado como {selectedPlanoMensalidade.tipo_plano === "FAMILIAR" ? "familiar" : "individual"}.
              </p>
            )}
            <Field label="Data de inicio da cobranca *" name="data_inicio_cobranca" type="date" value={formData.data_inicio_cobranca} onChange={handleChange} required />
            {formData.tipo_cobranca === "FAMILIAR" && formData.acao_plano_financeiro === "CRIAR" && (
              <Checklist title="Outras alunas deste plano familiar" empty="Nenhuma aluna cadastrada para vincular." items={alunas} selectedIds={formData.aluna_ids} onToggle={handleAlunaToggle} />
            )}
          </section>

          <button type="submit" disabled={loading} className="w-full rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">
            {loading ? "Cadastrando..." : "Cadastrar Matricula"}
          </button>
        </form>
      </main>
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

function Select({ label, options, placeholder, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[][]; placeholder?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <select {...props} className="w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
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
