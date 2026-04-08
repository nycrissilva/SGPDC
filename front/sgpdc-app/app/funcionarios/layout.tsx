"use client";

import Link from "next/link";
import { useState } from "react";

export default function FuncionariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/funcionarios", label: "Página inicial" },
    { href: "/funcionarios/alunos", label: "Alunos" },
    { href: "/funcionarios/responsaveis", label: "Responsáveis" },
    { href: "/funcionarios/professores", label: "Professores" },
    { href: "/funcionarios/funcionarioGerenciar", label: "Funcionários" },
  ];

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto flex max-w-7xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Sistema</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Painel de Gestão</h1>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-4 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]"
          >
            {menuOpen ? "Fechar menu" : "Abrir menu"}
          </button>
        </div>

        <div className="mt-8 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
          <aside className={`${menuOpen ? "block" : "hidden"} rounded-[32px] border border-[#E5E7EB] bg-[#F2F2F2] p-6 shadow-sm lg:block`}>
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Navegação</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1F2A5A]">Menu</h2>
              </div>

              <div className="mt-2 space-y-2">
                <Link
                  href="/funcionarios"
                  className="block rounded-3xl border border-transparent bg-white px-4 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:bg-[#FFFFFF]"
                >
                  Página inicial
                </Link>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Gerenciar</p>
              </div>

              <nav className="flex flex-col gap-2">
                {navLinks.slice(1).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-3xl border border-transparent bg-white px-4 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:bg-[#FFFFFF]"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#1F2A5A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6A4FBF]"
                >
                  Sair
                </Link>
              </nav>
            </div>
          </aside>

          <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm lg:min-h-[600px]">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
