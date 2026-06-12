"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordField from "@/components/PasswordField";
import { apiFetch, setAuthToken } from "@/lib/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!oldPassword || !newPassword) {
      setError("Preencha a senha atual e a nova senha.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch(`/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Não foi possível alterar a senha.");
        return;
      }

      if (data.token) {
        setAuthToken(data.token);
      }

      setSuccess(true);
      setTimeout(async () => {
        try {
          const meResponse = await apiFetch(`/api/auth/me`, { method: "GET" });
          const meData = await meResponse.json();
          if (meData?.user?.perfil === "PROFESSOR") {
            router.push("/professores");
          } else {
            router.push("/funcionarios");
          }
        } catch {
          router.push("/");
        }
      }, 1200);
    } catch {
      setError("Erro ao alterar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl rounded-[32px] border border-[#E5E7EB] bg-[#F9FAFB] p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-[#1F2A5A]">Trocar senha</h1>
        <p className="mt-2 text-sm text-[#4B5563]">
          Esta é sua primeira vez no sistema. Use sua senha inicial (data de nascimento) e escolha uma nova senha segura com no mínimo 8 caracteres, letras e números.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <PasswordField
            label="Senha atual"
            surface="white"
            value={oldPassword}
            onChange={(event) => setOldPassword(event.target.value)}
            required
          />

          <PasswordField
            label="Nova senha"
            surface="white"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            minLength={6}
          />

          <PasswordField
            label="Confirmar nova senha"
            surface="white"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          {error && <p className="text-sm text-[#E61E4D]">{error}</p>}
          {success && <p className="text-sm text-[#16A34A]">Senha alterada com sucesso! Redirecionando...</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Alterar senha"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6A4FBF]">
          Lembrou a senha?{' '}
          <Link href="/" className="font-semibold text-[#1F2A5A] hover:text-[#6A4FBF]">
            Voltar para login
          </Link>
        </p>
      </div>
    </div>
  );
}
