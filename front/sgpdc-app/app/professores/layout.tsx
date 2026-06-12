"use client";

import AuthGuard from "@/components/AuthGuard";
import AjudaDaPagina from "@/components/AjudaDaPagina";
import Link from "next/link";

export default function ProfessoresLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Programa</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Área de Professores</h1>
          </div>

          <nav className="mb-6 flex flex-wrap gap-3" aria-label="Menu da área do professor">
            <Link href="/professores" className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">Minha Agenda</Link>
            <Link href="/professores/presencas" className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">Registrar Presenças</Link>
            <Link href="/ajuda" className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">Central de Ajuda</Link>
          </nav>

          <section data-help-scope className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-4 flex justify-end"><AjudaDaPagina /></div>
            {children}
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
