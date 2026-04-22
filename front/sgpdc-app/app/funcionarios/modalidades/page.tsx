"use client";

import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

type Modalidade = {
  id: number;
  nome: string;
  status: "ATIVA" | "INATIVA";
  turmas_ativas: number;
};

export default function ModalidadesPage() {
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    status: "ATIVA",
  });

  useEffect(() => {
    loadModalidades();
  }, []);

  const loadModalidades = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/modalidades");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar modalidades");
      }
      setModalidades(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar modalidades");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nome: "", status: "ATIVA" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const path = editingId ? `/api/modalidades/${editingId}` : "/api/modalidades";
      const method = editingId ? "PUT" : "POST";

      const response = await apiFetch(path, {
        method,
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar modalidade");
      }

      setSuccess(editingId ? "Modalidade atualizada com sucesso." : "Modalidade cadastrada com sucesso.");
      resetForm();
      await loadModalidades();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar modalidade");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (modalidade: Modalidade) => {
    setFormData({
      nome: modalidade.nome,
      status: modalidade.status,
    });
    setEditingId(modalidade.id);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (modalidade: Modalidade) => {
    let path = `/api/modalidades/${modalidade.id}`;

    try {
      const response = await apiFetch(path, { method: "DELETE" });
      const result = await response.json();

      if (response.status === 409 && result?.confirmacaoNecessaria) {
        const confirmou = window.confirm(
          `A modalidade está vinculada a ${result.turmasAtivas} turma(s) ativa(s). Deseja inativar mesmo assim?`
        );
        if (!confirmou) return;

        path = `/api/modalidades/${modalidade.id}?confirmar=true`;
        const confirmedResponse = await apiFetch(path, { method: "DELETE" });
        const confirmedResult = await confirmedResponse.json();
        if (!confirmedResponse.ok) {
          throw new Error(confirmedResult.error || "Erro ao inativar modalidade");
        }
      } else if (!response.ok) {
        throw new Error(result.error || "Erro ao inativar modalidade");
      }

      setSuccess("Modalidade inativada com sucesso.");
      await loadModalidades();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao inativar modalidade");
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Modalidades</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Gestão de Modalidades</h1>
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
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Modalidades cadastradas ({modalidades.length})</h2>
            </div>
            <button
              onClick={() => (showForm && !editingId ? resetForm() : setShowForm(!showForm))}
              className="inline-flex items-center rounded-full border border-[#E61E4D] bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A]"
            >
              {showForm ? "Fechar" : "+ Nova Modalidade"}
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando modalidades...</p>
          ) : modalidades.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhuma modalidade cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Nome</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Status</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Turmas ativas</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {modalidades.map((modalidade) => (
                    <tr key={modalidade.id} className="bg-white hover:bg-[#F2F2F2]">
                      <td className="px-4 py-4 font-medium">{modalidade.nome}</td>
                      <td className="px-4 py-4">{modalidade.status}</td>
                      <td className="px-4 py-4">{modalidade.turmas_ativas}</td>
                      <td className="flex gap-2 px-4 py-4">
                        <button
                          onClick={() => handleEdit(modalidade)}
                          className="rounded-full bg-[#6A4FBF]/10 px-3 py-1 text-xs text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20"
                        >
                          Editar
                        </button>
                        {modalidade.status === "ATIVA" && (
                          <button
                            onClick={() => handleDelete(modalidade)}
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
            <h3 className="text-lg font-semibold text-[#1F2A5A]">{editingId ? "Editar Modalidade" : "Nova Modalidade"}</h3>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Nome da modalidade *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                required
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                placeholder="Ex: Ballet, Jazz, Hip Hop"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as "ATIVA" | "INATIVA" }))}
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
              >
                <option value="ATIVA">Ativa</option>
                <option value="INATIVA">Inativa</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50"
              >
                {saving ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar Modalidade"}
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
