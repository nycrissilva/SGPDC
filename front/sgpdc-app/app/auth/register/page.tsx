"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, apiBase } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState("FUNCIONARIO");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("Cadastro isolado de usuário não é permitido. Usuários são criados automaticamente ao cadastrar um Funcionário ou um Professor.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl rounded-[32px] border border-[#E5E7EB] bg-[#F9FAFB] p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-[#1F2A5A]">Cadastrar usuário</h1>
        <p className="mt-2 text-sm text-[#4B5563]">
          Cadastro isolado não é permitido. Usuários são criados automaticamente ao cadastrar um Funcionário ou um Professor.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-[#1F2A5A]">Nome</span>
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                className="mt-2 w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#1F2A5A]">CPF</span>
              <input
                value={cpf}
                onChange={(event) => setCpf(event.target.value)}
                className="mt-2 w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#1F2A5A]">Telefone</span>
              <input
                value={telefone}
                onChange={(event) => setTelefone(event.target.value)}
                className="mt-2 w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#1F2A5A]">Perfil</span>
              <select
                value={perfil}
                onChange={(event) => setPerfil(event.target.value)}
                className="mt-2 w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none"
              >
                <option value="FUNCIONARIO">Funcionário</option>
                <option value="PROFESSOR">Professor</option>
                <option value="RESPONSAVEL">Responsável</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-[#1F2A5A]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#1F2A5A]">Senha</span>
            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none"
              required
            />
          </label>

          {error && <p className="text-sm text-[#E61E4D]">{error}</p>}

          <button
            type="submit"
            disabled
            className="w-full rounded-full bg-[#D1D5DB] px-5 py-3 text-sm font-semibold text-white cursor-not-allowed opacity-60"
          >
            Cadastro não disponível
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6A4FBF]">
          Já tem conta?{' '}
          <Link href="/" className="font-semibold text-[#1F2A5A] hover:text-[#6A4FBF]">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
