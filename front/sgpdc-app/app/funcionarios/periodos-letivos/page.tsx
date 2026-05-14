"use client";

import { apiFetch } from "@/lib/api";
import { formatDateBR } from "@/lib/format";
import Link from "next/link";
import { useEffect, useState } from "react";

type PeriodoLetivo = {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
};

const initialForm = {
  id: null as number | null,
  nome: "",
  data_inicio: "",
  data_fim: "",
};

function formatDate(date: string) {
  return formatDateBR(date);
}

export default function PeriodosLetivosPage() {
  const [periodos, setPeriodos] = useState<PeriodoLetivo[]>([]);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadPeriodos();
  }, []);

  const loadPeriodos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch("/api/periodos-letivos");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar períodos letivos");
      }

      const loadedPeriodos = Array.isArray(data) ? data : [];
      setPeriodos(loadedPeriodos);
      const ativo = loadedPeriodos.find((item: PeriodoLetivo) => item.ativo);
      if (ativo) {
        setFormData({
          id: ativo.id,
          nome: ativo.nome,
          data_inicio: ativo.data_inicio,
          data_fim: ativo.data_fim,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar períodos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiFetch("/api/periodos-letivos", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar período letivo");
      }

      setSuccess("Período letivo ativo salvo com sucesso.");
      await loadPeriodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao salvar período");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Calendário</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Período Letivo</h1>
            <p className="mt-2 max-w-xl text-sm text-[#4B5563]">
              O período ativo define quais datas aparecem para os professores lançarem chamada.
            </p>
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

        <form onSubmit={handleSubmit} className="mb-8 space-y-6 rounded-[32px] border border-[#E5E7EB] bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[#1F2A5A]">Definir período ativo</h2>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Nome *</label>
            <input
              value={formData.nome}
              onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
              required
              className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
              placeholder="Ex: 1º semestre de 2026"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Data inicial *</label>
              <input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData((prev) => ({ ...prev, data_inicio: e.target.value }))}
                required
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Data final *</label>
              <input
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData((prev) => ({ ...prev, data_fim: e.target.value }))}
                required
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {saving ? "Salvando..." : "Salvar período ativo"}
          </button>
        </form>

        <div className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Histórico</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Períodos cadastrados</h2>
          </div>

          {loading ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando períodos...</p>
          ) : periodos.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhum período letivo cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Nome</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Período</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Status</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {periodos.map((periodoLetivo) => (
                    <tr key={periodoLetivo.id} className="bg-white hover:bg-[#F2F2F2]">
                      <td className="px-4 py-4 font-medium text-[#1F2A5A]">{periodoLetivo.nome}</td>
                      <td className="px-4 py-4">
                        {formatDate(periodoLetivo.data_inicio)} a {formatDate(periodoLetivo.data_fim)}
                      </td>
                      <td className="px-4 py-4">{periodoLetivo.ativo ? "Ativo" : "Inativo"}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              id: periodoLetivo.id,
                              nome: periodoLetivo.nome,
                              data_inicio: periodoLetivo.data_inicio,
                              data_fim: periodoLetivo.data_fim,
                            })
                          }
                          className="rounded-full bg-[#6A4FBF]/10 px-3 py-1 text-xs text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20"
                        >
                          Editar/ativar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
