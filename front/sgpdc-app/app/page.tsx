import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1F2A5A] text-white p-6 flex flex-col">
        <h2 className="text-xl font-semibold mb-6">Menu de Navegação</h2>
        <nav className="flex flex-col space-y-4">
          <Link href="/" className="hover:bg-[#E61E4D] px-4 py-2 rounded transition">
            Início
          </Link>
          <Link href="/alunos" className="hover:bg-[#E61E4D] px-4 py-2 rounded transition">
            Alunos
          </Link>
          <Link href="/responsaveis" className="hover:bg-[#E61E4D] px-4 py-2 rounded transition">
            Responsáveis
          </Link>
          <Link href="/professores" className="hover:bg-[#E61E4D] px-4 py-2 rounded transition">
            Professores
          </Link>
          <Link href="/funcionarios" className="hover:bg-[#E61E4D] px-4 py-2 rounded transition">
            Funcionários
          </Link>
          {/* Adicione mais links conforme necessário */}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-4xl flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-[32px] bg-[#1F2A5A] p-6 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-[#F2F2F2]/80">Projeto Dança Comunidade</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Fazer Login</h1>
          </div>

          <div className="space-y-4 rounded-[32px] bg-white p-6 shadow-sm">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Email</label>
              <input
                type="text"
                placeholder="Digite seu e-mail "
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#2B2B2B] outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">Senha</label>
              <input
                type="password"
                placeholder="Digite sua senha"
                className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#2B2B2B] outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20"
              />
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A]"
            >
              Entrar
            </button>
            <p className="text-center text-sm text-[#6A4FBF]">Página de login visual apenas, sem autenticação.</p>
          </div>

          <div className="rounded-[32px] border border-[#E5E7EB] bg-[#FFFFFF] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#1F2A5A]">Acesso rápido</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link 
                href="/alunos"
                className="block rounded-3xl border border-[#E5E7EB] bg-[#F2F2F2] px-4 py-4 text-center text-sm font-semibold text-[#1F2A5A] transition hover:border-[#E61E4D] hover:bg-[#F04A6A]/10"
              >
                Alunos
              </Link>
              <Link 
                href="/responsaveis"
                className="block rounded-3xl border border-[#E5E7EB] bg-[#F2F2F2] px-4 py-4 text-center text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:bg-[#6A4FBF]/10"
              >
                Responsáveis
              </Link>
              <Link 
                href="/professores"
                className="block rounded-3xl border border-[#E5E7EB] bg-[#F2F2F2] px-4 py-4 text-center text-sm font-semibold text-[#1F2A5A] transition hover:border-[#E61E4D] hover:bg-[#F04A6A]/10"
              >
                Professores
              </Link>
              <Link 
                href="/funcionarios"
                className="block rounded-3xl border border-[#E5E7EB] bg-[#F2F2F2] px-4 py-4 text-center text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:bg-[#6A4FBF]/10"
              >
                Funcionários
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
