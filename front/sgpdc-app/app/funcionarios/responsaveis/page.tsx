"use client";

import { apiFetch, apiBase } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";

type Responsavel = {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  status?: string;
  parentesco?: string;
};

export default function ResponsaveisPage() {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
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
    parentesco: "",
  });

  useEffect(() => {
    loadResponsaveis();
  }, []);

  const loadResponsaveis = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/responsaveis`);
      const data = await response.json();
      console.log("Responsáveis carregados:", data);
      setResponsaveis(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar responsáveis:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        status: "ATIVO",
      };

      const path = editingId ? `/api/responsaveis/${editingId}` : `/api/responsaveis`;
      const method = editingId ? "PUT" : "POST";

      const response = await apiFetch(path, {
        method,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar responsável");
      }

      setSuccess(true);
      resetForm();
      await loadResponsaveis();
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
      parentesco: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (responsavel: Responsavel) => {
    setFormData({
      nome: responsavel.nome || "",
      cpf: responsavel.cpf || "",
      telefone: responsavel.telefone || "",
      email: responsavel.email || "",
      parentesco: responsavel.parentesco || "",
    });
    setEditingId(responsavel.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja inativar este responsável?")) return;

    try {
      const response = await apiFetch(`/api/responsaveis/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao inativar responsável");
      }

      setSuccess(true);
      await loadResponsaveis();
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
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Responsáveis</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Gestão de Responsáveis</h1>
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

        {/* Listagem de Responsáveis */}
        <div className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Lista</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Responsáveis Cadastrados ({responsaveis.length})</h2>
            </div>
            <button
              onClick={() => (showForm && !editingId ? resetForm() : setShowForm(!showForm))}
              className="inline-flex items-center rounded-full border border-[#E61E4D] bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A]"
            >
              {showForm ? "Fechar" : "+ Novo Responsável"}
            </button>
          </div>

          {loading && responsaveis.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando responsáveis...</p>
          ) : responsaveis.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhum responsável cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Nome</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">CPF</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Email</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Parentesco</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {responsaveis.map((responsavel) => (
                    <tr key={responsavel.id} className="bg-white hover:bg-[#F2F2F2]">
                      <td className="px-4 py-4 font-medium">{responsavel.nome}</td>
                      <td className="px-4 py-4">{responsavel.cpf}</td>
                      <td className="px-4 py-4">{responsavel.email}</td>
                      <td className="px-4 py-4">{responsavel.parentesco || "-"}</td>
                      <td className="px-4 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(responsavel)}
                          className="text-xs rounded-full bg-[#6A4FBF]/10 px-3 py-1 text-[#6A4FBF] hover:bg-[#6A4FBF]/20 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(responsavel.id)}
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

        {/* Formulário de Novo Responsável */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-[32px] border border-[#E5E7EB] bg-white p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-[#1F2A5A]">{editingId ? "Editar Responsável" : "Novo Responsável"}</h3>

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
                placeholder="responsavel@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1F2A5A] mb-2">Parentesco *</label>
              <select
                name="parentesco"
                value={formData.parentesco}
                onChange={handleChange}
                required
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
              >
                <option value="">Selecionar parentesco</option>
                <option value="PAI">Pai</option>
                <option value="MÃE">Mãe</option>
                <option value="AVÓPATERNA">Avó Paterna</option>
                <option value="AVÔPATERNO">Avô Paterno</option>
                <option value="AVÓMATERNA">Avó Materna</option>
                <option value="AVÔMATERNO">Avô Materno</option>
                <option value="TIO">Tio</option>
                <option value="TIA">Tia</option>
                <option value="TUTOR">Tutor</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50"
              >
                {loading ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar Responsável"}
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
