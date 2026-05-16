"use client";

import AuthGuard from "@/components/AuthGuard";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type MenuItem = {
  href: string;
  label: string;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    title: "Pessoas",
    items: [
      { href: "/funcionarios/alunos", label: "Alunos" },
      { href: "/funcionarios/responsaveis", label: "Responsáveis" },
      { href: "/funcionarios/professores", label: "Professores" },
      { href: "/funcionarios/funcionarioGerenciar", label: "Funcionários" },
    ],
  },
  {
    title: "Estrutura da Escola",
    items: [
      { href: "/funcionarios/modalidades", label: "Modalidades" },
      { href: "/funcionarios/locais", label: "Locais" },
      { href: "/funcionarios/periodos-letivos", label: "Período Letivo" },
    ],
  },
  {
    title: "Turmas",
    items: [
      { href: "/funcionarios/turmas", label: "Turmas" },
      { href: "/funcionarios/turmas", label: "Alocar Turma" },
      { href: "/funcionarios/turmas", label: "Agenda" },
      { href: "/funcionarios/relatorios/presencas", label: "Presenças" },
    ],
  },
  {
    title: "Mensalidades",
    items: [
      { href: "/funcionarios/planos-mensalidade", label: "Planos de Mensalidade" },
      { href: "/funcionarios/mensalidades", label: "Mensalidades" },
      { href: "/funcionarios/mensalidades", label: "Quitar Mensalidades" },
    ],
  },
  {
    title: "Espetáculos",
    items: [
      { href: "/funcionarios/espetaculos", label: "Espetáculos" },
      { href: "/funcionarios/coreografias", label: "Coreografias" },
      { href: "/funcionarios/cobranca-fantasia", label: "Cobrança de Fantasia" },
    ],
  },
  {
    title: "Vendas",
    items: [
      { href: "/funcionarios/produtos", label: "Produtos" },
      { href: "/funcionarios/vendas", label: "Vendas" },
    ],
  },
  {
    title: "Despesas",
    items: [
      { href: "/funcionarios/despesas", label: "Despesas" },
      { href: "/funcionarios/despesas", label: "Quitar Despesas" },
    ],
  },
  {
    title: "Relatórios",
    items: [
      { href: "/funcionarios/relatorios/turmas", label: "Relatório de Turmas" },
      { href: "/funcionarios/relatorios/presencas", label: "Relatório de Presença" },
      { href: "/funcionarios/mensalidades", label: "Relatório de Mensalidades" },
      { href: "/funcionarios/relatorios/receitas-despesas", label: "Relatório de Receitas e Despesas" },
      { href: "/funcionarios/relatorios/dre", label: "DRE" },
    ],
  },
];

export default function FuncionariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => (
    Object.fromEntries(menuGroups.map((group) => [
      group.title,
      group.items.some((item) => isActivePath(pathname, item.href)),
    ]))
  ));

  const toggleGroup = (title: string) => {
    setOpenGroups((current) => ({ ...current, [title]: !current[title] }));
  };

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/");
  };

  return (
    <AuthGuard>
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

          <div className="mt-8 lg:grid lg:gap-8" style={{ gridTemplateColumns: "280px 1fr" }}>
            <aside className={`${menuOpen ? "block" : "hidden"} rounded-[32px] border border-[#E5E7EB] bg-[#F2F2F2] p-6 shadow-sm lg:block`}>
              <div className="flex h-full flex-col gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Navegação</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#1F2A5A]">Menu</h2>
                </div>

                <Link
                  href="/funcionarios"
                  className={`block rounded-3xl border px-4 py-3 text-sm font-semibold transition ${pathname === "/funcionarios" ? "border-[#6A4FBF] bg-[#6A4FBF]/10 text-[#6A4FBF]" : "border-transparent bg-white text-[#1F2A5A] hover:border-[#6A4FBF]"}`}
                >
                  Página inicial
                </Link>

                <nav className="flex max-h-[62vh] flex-col gap-3 overflow-y-auto pr-1">
                  {menuGroups.map((group) => {
                    const groupOpen = Boolean(openGroups[group.title]);
                    const groupActive = group.items.some((item) => isActivePath(pathname, item.href));

                    return (
                      <div
                        key={group.title}
                        className={`rounded-[24px] border p-2 transition ${groupOpen || groupActive ? "border-[#6A4FBF]/40 bg-white shadow-sm" : "border-transparent bg-white/70"}`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.title)}
                          className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left text-sm font-semibold transition ${groupOpen || groupActive ? "text-[#6A4FBF]" : "text-[#1F2A5A] hover:text-[#6A4FBF]"}`}
                        >
                          <span>{group.title}</span>
                          <span className="block h-2 w-2 border-b-2 border-r-2 border-current transition" style={{ transform: groupOpen ? "rotate(225deg)" : "rotate(45deg)" }} />
                        </button>

                        {groupOpen && (
                          <div className="mt-2 flex flex-col gap-1">
                            {group.items.map((item, index) => {
                              const active = isActivePath(pathname, item.href);

                              return (
                                <Link
                                  key={`${group.title}-${item.href}-${index}`}
                                  href={item.href}
                                  className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${active ? "border-[#E61E4D]/30 bg-[#E61E4D]/10 text-[#E61E4D]" : "border-transparent bg-[#F9FAFB] text-[#1F2A5A] hover:border-[#6A4FBF] hover:bg-white"}`}
                                >
                                  {item.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-[#1F2A5A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6A4FBF]"
                >
                  Sair
                </button>
              </div>
            </aside>

            <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm lg:min-h-[600px]">
              {children}
            </section>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/funcionarios") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
