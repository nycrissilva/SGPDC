"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Professor = {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  status?: string;
  modalidade?: string;
};

export default function ProfessoresPage() {
  const [professores, setProfessores] = useState<Professor[]>([]);
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
    modalidade: "",
  });

  useEffect(() => {
    loadProfessores();
  }, []);

  const loadProfessores = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5001/api/professores");
      const data = await response.json();
      console.log("Professores carregados:", data);
      setProfessores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar professores:", err);
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

      const url = editingId ? `http://localhost:5001/api/professores/${editingId}` : "http://localhost:5001/api/professores";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao salvar professor");
      }

      setSuccess(true);
      resetForm();
      await loadProfessores();
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
      modalidade: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (professor: Professor) => {
    setFormData({
      nome: professor.nome || "",
      cpf: professor.cpf || "",
      telefone: professor.telefone || "",
      email: professor.email || "",
      modalidade: professor.modalidade || "",
    });
    setEditingId(professor.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja inativar este professor?")) return;

    try {
      const response = await fetch(`http://localhost:5001/api/professores/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao inativar professor");
      }

      setSuccess(true);
      await loadProfessores();
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
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Professores</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Gestão de Professores</h1>
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

        {/* Listagem de Professores */}
        <div className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Lista</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Professores Cadastrados ({professores.length})</h2>
            </div>
            <button
              onClick={() => (showForm && !editingId ? resetForm() : setShowForm(!showForm))}
              className="inline-flex items-center rounded-full border border-[#E61E4D] bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A]"
            >
              {showForm ? "Fechar" : "+ Novo Professor"}
            </button>
          </div>

          {loading && professores.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando professores...</p>
          ) : professores.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhum professor cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Nome</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">CPF</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Email</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Modalidade</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {professores.map((professor) => (
                    <tr key={professor.id} className="bg-white hover:bg-[#F2F2F2]">
                      <td className="px-4 py-4 font-medium">{professor.nome}</td>
                      <td className="px-4 py-4">{professor.cpf}</td>
                      <td className="px-4 py-4">{professor.email}</td>
                      <td className="px-4 py-4">{professor.modalidade || "-"}</td>
                      <td className="px-4 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(professor)}
                          className="text-xs rounded-full bg-[#6A4FBF]/10 px-3 py-1 text-[#6A4FBF] hover:bg-[#6A4FBF]/20 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(professor.id)}
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

        {/* Formulário de Novo Professor */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-[32px] border border-[#E5E7EB] bg-white p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-semibold text-[#1F2A5A]">{editingId ? "Editar Professor" : "Novo Professor"}</h3>

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
                placeholder="professor@example.com"
              />
            </div>

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
                <option value="DANÇA_CLÁSSICA">Dança Clássica</option>
                <option value="DANÇA_MODERNA">Dança Moderna</option>
                <option value="JAZZ">Jazz</option>
                <option value="HIP_HOP">Hip Hop</option>
                <option value="CONTEMPORÂNEA">Contemporânea</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50"
              >
                {loading ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar Professor"}
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
