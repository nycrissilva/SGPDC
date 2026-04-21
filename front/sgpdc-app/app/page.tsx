"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, apiBase } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch(`/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Email ou senha inválidos");
        return;
      }

      if (data.user?.firstAccess) {
        router.push("/auth/change-password");
        return;
      }

      if (data.user?.perfil === "PROFESSOR") {
        router.push("/professores");
      } else if (data.user?.perfil === "FUNCIONARIO") {
        router.push("/funcionarios");
      } else {
        router.push("/");
      }
    } catch (error) {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <main className="w-full max-w-4xl space-y-6">
        <div className="rounded-[32px] bg-[#1F2A5A] p-6 text-white shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-[#F2F2F2]/80">Projeto Dança Comunidade</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Fazer Login</h1>
        </div>

        <div className="rounded-[32px] bg-white p-6 shadow-sm">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="Digite seu e-mail"
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#2B2B2B] outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Senha</label>
              <input
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                type="password"
                placeholder="Digite sua senha"
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#2B2B2B] outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
                required
              />
            </div>
            {error && <p className="text-sm text-[#E61E4D]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

 
      </main>
    </div>
  );
}
