"use client";

import { apiFetch } from "@/lib/api";
import PasswordField from "@/components/PasswordField";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [identificador, setIdentificador] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identificador, newPassword, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao redefinir senha");
      setSuccess(true);
      setIdentificador("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10 text-[#2B2B2B]">
      <main className="mx-auto max-w-xl rounded-[32px] border border-[#E5E7EB] bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Acesso</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Esqueci minha senha</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && <div className="rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}
          {success && <div className="rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">Senha redefinida com sucesso.</div>}
          <Field label="CPF ou e-mail" value={identificador} onChange={setIdentificador} required />
          <PasswordField label="Nova senha" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          <PasswordField label="Confirmar senha" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          <button type="submit" disabled={loading} className="w-full rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">
            {loading ? "Redefinindo..." : "Redefinir senha"}
          </button>
          <Link href="/" className="block text-center text-sm font-semibold text-[#1F2A5A] hover:text-[#6A4FBF]">
            Voltar ao login
          </Link>
        </form>
      </main>
    </div>
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
