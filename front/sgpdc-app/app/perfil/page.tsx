"use client";

import AuthGuard from "@/components/AuthGuard";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PerfilPage() {
  const [formData, setFormData] = useState({ email: "", telefone: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    void loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/auth/profile");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar perfil");
      setFormData((prev) => ({ ...prev, email: data.email || "", telefone: data.telefone || "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar perfil");
      setSuccess(true);
      setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white px-4 py-10 text-[#2B2B2B]">
        <main className="mx-auto max-w-2xl rounded-[32px] border border-[#E5E7EB] bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Usuário</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Meu Perfil</h1>
            </div>
            <Link href="/funcionarios" className="rounded-full border border-[#1F2A5A] px-5 py-3 text-sm font-semibold text-[#1F2A5A] hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
              Voltar
            </Link>
          </div>
          {loading ? <p className="text-sm text-[#4B5563]">Carregando...</p> : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}
              {success && <div className="rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">Perfil atualizado com sucesso.</div>}
              <Field label="E-mail" type="email" value={formData.email} onChange={(value) => setFormData((prev) => ({ ...prev, email: value }))} required />
              <Field label="Número" type="tel" value={formData.telefone} onChange={(value) => setFormData((prev) => ({ ...prev, telefone: value }))} />
              <Field label="Senha atual" type="password" value={formData.currentPassword} onChange={(value) => setFormData((prev) => ({ ...prev, currentPassword: value }))} />
              <Field label="Nova senha" type="password" value={formData.newPassword} onChange={(value) => setFormData((prev) => ({ ...prev, newPassword: value }))} />
              <Field label="Confirmar nova senha" type="password" value={formData.confirmPassword} onChange={(value) => setFormData((prev) => ({ ...prev, confirmPassword: value }))} />
              <button type="submit" disabled={saving} className="w-full rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">
                {saving ? "Salvando..." : "Salvar perfil"}
              </button>
            </form>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20" />
    </div>
  );
}
