"use client";

import { apiFetch } from "@/lib/api";
import { formatDateBR } from "@/lib/format";
import { useEffect, useState } from "react";
import Link from "next/link";

const DIAS_DA_SEMANA = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

type Professor = {
  id: number;
  nome: string;
};

type Modalidade = {
  id: number;
  nome: string;
  status: "ATIVA" | "INATIVA";
};

type Local = {
  id: number;
  nome: string;
  status: "ATIVO" | "INATIVO";
  cidade: string;
};

type Turma = {
  id: number;
  nome: string;
  modalidade: string;
  modalidade_id: number | null;
  nivel: string;
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  status: string;
  local_id: number | null;
  local_nome: string | null;
  professor_ids: number[];
  professor_names?: string[];
};

type MensalidadeSituacao = "pagas" | "em_aberto" | "atrasadas";

type MensalidadeAluno = {
  id: number | string;
  prevista?: boolean;
  mes_referencia: number;
  ano_referencia: number;
  valor_final: number;
  valor_pago: number;
  saldo: number;
  status: string;
  data_vencimento: string | null;
  responsavel_nome: string | null;
  plano_nome: string | null;
};

type AlunoTurma = {
  id: number;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  matricula_id: number;
  resumo_mensalidades: {
    total: number;
    pagas: number;
    em_aberto: number;
    atrasadas: number;
  };
  mensalidades: Record<MensalidadeSituacao, MensalidadeAluno[]>;
};

const initialForm = {
  nome: "",
  modalidade_id: "",
  local_id: "",
  nivel: "",
  dia_semana: "",
  horario_inicio: "",
  horario_fim: "",
  professor_ids: [] as number[],
  status: "ATIVA",
};

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<number | null>(null);
  const [alunosTurma, setAlunosTurma] = useState<AlunoTurma[]>([]);
  const [alunoSearch, setAlunoSearch] = useState("");
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [expandedSituacao, setExpandedSituacao] = useState<Record<string, boolean>>({});
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        await Promise.all([loadProfessores(), loadTurmas(), loadModalidades(), loadLocais()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados da turma");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadProfessores = async () => {
    const response = await apiFetch(`/api/professores`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erro ao carregar professores");
    }
    setProfessores(Array.isArray(data) ? data : []);
  };

  const loadTurmas = async () => {
    const response = await apiFetch(`/api/turmas`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erro ao carregar turmas");
    }
    setTurmas(Array.isArray(data) ? data : []);
  };

  const loadAlunosTurma = async (turmaId: number) => {
    setLoadingAlunos(true);
    setError(null);
    setAlunoSearch("");
    setExpandedSituacao({});

    try {
      const response = await apiFetch(`/api/turmas/${turmaId}/alunos`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar alunos da turma");
      }
      setAlunosTurma(Array.isArray(data) ? data : []);
    } catch (err) {
      setAlunosTurma([]);
      setError(err instanceof Error ? err.message : "Erro ao carregar alunos da turma");
    } finally {
      setLoadingAlunos(false);
    }
  };

  const handleSelectTurma = async (turmaId: number) => {
    if (selectedTurmaId === turmaId) {
      setSelectedTurmaId(null);
      setAlunosTurma([]);
      setAlunoSearch("");
      setExpandedSituacao({});
      return;
    }

    setSelectedTurmaId(turmaId);
    await loadAlunosTurma(turmaId);
  };

  const loadModalidades = async () => {
    const response = await apiFetch(`/api/modalidades`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erro ao carregar modalidades");
    }
    setModalidades(Array.isArray(data) ? data : []);
  };

  const loadLocais = async () => {
    const response = await apiFetch(`/api/locais`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erro ao carregar locais");
    }
    setLocais(Array.isArray(data) ? data : []);
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfessorToggle = (id: number) => {
    setFormData((prev) => {
      const exists = prev.professor_ids.includes(id);
      return {
        ...prev,
        professor_ids: exists
          ? prev.professor_ids.filter((professorId) => professorId !== id)
          : [...prev.professor_ids, id],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (formData.professor_ids.length === 0) {
      setError("Selecione ao menos um professor.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        nome: nomeAutomatico,
        modalidade_id: Number(formData.modalidade_id),
        local_id: Number(formData.local_id),
        nivel: formData.nivel,
        dia_semana: formData.dia_semana,
        horario_inicio: formData.horario_inicio,
        horario_fim: formData.horario_fim,
        professor_ids: formData.professor_ids,
        status: formData.status,
      };

      const path = editingId ? `/api/turmas/${editingId}` : `/api/turmas`;
      const method = editingId ? "PUT" : "POST";

      const response = await apiFetch(path, {
        method,
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar turma");
      }

      setSuccess(editingId ? "Turma atualizada com sucesso." : "Turma cadastrada com sucesso.");
      resetForm();
      await loadTurmas();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar turma");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (turma: Turma) => {
    setFormData({
      nome: turma.nome,
      modalidade_id: turma.modalidade_id ? String(turma.modalidade_id) : "",
      local_id: turma.local_id ? String(turma.local_id) : "",
      nivel: turma.nivel,
      dia_semana: turma.dia_semana,
      horario_inicio: turma.horario_inicio,
      horario_fim: turma.horario_fim,
      professor_ids: turma.professor_ids || [],
      status: turma.status || "ATIVA",
    });
    setEditingId(turma.id);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja inativar esta turma?")) return;

    try {
      const response = await apiFetch(`/api/turmas/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erro ao inativar turma");
      }

      setSuccess("Turma inativada com sucesso.");
      await loadTurmas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao inativar turma");
    }
  };

  const modalidadeAtual = editingId && formData.modalidade_id
    ? modalidades.find((item) => item.id === Number(formData.modalidade_id))
    : null;
  const localAtual = editingId && formData.local_id
    ? locais.find((item) => item.id === Number(formData.local_id))
    : null;

  const modalidadesDisponiveis = modalidades.filter(
    (item) => item.status === "ATIVA" || item.id === modalidadeAtual?.id
  );
  const locaisDisponiveis = locais.filter(
    (item) => item.status === "ATIVO" || item.id === localAtual?.id
  );
  const nomeAutomatico = [
    modalidades.find((item) => String(item.id) === formData.modalidade_id)?.nome,
    formData.dia_semana,
    formData.horario_inicio,
    locais.find((item) => String(item.id) === formData.local_id)?.nome,
  ].filter(Boolean).join(" - ");
  const turmaSelecionada = turmas.find((turma) => turma.id === selectedTurmaId);
  const normalizedAlunoSearch = alunoSearch.trim().toLowerCase();
  const alunosFiltrados = normalizedAlunoSearch
    ? alunosTurma.filter((aluno) =>
        [aluno.nome, aluno.cpf, aluno.telefone, aluno.email]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedAlunoSearch))
      )
    : alunosTurma;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

  const toggleSituacao = (alunoId: number, situacao: MensalidadeSituacao) => {
    const key = `${alunoId}-${situacao}`;
    setExpandedSituacao((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const situacoes: Array<{
    key: MensalidadeSituacao;
    label: string;
    countKey: keyof AlunoTurma["resumo_mensalidades"];
    className: string;
  }> = [
    { key: "pagas", label: "Pagas", countKey: "pagas", className: "border-[#1F8A5B] bg-[#1F8A5B]/10 text-[#1F8A5B]" },
    { key: "em_aberto", label: "Em aberto", countKey: "em_aberto", className: "border-[#C77700] bg-[#C77700]/10 text-[#9A5B00]" },
    { key: "atrasadas", label: "Atrasadas", countKey: "atrasadas", className: "border-[#E61E4D] bg-[#E61E4D]/10 text-[#E61E4D]" },
  ];

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Turmas</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Gestão de Turmas</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/funcionarios/modalidades"
              className="inline-flex items-center rounded-full border border-[#6A4FBF] bg-white px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#F9FAFB]"
            >
              Modalidades
            </Link>
            <Link
              href="/funcionarios/locais"
              className="inline-flex items-center rounded-full border border-[#6A4FBF] bg-white px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#F9FAFB]"
            >
              Locais
            </Link>
            <Link
              href="/funcionarios"
              className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]"
            >
              Voltar
            </Link>
          </div>
        </div>

        {success && <div className="mb-6 rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">{success}</div>}
        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

        <div className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Lista</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Turmas cadastradas ({turmas.length})</h2>
            </div>
            <button
              onClick={() => {
                if (showForm && !editingId) {
                  resetForm();
                } else {
                  setShowForm(!showForm);
                  setEditingId(null);
                  setError(null);
                  setSuccess(null);
                }
              }}
              className="inline-flex items-center rounded-full border border-[#E61E4D] bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A]"
            >
              {showForm ? "Fechar" : "+ Nova Turma"}
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando turmas...</p>
          ) : turmas.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhuma turma cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Turma</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Modalidade</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Local</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Nível</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Dia / Horário</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Professores</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {turmas.map((turma) => (
                    <tr
                      key={turma.id}
                      onClick={() => void handleSelectTurma(turma.id)}
                      className={`cursor-pointer bg-white transition hover:bg-[#F2F2F2] ${selectedTurmaId === turma.id ? "bg-[#6A4FBF]/10" : ""}`}
                    >
                      <td className="px-4 py-4 font-medium">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleSelectTurma(turma.id);
                          }}
                          className="text-left font-semibold text-[#1F2A5A] underline-offset-4 hover:text-[#6A4FBF] hover:underline"
                        >
                          {turma.nome}
                        </button>
                      </td>
                      <td className="px-4 py-4">{turma.modalidade}</td>
                      <td className="px-4 py-4">{turma.local_nome || "-"}</td>
                      <td className="px-4 py-4">{turma.nivel}</td>
                      <td className="px-4 py-4">
                        {turma.dia_semana}
                        <br />
                        {turma.horario_inicio} - {turma.horario_fim}
                      </td>
                      <td className="px-4 py-4">
                        {turma.professor_names?.length ? turma.professor_names.join(", ") : turma.professor_ids.length}
                      </td>
                      <td className="flex gap-2 px-4 py-4">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(turma);
                          }}
                          className="rounded-full bg-[#6A4FBF]/10 px-3 py-1 text-xs text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDelete(turma.id);
                          }}
                          className="rounded-full bg-[#E61E4D]/10 px-3 py-1 text-xs text-[#E61E4D] transition hover:bg-[#E61E4D]/20"
                        >
                          Inativar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedTurmaId && (
            <section className="mt-6 border-t border-[#E5E7EB] pt-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Alunos</p>
                  <h3 className="mt-2 text-lg font-semibold text-[#1F2A5A]">
                    {turmaSelecionada?.nome || "Turma selecionada"}
                  </h3>
                </div>
                <p className="text-sm text-[#2B2B2B]/70">
                  {alunosFiltrados.length} de {alunosTurma.length} aluno(s)
                </p>
              </div>

              {loadingAlunos ? (
                <p className="text-sm text-[#2B2B2B]/70">Carregando alunos...</p>
              ) : alunosTurma.length === 0 ? (
                <p className="text-sm text-[#2B2B2B]/70">Nenhum aluno ativo nesta turma.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Pesquisar aluno na turma</label>
                    <input
                      value={alunoSearch}
                      onChange={(event) => setAlunoSearch(event.target.value)}
                      className="w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#6A4FBF] focus:ring-2 focus:ring-[#6A4FBF]/20"
                      placeholder="Digite nome, CPF, telefone ou e-mail"
                    />
                  </div>

                  {alunosFiltrados.length === 0 ? (
                    <p className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#2B2B2B]/70">
                      Nenhum aluno encontrado para a pesquisa.
                    </p>
                  ) : alunosFiltrados.map((aluno) => (
                    <article key={aluno.id} className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h4 className="font-semibold text-[#1F2A5A]">{aluno.nome}</h4>
                          <p className="mt-1 text-sm text-[#2B2B2B]/70">
                            {aluno.telefone || "Sem telefone"} {aluno.email ? `- ${aluno.email}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-[#6A4FBF]/30 bg-white px-3 py-2 text-xs font-semibold text-[#1F2A5A]">
                            Total: {aluno.resumo_mensalidades.total}
                          </span>
                          {situacoes.map((situacao) => {
                            const key = `${aluno.id}-${situacao.key}`;
                            const count = aluno.resumo_mensalidades[situacao.countKey];

                            return (
                              <button
                                key={situacao.key}
                                type="button"
                                onClick={() => toggleSituacao(aluno.id, situacao.key)}
                                className={`rounded-full border px-3 py-2 text-xs font-semibold transition hover:opacity-80 ${situacao.className}`}
                              >
                                {situacao.label}: {count}
                                <span className="ml-1">{expandedSituacao[key] ? "^" : "v"}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {situacoes.map((situacao) => {
                        const key = `${aluno.id}-${situacao.key}`;
                        const mensalidades = aluno.mensalidades?.[situacao.key] || [];
                        if (!expandedSituacao[key]) return null;

                        return (
                          <div key={key} className="mt-4 overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white">
                            {mensalidades.length === 0 ? (
                              <p className="px-4 py-3 text-sm text-[#2B2B2B]/70">Nenhuma mensalidade nesta situacao.</p>
                            ) : (
                              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                                <thead>
                                  <tr className="bg-white">
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Referencia</th>
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Vencimento</th>
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Responsavel</th>
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Plano</th>
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Valor</th>
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Pago</th>
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Saldo</th>
                                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E7EB]">
                                  {mensalidades.map((mensalidade) => (
                                    <tr key={mensalidade.id}>
                                      <td className="px-4 py-3">
                                        {String(mensalidade.mes_referencia).padStart(2, "0")}/{mensalidade.ano_referencia}
                                        {mensalidade.prevista ? " (prevista)" : ""}
                                      </td>
                                      <td className="px-4 py-3">{formatDateBR(mensalidade.data_vencimento)}</td>
                                      <td className="px-4 py-3">{mensalidade.responsavel_nome || "-"}</td>
                                      <td className="px-4 py-3">{mensalidade.plano_nome || "-"}</td>
                                      <td className="px-4 py-3">{formatCurrency(mensalidade.valor_final)}</td>
                                      <td className="px-4 py-3">{formatCurrency(mensalidade.valor_pago)}</td>
                                      <td className="px-4 py-3">{formatCurrency(mensalidade.saldo)}</td>
                                      <td className="px-4 py-3">{mensalidade.status}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        );
                      })}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-[32px] border border-[#E5E7EB] bg-white p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-[#1F2A5A]">{editingId ? "Editar Turma" : "Cadastrar Turma"}</h3>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Nome da turma *</label>
              <input
                name="nome"
                value={nomeAutomatico}
                readOnly
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                placeholder="Gerado automaticamente"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Modalidade *</label>
                <select
                  name="modalidade_id"
                  value={formData.modalidade_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                >
                  <option value="">Selecionar modalidade</option>
                  {modalidadesDisponiveis.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}{item.status === "INATIVA" ? " (Inativa)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Local *</label>
                <select
                  name="local_id"
                  value={formData.local_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                >
                  <option value="">Selecionar local</option>
                  {locaisDisponiveis.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome} - {item.cidade}{item.status === "INATIVO" ? " (Inativo)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Nível *</label>
                <input
                  name="nivel"
                  value={formData.nivel}
                  onChange={handleChange}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                  placeholder="Ex: Iniciante, Intermediário"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Dia da semana *</label>
                <select
                  name="dia_semana"
                  value={formData.dia_semana}
                  onChange={handleChange}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                >
                  <option value="">Selecionar dia</option>
                  {DIAS_DA_SEMANA.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Horário de início *</label>
                <input
                  type="time"
                  name="horario_inicio"
                  value={formData.horario_inicio}
                  onChange={handleChange}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Horário de fim *</label>
                <input
                  type="time"
                  name="horario_fim"
                  value={formData.horario_fim}
                  onChange={handleChange}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                />
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-[#1F2A5A]">Professores *</p>
              <div className="grid gap-3 md:grid-cols-2">
                {professores.length === 0 ? (
                  <p className="text-sm text-[#2B2B2B]/70">Nenhum professor disponível.</p>
                ) : (
                  professores.map((professor) => (
                    <label
                      key={professor.id}
                      className="flex cursor-pointer items-center gap-3 rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm transition hover:border-[#6A4FBF]"
                    >
                      <input
                        type="checkbox"
                        checked={formData.professor_ids.includes(professor.id)}
                        onChange={() => handleProfessorToggle(professor.id)}
                        className="h-4 w-4 rounded border-[#C4C4C4] text-[#6A4FBF] focus:ring-[#6A4FBF]"
                      />
                      <span>{professor.nome}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Salvando..." : editingId ? "Atualizar Turma" : "Cadastrar Turma"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
