"use client";

import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

type Local = {
  id: number;
  nome: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  status: "ATIVO" | "INATIVO";
  turmas_ativas: number;
};

const initialForm = {
  nome: "",
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  status: "ATIVO" as "ATIVO" | "INATIVO",
};

export default function LocaisPage() {
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadLocais();
  }, []);

  const loadLocais = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/locais");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar locais");
      }
      setLocais(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar locais");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const path = editingId ? `/api/locais/${editingId}` : "/api/locais";
      const method = editingId ? "PUT" : "POST";

      const response = await apiFetch(path, {
        method,
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar local");
      }

      setSuccess(editingId ? "Local atualizado com sucesso." : "Local cadastrado com sucesso.");
      resetForm();
      await loadLocais();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar local");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (local: Local) => {
    setFormData({
      nome: local.nome,
      cep: local.cep,
      rua: local.rua,
      numero: local.numero,
      bairro: local.bairro,
      cidade: local.cidade,
      status: local.status,
    });
    setEditingId(local.id);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja inativar este local?")) return;

    try {
      const response = await apiFetch(`/api/locais/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erro ao inativar local");
      }

      setSuccess("Local inativado com sucesso.");
      await loadLocais();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao inativar local");
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Locais</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Gestão de Locais</h1>
          </div>
          <Link
            href="/funcionarios"
            className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]"
          >
            Voltar
          </Link>
        </div>

        {success && <div className="mb-6 rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">{success}</div>}
        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

        <div className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Lista</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Locais cadastrados ({locais.length})</h2>
            </div>
            <button
              onClick={() => (showForm && !editingId ? resetForm() : setShowForm(!showForm))}
              className="inline-flex items-center rounded-full border border-[#E61E4D] bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A]"
            >
              {showForm ? "Fechar" : "+ Novo Local"}
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando locais...</p>
          ) : locais.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhum local cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Nome</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Endereço</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Status</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Turmas ativas</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {locais.map((local) => (
                    <tr key={local.id} className="bg-white hover:bg-[#F2F2F2]">
                      <td className="px-4 py-4 font-medium">{local.nome}</td>
                      <td className="px-4 py-4">{`${local.rua}, ${local.numero} - ${local.bairro}, ${local.cidade}`}</td>
                      <td className="px-4 py-4">{local.status}</td>
                      <td className="px-4 py-4">{local.turmas_ativas}</td>
                      <td className="flex gap-2 px-4 py-4">
                        <button
                          onClick={() => handleEdit(local)}
                          className="rounded-full bg-[#6A4FBF]/10 px-3 py-1 text-xs text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20"
                        >
                          Editar
                        </button>
                        {local.status === "ATIVO" && (
                          <button
                            onClick={() => handleDelete(local.id)}
                            className="rounded-full bg-[#E61E4D]/10 px-3 py-1 text-xs text-[#E61E4D] transition hover:bg-[#E61E4D]/20"
                          >
                            Inativar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-[32px] border border-[#E5E7EB] bg-white p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-[#1F2A5A]">{editingId ? "Editar Local" : "Novo Local"}</h3>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Nome do local *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                required
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                placeholder="Ex: Sala 1, Quadra, Unidade Ana Jacinta"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">CEP *</label>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cep: e.target.value }))}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                  placeholder="00000-000"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Cidade *</label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cidade: e.target.value }))}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                  placeholder="Cidade"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Rua *</label>
                <input
                  type="text"
                  value={formData.rua}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rua: e.target.value }))}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                  placeholder="Rua"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Número *</label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData((prev) => ({ ...prev, numero: e.target.value }))}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                  placeholder="Número"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Bairro *</label>
                <input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bairro: e.target.value }))}
                  required
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                  placeholder="Bairro"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as "ATIVO" | "INATIVO" }))}
                  className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50"
              >
                {saving ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar Local"}
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
