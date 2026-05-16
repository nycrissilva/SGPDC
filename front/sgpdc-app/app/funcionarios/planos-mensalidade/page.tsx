"use client";

import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

type TipoPlano = "INDIVIDUAL" | "COMBINADO" | "FAMILIAR";
type StatusPlano = "ATIVO" | "INATIVO";

type PlanoMensalidade = {
  id: number;
  nome: string;
  tipo_plano: TipoPlano;
  qtd_alunas: number;
  qtd_cursos: number;
  valor_cartao_pix: number;
  valor_dinheiro: number;
  status: StatusPlano;
  grupos_ativos: number;
};

const emptyForm = {
  nome: "",
  tipo_plano: "INDIVIDUAL" as TipoPlano,
  qtd_alunas: "1",
  qtd_cursos: "1",
  valor_cartao_pix: "",
  valor_dinheiro: "",
  status: "ATIVO" as StatusPlano,
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function PlanosMensalidadePage() {
  const [planos, setPlanos] = useState<PlanoMensalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadPlanos();
  }, []);

  const loadPlanos = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/planos-mensalidade");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar planos");
      setPlanos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const buildPayload = () => ({
    nome: formData.nome.trim(),
    tipo_plano: formData.tipo_plano,
    qtd_alunas: Number(formData.qtd_alunas),
    qtd_cursos: Number(formData.qtd_cursos),
    valor_cartao_pix: Number(formData.valor_cartao_pix),
    valor_dinheiro: Number(formData.valor_dinheiro),
    status: formData.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const path = editingId ? `/api/planos-mensalidade/${editingId}` : "/api/planos-mensalidade";
      const method = editingId ? "PUT" : "POST";
      const response = await apiFetch(path, {
        method,
        body: JSON.stringify(buildPayload()),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao salvar plano");

      setSuccess(editingId ? "Plano atualizado com sucesso." : "Plano cadastrado com sucesso.");
      resetForm();
      await loadPlanos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar plano");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (plano: PlanoMensalidade) => {
    setFormData({
      nome: plano.nome,
      tipo_plano: plano.tipo_plano,
      qtd_alunas: String(plano.qtd_alunas),
      qtd_cursos: String(plano.qtd_cursos),
      valor_cartao_pix: String(plano.valor_cartao_pix),
      valor_dinheiro: String(plano.valor_dinheiro),
      status: plano.status,
    });
    setEditingId(plano.id);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleInativar = async (plano: PlanoMensalidade) => {
    if (!window.confirm(`Deseja inativar o plano "${plano.nome}"?`)) return;

    try {
      setError(null);
      setSuccess(null);
      const response = await apiFetch(`/api/planos-mensalidade/${plano.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao inativar plano");
      setSuccess("Plano inativado com sucesso.");
      await loadPlanos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao inativar plano");
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Mensalidades</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Planos de Mensalidade</h1>
          </div>
          <Link href="/funcionarios" className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
            Voltar
          </Link>
        </div>

        {success && <div className="mb-6 rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">{success}</div>}
        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

        <div className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Lista</p>
              <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Planos cadastrados ({planos.length})</h2>
            </div>
            <button type="button" onClick={() => (showForm && !editingId ? resetForm() : setShowForm(!showForm))} className="inline-flex items-center rounded-full border border-[#E61E4D] bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A]">
              {showForm ? "Fechar" : "+ Novo Plano"}
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando planos...</p>
          ) : planos.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhum plano cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Nome</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Tipo</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Alunas</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Cursos</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Cartão/Pix</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Dinheiro</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Status</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {planos.map((plano) => (
                    <tr key={plano.id} className="bg-white hover:bg-[#F2F2F2]">
                      <td className="px-4 py-4 font-medium">{plano.nome}</td>
                      <td className="px-4 py-4">{plano.tipo_plano}</td>
                      <td className="px-4 py-4">{plano.qtd_alunas}</td>
                      <td className="px-4 py-4">{plano.qtd_cursos}</td>
                      <td className="px-4 py-4">{currency.format(plano.valor_cartao_pix)}</td>
                      <td className="px-4 py-4">{currency.format(plano.valor_dinheiro)}</td>
                      <td className="px-4 py-4">{plano.status}</td>
                      <td className="flex gap-2 px-4 py-4">
                        <button type="button" onClick={() => handleEdit(plano)} className="rounded-full bg-[#6A4FBF]/10 px-3 py-1 text-xs text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
                          Editar
                        </button>
                        {plano.status === "ATIVO" && (
                          <button type="button" onClick={() => handleInativar(plano)} className="rounded-full bg-[#E61E4D]/10 px-3 py-1 text-xs text-[#E61E4D] transition hover:bg-[#E61E4D]/20">
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
            <h3 className="text-lg font-semibold text-[#1F2A5A]">{editingId ? "Editar Plano" : "Novo Plano"}</h3>
            <div className="grid gap-5 md:grid-cols-2">
              <FormInput label="Nome do plano *" value={formData.nome} onChange={(value) => setFormData((prev) => ({ ...prev, nome: value }))} placeholder="Ex: Individual 1 curso" />
              <FormSelect label="Tipo do plano *" value={formData.tipo_plano} onChange={(value) => setFormData((prev) => ({ ...prev, tipo_plano: value as TipoPlano }))} options={[["INDIVIDUAL", "Individual"], ["COMBINADO", "Combinado"], ["FAMILIAR", "Familiar"]]} />
              <FormSelect label="Status" value={formData.status} disabled={!editingId} onChange={(value) => setFormData((prev) => ({ ...prev, status: value as StatusPlano }))} options={[["ATIVO", "Ativo"], ["INATIVO", "Inativo"]]} />
              <FormInput label="Quantidade de alunas *" type="number" min="1" step="1" value={formData.qtd_alunas} onChange={(value) => setFormData((prev) => ({ ...prev, qtd_alunas: value }))} />
              <FormInput label="Quantidade de cursos *" type="number" min="1" step="1" value={formData.qtd_cursos} onChange={(value) => setFormData((prev) => ({ ...prev, qtd_cursos: value }))} />
              <FormInput label="Valor para cartao/pix *" type="number" min="0" step="0.01" value={formData.valor_cartao_pix} onChange={(value) => setFormData((prev) => ({ ...prev, valor_cartao_pix: value }))} placeholder="0.00" />
              <FormInput label="Valor para dinheiro *" type="number" min="0" step="0.01" value={formData.valor_dinheiro} onChange={(value) => setFormData((prev) => ({ ...prev, valor_dinheiro: value }))} placeholder="0.00" />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">
                {saving ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar Plano"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
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

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  min,
  step,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <input
        type={type}
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        placeholder={placeholder}
        className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20 disabled:opacity-70"
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
