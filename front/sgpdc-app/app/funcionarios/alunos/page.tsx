"use client";

import { apiBase } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";

type Aluno = {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  status?: string;
  data_nascimento?: string;
  data_matricula?: string;
  responsavel_id?: number;
};

type Responsavel = {
  id: number;
  nome: string;
};

type Turma = {
  id: number;
  nome: string;
};

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    data_nascimento: "",
    data_matricula: new Date().toISOString().split("T")[0],
    responsavel_id: "",
    turma_ids: [] as number[],
  });

  useEffect(() => {
    loadAlunos();
    loadResponsaveis();
    loadTurmas();
  }, []);

  const loadAlunos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/api/alunos`);
      const data = await response.json();
      console.log("Alunos carregados:", data);
      setAlunos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar alunos:", err);
      setError("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  };

  const loadResponsaveis = async () => {
    try {
      const response = await fetch(`${apiBase}/api/responsaveis`);
      const data = await response.json();
      console.log("Responsáveis carregados:", data);
      setResponsaveis(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar responsáveis:", err);
    }
  };

  const loadTurmas = async () => {
    try {
      const response = await fetch(`${apiBase}/api/turmas`);
      const data = await response.json();
      console.log("Turmas carregadas:", data);
      setTurmas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar turmas:", err);
    }
  };

  const loadAlunoDetalhes = async (id: number) => {
    try {
      const response = await fetch(`${apiBase}/api/alunos/${id}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar detalhes do aluno");
      }
      return await response.json();
    } catch (err) {
      console.error("Falha ao buscar detalhes do aluno:", err);
      return null;
    }
  };

  const formatDateValue = (value?: string | null) => {
    if (!value) return "";
    if (value.includes("T")) return value.split("T")[0];
    if (value.includes(" ")) return value.split(" ")[0];
    return value;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTurmaToggle = (id: number) => {
    setFormData((prev) => {
      const exists = prev.turma_ids.includes(id);
      const turma_ids = exists ? prev.turma_ids.filter((turmaId) => turmaId !== id) : [...prev.turma_ids, id];
      return { ...prev, turma_ids };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!editingId && formData.turma_ids.length === 0) {
      setError("Selecione ao menos uma turma ativa para matricular o aluno.");
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        ...formData,
        responsavel_id: formData.responsavel_id ? Number(formData.responsavel_id) : null,
        status: "ATIVO",
      };

      if (!editingId) {
        payload.turma_ids = formData.turma_ids;
      } else if (formData.turma_ids.length > 0) {
        payload.turma_ids = formData.turma_ids;
      }

      const url = editingId ? `${apiBase}/api/alunos/${editingId}` : `${apiBase}/api/alunos`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar aluno");
      }

      setSuccess(true);
      resetForm();
      await loadAlunos();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMsg);
      console.error("Erro ao salvar:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      cpf: "",
      telefone: "",
      email: "",
      data_nascimento: "",
      data_matricula: new Date().toISOString().split("T")[0],
      responsavel_id: "",
      turma_ids: [],
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = async (aluno: Aluno) => {
    const detalhes = await loadAlunoDetalhes(aluno.id);
    if (!detalhes) {
      setError("Não foi possível carregar os dados do aluno para edição.");
      return;
    }

    setFormData({
      nome: detalhes.nome || "",
      cpf: detalhes.cpf || "",
      telefone: detalhes.telefone || "",
      email: detalhes.email || "",
      data_nascimento: detalhes.data_nascimento || "",
      data_matricula: detalhes.data_matricula || "",
      responsavel_id: detalhes.responsavel_id?.toString() || "",
      turma_ids: Array.isArray(detalhes.turma_ids) ? detalhes.turma_ids : [],
    });
    setEditingId(aluno.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja inativar este aluno?")) return;

    try {
      const response = await fetch(`${apiBase}/api/alunos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao inativar aluno");
      }

      setSuccess(true);
      await loadAlunos();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao inativar";
      setError(errorMsg);
      console.error("Erro ao inativar:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Alunos</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Gestão de Matrículas</h1>
          </div>
          <Link
            href="/funcionarios"
            className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]"
          >
            Voltar
          </Link>
        </div>

        {success && <div className="mb-6 rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">Operação realizada com sucesso!</div>}
        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

        {/* Listagem de Alunos */}
        <div className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Lista</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Alunos Matriculados ({alunos.length})</h2>
            </div>
            <button
              onClick={() => (showForm && !editingId ? resetForm() : setShowForm(!showForm))}
              className="inline-flex items-center rounded-full border border-[#E61E4D] bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A]"
            >
              {showForm ? "Fechar" : "+ Nova Matrícula"}
            </button>
          </div>

          {loading && alunos.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando alunos...</p>
          ) : alunos.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhum aluno matriculado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Nome</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">CPF</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Email</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Matrícula</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {alunos.map((aluno) => (
                    <tr key={aluno.id} className="bg-white hover:bg-[#F2F2F2]">
                      <td className="px-4 py-4 font-medium">{aluno.nome}</td>
                      <td className="px-4 py-4">{aluno.cpf}</td>
                      <td className="px-4 py-4">{aluno.email}</td>
                      <td className="px-4 py-4">{formatDateValue(aluno.data_matricula) || "-"}</td>
                      <td className="px-4 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(aluno)}
                          className="text-xs rounded-full bg-[#6A4FBF]/10 px-3 py-1 text-[#6A4FBF] hover:bg-[#6A4FBF]/20 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(aluno.id)}
                          className="text-xs rounded-full bg-[#E61E4D]/10 px-3 py-1 text-[#E61E4D] hover:bg-[#E61E4D]/20 transition"
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
        </div>

        {/* Formulário de Nova/Editar Matrícula */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-[32px] border border-[#E5E7EB] bg-white p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-[#1F2A5A]">{editingId ? "Editar Matrícula" : "Nova Matrícula"}</h3>

            <div>
              <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Nome *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                placeholder="Nome completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1F2A5A] mb-2">CPF *</label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Telefone</label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                placeholder="aluno@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Data de Nascimento *</label>
                <input
                  type="date"
                  name="data_nascimento"
                  value={formData.data_nascimento}
                  onChange={handleChange}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Data da Matrícula *</label>
                <input
                  type="date"
                  name="data_matricula"
                  value={formData.data_matricula}
                  onChange={handleChange}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Responsável</label>
              <select
                name="responsavel_id"
                value={formData.responsavel_id}
                onChange={handleChange}
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
              >
                <option value="">Selecionar responsável</option>
                {responsaveis.map((resp) => (
                  <option key={resp.id} value={resp.id}>
                    {resp.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <p className="text-sm font-medium text-[#1F2A5A] mb-3">Turmas *</p>
              {turmas.length === 0 ? (
                <p className="text-sm text-[#2B2B2B]/70">Nenhuma turma ativa disponível.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {turmas.map((turma) => (
                    <label
                      key={turma.id}
                      className="flex cursor-pointer items-center gap-3 rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 transition hover:border-[#6A4FBF]"
                    >
                      <input
                        type="checkbox"
                        checked={formData.turma_ids.includes(turma.id)}
                        onChange={() => handleTurmaToggle(turma.id)}
                        className="h-4 w-4 rounded border-[#6A4FBF] text-[#6A4FBF] focus:ring-[#6A4FBF]"
                      />
                      <span className="text-sm text-[#2B2B2B]">{turma.nome}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50"
              >
                {loading ? "Salvando..." : editingId ? "Atualizar" : "Realizar Matrícula"}
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
