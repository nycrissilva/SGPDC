"use client";

import AuthGuard from "@/components/AuthGuard";

export default function ProfessoresLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Programa</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Área de Professores</h1>
          </div>

          <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">{children}</section>
        </main>
      </div>
    </AuthGuard>
  );
}
