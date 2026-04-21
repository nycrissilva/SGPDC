"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { apiFetch, apiBase } from "@/lib/api";

export default function ProfessoresLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await apiFetch(`/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    router.push("/");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Programa</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Área de Professores</h1>
            </div>

            <div className="flex gap-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]"
              >
                Voltar
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A]"
              >
                Sair
              </button>
            </div>
          </div>

          <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">{children}</section>
        </main>
      </div>
    </AuthGuard>
  );
}
