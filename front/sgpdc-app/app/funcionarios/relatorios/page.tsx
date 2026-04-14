import Link from "next/link";

export default function RelatoriosPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-[32px] bg-[#1F2A5A] p-6 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-[#F2F2F2]/80">Relatórios</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Módulo de Relatórios</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#F8FAFC]/90">
          Emita relatórios de turmas com filtros por nível, professor e modalidade para apoiar a análise pedagógica.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/funcionarios/relatorios/turmas"
          className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 text-left shadow-sm transition hover:border-[#6A4FBF] hover:bg-[#F9FAFB]"
        >
          <p className="text-sm uppercase tracking-[0.22em] text-[#6A4FBF]">Relatório</p>
          <h2 className="mt-3 text-xl font-semibold text-[#1F2A5A]">Turmas</h2>
          <p className="mt-2 text-sm text-[#4B5563]">Filtre por nível, professor e modalidade para ver a organização atual das turmas.</p>
        </Link>
      </div>
    </div>
  );
}
