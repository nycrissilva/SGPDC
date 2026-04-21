"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, apiBase } from "@/lib/api";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function verify() {
      try {
        const response = await apiFetch(`/api/auth/me`, {
          method: "GET",
        });

        if (!response.ok) {
          router.replace("/");
          return;
        }

        const data = await response.json();
        if (data?.user?.firstAccess) {
          router.replace("/auth/change-password");
          return;
        }

        const perfil = data?.user?.perfil;
        const currentPath = window.location.pathname;
        const isProfessorArea = currentPath.startsWith("/professores");
        const isFuncionarioArea = currentPath.startsWith("/funcionarios");

        if (perfil === "PROFESSOR" && isFuncionarioArea) {
          router.replace("/professores");
          return;
        }

        if (perfil === "FUNCIONARIO" && isProfessorArea) {
          router.replace("/funcionarios");
          return;
        }

        setChecking(false);
      } catch (error) {
        router.replace("/");
      }
    }

    verify();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-white text-[#2B2B2B] font-sans flex items-center justify-center">
        <div className="rounded-3xl border border-[#E5E7EB] bg-white p-8 shadow-sm text-center">
          <p className="text-lg font-semibold text-[#1F2A5A]">Verificando autenticação...</p>
          <p className="mt-2 text-sm text-[#4B5563]">Aguarde enquanto confirmamos sua sessão.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
