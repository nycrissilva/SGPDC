import Link from "next/link";

export default function FuncionariosPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-[32px] bg-[#1F2A5A] p-6 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-[#F2F2F2]/80">Sistema</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Painel de Gestão</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#F8FAFC]/90">
          Bem-vindo ao painel administrativo. Use o menu para gerenciar alunos, responsáveis, professores e funcionários.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/funcionarios/alunos"
          className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 text-left shadow-sm transition hover:border-[#6A4FBF] hover:bg-[#F9FAFB]"
        >
          <p className="text-sm uppercase tracking-[0.22em] text-[#6A4FBF]">Gerenciar</p>
          <h2 className="mt-3 text-xl font-semibold text-[#1F2A5A]">Alunos</h2>
          <p className="mt-2 text-sm text-[#4B5563]">Veja e cadastre alunos matriculados no sistema.</p>
        </Link>

        <Link
          href="/funcionarios/responsaveis"
          className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 text-left shadow-sm transition hover:border-[#6A4FBF] hover:bg-[#F9FAFB]"
        >
          <p className="text-sm uppercase tracking-[0.22em] text-[#6A4FBF]">Gerenciar</p>
          <h2 className="mt-3 text-xl font-semibold text-[#1F2A5A]">Responsáveis</h2>
          <p className="mt-2 text-sm text-[#4B5563]">Controle os responsáveis e seus dados de contato.</p>
        </Link>

        <Link
          href="/funcionarios/professores"
          className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 text-left shadow-sm transition hover:border-[#6A4FBF] hover:bg-[#F9FAFB]"
        >
          <p className="text-sm uppercase tracking-[0.22em] text-[#6A4FBF]">Gerenciar</p>
          <h2 className="mt-3 text-xl font-semibold text-[#1F2A5A]">Professores</h2>
          <p className="mt-2 text-sm text-[#4B5563]">Visualize e atualize dados dos professores.</p>
        </Link>

        <Link
          href="/funcionarios/funcionarioGerenciar"
          className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 text-left shadow-sm transition hover:border-[#6A4FBF] hover:bg-[#F9FAFB]"
        >
          <p className="text-sm uppercase tracking-[0.22em] text-[#6A4FBF]">Gerenciar</p>
          <h2 className="mt-3 text-xl font-semibold text-[#1F2A5A]">Funcionários</h2>
          <p className="mt-2 text-sm text-[#4B5563]">Adicione e atualize o cadastro de funcionários.</p>
        </Link>

        <Link
          href="/funcionarios/turmas"
          className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 text-left shadow-sm transition hover:border-[#6A4FBF] hover:bg-[#F9FAFB]"
        >
          <p className="text-sm uppercase tracking-[0.22em] text-[#6A4FBF]">Gerenciar</p>
          <h2 className="mt-3 text-xl font-semibold text-[#1F2A5A]">Turmas</h2>
          <p className="mt-2 text-sm text-[#4B5563]">Cadastre, edite e inative turmas com professores vinculados.</p>
        </Link>

        <Link
          href="/funcionarios/presencas"
          className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 text-left shadow-sm transition hover:border-[#6A4FBF] hover:bg-[#F9FAFB]"
        >
          <p className="text-sm uppercase tracking-[0.22em] text-[#6A4FBF]">Operações</p>
          <h2 className="mt-3 text-xl font-semibold text-[#1F2A5A]">Registrar Presença</h2>
          <p className="mt-2 text-sm text-[#4B5563]">Registre presença por turma e por data de aula.</p>
        </Link>

        <Link
          href="/funcionarios/relatorios"
          className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 text-left shadow-sm transition hover:border-[#6A4FBF] hover:bg-[#F9FAFB]"
        >
          <p className="text-sm uppercase tracking-[0.22em] text-[#6A4FBF]">Relatórios</p>
          <h2 className="mt-3 text-xl font-semibold text-[#1F2A5A]">Relatório de Turmas</h2>
          <p className="mt-2 text-sm text-[#4B5563]">Emita relatórios de turmas com filtros por nível, professor e modalidade.</p>
        </Link>
      </div>
    </div>
  );
}

