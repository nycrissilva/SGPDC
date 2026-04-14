"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiBase } from "@/lib/api";

type Responsavel = {
  id: number;
  nome: string;
};

type Turma = {
  id: number;
  nome: string;
};

export default function CadastroAlunoPage() {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(false);
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
  });

  useEffect(() => {
    async function loadResponsaveis() {
      try {
        const response = await fetch(`${apiBase}/api/responsaveis`);
        if (response.ok) {
          const data = await response.json();
          setResponsaveis(data);
        }
      } catch (err) {
        console.log("Erro ao carregar responsáveis");
      }
    }

    async function loadTurmas() {
      try {
        const response = await fetch(`${apiBase}/api/turmas`);
        if (response.ok) {
          const data = await response.json();
          setTurmas(data);
        }
      } catch (err) {
        console.log("Erro ao carregar turmas");
      }
    }

    loadResponsaveis();
    loadTurmas();
  }, []);

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

    if (formData.turma_ids.length === 0) {
      setError("Selecione ao menos uma turma para matricular o aluno.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        responsavel_id: formData.responsavel_id ? Number(formData.responsavel_id) : null,
        turma_ids: formData.turma_ids,
      };

      const response = await fetch(`${apiBase}/api/alunos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Cadastro</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Novo Aluno / Matrícula</h1>
          </div>
          <Link
            href="/alunos"
            className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]"
          >
            Voltar
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[32px] border border-[#E5E7EB] bg-white p-8 shadow-sm space-y-6">
          {error && <div className="rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}
          {success && <div className="rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">Aluno cadastrado com sucesso!</div>}

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

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50"
          >
            {loading ? "Cadastrando..." : "Cadastrar Aluno"}
          </button>
        </form>
      </main>
    </div>
  );
}
