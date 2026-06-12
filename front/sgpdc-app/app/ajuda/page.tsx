"use client";

import AuthGuard from "@/components/AuthGuard";
import TourGuia from "@/components/TourGuia";
import { apiFetch } from "@/lib/api";
import { categoriasAjuda, itensAjuda, type PerfilAjuda } from "@/lib/ajuda";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const centralTour = [
  { element: '[data-help="central-busca"]', popover: { title: "Busca", description: "Pesquise pelo nome, descrição ou caminho no menu." } },
  { element: '[data-help="central-categorias"]', popover: { title: "Categorias", description: "Filtre os conteúdos por área do sistema." } },
  { element: '[data-help="central-cards"]', popover: { title: "Funcionalidades", description: "Cada card explica a função, o caminho no menu e os perfis com acesso." } },
];

export default function CentralAjudaPage() {
  const [perfil, setPerfil] = useState<PerfilAjuda | null>(null);
  const [perfilCarregado, setPerfilCarregado] = useState(false);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => setPerfil(data?.user?.perfil || null))
      .catch(() => setPerfil(null))
      .finally(() => setPerfilCarregado(true));
  }, []);

  const itensVisiveis = useMemo(() => {
    if (!perfil) return [];
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return itensAjuda.filter((item) => {
      if (perfil && !item.perfis.includes(perfil)) return false;
      if (categoria !== "Todas" && item.categoria !== categoria) return false;
      if (!termo) return true;
      return [item.titulo, item.descricao, item.caminhoMenu, item.categoria]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(termo);
    });
  }, [busca, categoria, perfil]);

  const inicio = perfil === "PROFESSOR" ? "/professores" : "/funcionarios";

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#F9FAFB] px-4 py-10 text-[#2B2B2B] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Suporte</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#1F2A5A]">Central de Ajuda</h1>
              <p className="mt-3 max-w-2xl text-sm text-[#4B5563]">Encontre orientações rápidas sobre as funcionalidades disponíveis para o seu perfil.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <TourGuia passos={centralTour} />
              <Link href={inicio} className="inline-flex items-center rounded-full bg-[#1F2A5A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6A4FBF]">Voltar ao sistema</Link>
            </div>
          </div>

          <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div data-help="central-busca">
              <label htmlFor="busca-ajuda" className="text-sm font-semibold text-[#1F2A5A]">O que você precisa encontrar?</label>
              <input id="busca-ajuda" type="search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Ex.: matrícula, presença, DRE..." className="mt-2 w-full rounded-3xl border border-[#D1D5DB] bg-white px-5 py-3 text-sm outline-none transition focus:border-[#6A4FBF] focus:ring-2 focus:ring-[#6A4FBF]/15" />
            </div>

            <div data-help="central-categorias" className="mt-6 flex flex-wrap gap-2">
              {["Todas", ...categoriasAjuda].map((item) => (
                <button key={item} type="button" onClick={() => setCategoria(item)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${categoria === item ? "border-[#6A4FBF] bg-[#6A4FBF] text-white" : "border-[#E5E7EB] bg-white text-[#1F2A5A] hover:border-[#6A4FBF]"}`}>{item}</button>
              ))}
            </div>
          </section>

          <section data-help="central-cards" className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {itensVisiveis.map((item) => (
              <article key={item.id} className="flex flex-col rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6A4FBF]">{item.categoria}</span>
                <h2 className="mt-3 text-xl font-semibold text-[#1F2A5A]">{item.titulo}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-[#4B5563]">{item.descricao}</p>
                <dl className="mt-5 space-y-3 border-t border-[#E5E7EB] pt-4 text-sm">
                  <div><dt className="font-semibold text-[#1F2A5A]">Caminho no menu</dt><dd className="mt-1 text-[#4B5563]">{item.caminhoMenu}</dd></div>
                  <div><dt className="font-semibold text-[#1F2A5A]">Perfil</dt><dd className="mt-1 text-[#4B5563]">{item.perfis.map(formatarPerfil).join(", ")}</dd></div>
                </dl>
                <Link href={item.href} className="mt-5 inline-flex justify-center rounded-full border border-[#6A4FBF] px-4 py-2.5 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF] hover:text-white">Abrir funcionalidade</Link>
              </article>
            ))}
          </section>

          {!perfilCarregado && <div className="mt-8 rounded-[28px] border border-[#E5E7EB] bg-white p-10 text-center text-sm text-[#4B5563]">Carregando ajudas disponíveis para o seu perfil...</div>}
          {perfilCarregado && !perfil && <div className="mt-8 rounded-[28px] border border-[#E61E4D]/20 bg-white p-10 text-center text-sm text-[#E61E4D]">Não foi possível identificar seu perfil para carregar a Central de Ajuda.</div>}
          {perfil && itensVisiveis.length === 0 && <div className="mt-8 rounded-[28px] border border-dashed border-[#D1D5DB] bg-white p-10 text-center text-sm text-[#4B5563]">Nenhuma ajuda encontrada para os filtros informados.</div>}
        </div>
      </main>
    </AuthGuard>
  );
}

function formatarPerfil(perfil: PerfilAjuda) {
  if (perfil === "ADMIN") return "Administrador";
  if (perfil === "FUNCIONARIO") return "Funcionário";
  return "Professor";
}
