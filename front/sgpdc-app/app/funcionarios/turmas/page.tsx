"use client";

import { apiBase } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";

const MODALIDADES = [
  { value: "DANÇA_CLÁSSICA", label: "Dança Clássica" },
  { value: "DANÇA_MODERNA", label: "Dança Moderna" },
  { value: "JAZZ", label: "Jazz" },
  { value: "HIP_HOP", label: "Hip Hop" },
  { value: "CONTEMPORÂNEA", label: "Contemporânea" },
];

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
  cpf?: string;
  email?: string;
  telefone?: string;
  status?: string;
};

type Turma = {
  id: number;
  nome: string;
  modalidade: string;
  nivel: string;
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  status: string;
  professor_ids: number[];
};

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    modalidade: "",
    nivel: "",
    dia_semana: "",
    horario_inicio: "",
    horario_fim: "",
    professor_ids: [] as number[],
    status: "ATIVA",
  });

  useEffect(() => {
    loadProfessores();
    loadTurmas();
  }, []);

  const loadProfessores = async () => {
    try {
      const response = await fetch(`${apiBase}/api/professores`);
      const data = await response.json();
      setProfessores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar professores:", err);
    }
  };

  const loadTurmas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/api/turmas`);
      const data = await response.json();
      setTurmas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar turmas:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      modalidade: "",
      nivel: "",
      dia_semana: "",
      horario_inicio: "",
      horario_fim: "",
      professor_ids: [],
      status: "ATIVA",
    });
    setEditingId(null);
    setShowForm(false);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfessorToggle = (id: number) => {
    setFormData((prev) => {
      const exists = prev.professor_ids.includes(id);
      const updated = exists
        ? prev.professor_ids.filter((professorId) => professorId !== id)
        : [...prev.professor_ids, id];
      return { ...prev, professor_ids: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (formData.professor_ids.length === 0) {
      setError("Selecione ao menos um professor.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        nome: formData.nome,
        modalidade: formData.modalidade,
        nivel: formData.nivel,
        dia_semana: formData.dia_semana,
        horario_inicio: formData.horario_inicio,
        horario_fim: formData.horario_fim,
        professor_ids: formData.professor_ids,
        status: formData.status,
      };

      const url = editingId
        ? `${apiBase}/api/turmas/${editingId}`
        : `${apiBase}/api/turmas`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar turma");
      }

      setSuccess(editingId ? "Turma atualizada com sucesso." : "Turma cadastrada com sucesso.");
      resetForm();
      await loadTurmas();
      setShowForm(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("Erro ao salvar turma:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (turma: Turma) => {
    setFormData({
      nome: turma.nome,
      modalidade: turma.modalidade,
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
      const response = await fetch(`${apiBase}/api/turmas/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Erro ao inativar turma");
      }
      setSuccess("Turma inativada com sucesso.");
      await loadTurmas();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("Erro ao inativar turma:", err);
    }
  };

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
              href="/funcionarios/relatorios/turmas"
              className="inline-flex items-center rounded-full border border-[#6A4FBF] bg-white px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#F9FAFB]"
            >
              Ver relatório
            </Link>
            <Link
              href="/funcionarios"
              className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]"
            >
              Voltar
            </Link>
          </div>
        </div>

        {success && (
          <div className="mb-6 rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">{success}</div>
        )}
        {error && (
          <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>
        )}

        <div className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Lista</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Turmas Cadastradas ({turmas.length})</h2>
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

          {loading && turmas.length === 0 ? (
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
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Nível</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Dia / Horário</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Professores</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {turmas.map((turma) => (
                    <tr key={turma.id} className="bg-white hover:bg-[#F2F2F2]">
                      <td className="px-4 py-4 font-medium">{turma.nome}</td>
                      <td className="px-4 py-4">{turma.modalidade}</td>
                      <td className="px-4 py-4">{turma.nivel}</td>
                      <td className="px-4 py-4">
                        {turma.dia_semana} <br /> {turma.horario_inicio} - {turma.horario_fim}
                      </td>
                      <td className="px-4 py-4">{turma.professor_ids?.length || 0}</td>
                      <td className="px-4 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(turma)}
                          className="text-xs rounded-full bg-[#6A4FBF]/10 px-3 py-1 text-[#6A4FBF] hover:bg-[#6A4FBF]/20 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(turma.id)}
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

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-[32px] border border-[#E5E7EB] bg-white p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-[#1F2A5A]">{editingId ? "Editar Turma" : "Cadastrar Turma"}</h3>

            <div>
              <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Nome da turma *</label>
              <input
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                placeholder="Nome da turma"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Modalidade *</label>
                <select
                  name="modalidade"
                  value={formData.modalidade}
                  onChange={handleChange}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                >
                  <option value="">Selecionar modalidade</option>
                  {MODALIDADES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Nível *</label>
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
                <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Dia da semana *</label>
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
                <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Horário de início *</label>
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
                <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Horário de fim *</label>
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
              <p className="text-sm font-medium text-[#1F2A5A] mb-3">Professores *</p>
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
                disabled={loading}
                className="flex-1 rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Salvando..." : editingId ? "Atualizar Turma" : "Cadastrar Turma"}
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
