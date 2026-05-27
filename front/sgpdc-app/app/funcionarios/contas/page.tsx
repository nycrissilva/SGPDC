"use client";

import SearchableSelect from "@/components/SearchableSelect";
import { apiFetch } from "@/lib/api";
import { formatDateBR } from "@/lib/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Turma = {
  id: number;
  nome: string;
  nivel?: string;
  modalidade?: string;
};

type Pessoa = {
  id: number;
  nome: string;
};

type Aluno = Pessoa & {
  cpf?: string;
  email?: string;
  responsavel_id?: number;
  responsavel_nome?: string;
  turmas?: Turma[];
  resumo_mensalidades?: {
    total: number;
    pagas: number;
    em_aberto: number;
    atrasadas: number;
  };
  resumo_fantasias?: {
    total: number;
    pagas: number;
    em_aberto: number;
    atrasadas: number;
  };
};

type Conta = {
  id: number | string;
  prevista?: boolean;
  tipo_receita?: string;
  mes_referencia?: number | null;
  ano_referencia?: number | null;
  valor_final: number;
  valor_pago: number;
  saldo: number;
  status: string;
  data_vencimento?: string | null;
  responsavel_nome?: string | null;
  plano_nome?: string | null;
  tipo_grupo?: string | null;
  alunas?: Pessoa[];
  aluno_id?: number | null;
  aluno_nome?: string | null;
  espetaculo_nome?: string | null;
  coreografia_nome?: string | null;
  papel_nome?: string | null;
  numero_parcela?: number;
  total_parcelas?: number;
};

type Venda = {
  id: number;
  aluno_id?: number;
  aluno_nome?: string;
  data: string | null;
  valor_total: number;
  status: string;
  itens?: { produto_nome: string; quantidade: number }[];
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const meses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function ContasPage() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [responsaveis, setResponsaveis] = useState<Pessoa[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunosTurma, setAlunosTurma] = useState<Aluno[]>([]);
  const [alunosResponsavel, setAlunosResponsavel] = useState<Aluno[]>([]);
  const [mensalidades, setMensalidades] = useState<Conta[]>([]);
  const [fantasias, setFantasias] = useState<Conta[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [selectedTurma, setSelectedTurma] = useState("");
  const [selectedResponsavel, setSelectedResponsavel] = useState("");
  const [contaFilters, setContaFilters] = useState({ status: "", mes: "", ano: "", aluno_id: "" });
  const [loadingTurma, setLoadingTurma] = useState(false);
  const [loadingResponsavel, setLoadingResponsavel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRefs();
  }, []);

  useEffect(() => {
    if (selectedTurma) loadAlunosTurma(selectedTurma);
    else setAlunosTurma([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTurma]);

  useEffect(() => {
    if (selectedResponsavel) loadResponsavelFinanceiro(selectedResponsavel);
    else {
      setAlunosResponsavel([]);
      setMensalidades([]);
      setFantasias([]);
      setVendas([]);
    }
  }, [selectedResponsavel]);

  const selectedResponsavelNome = useMemo(() => {
    return responsaveis.find((responsavel) => String(responsavel.id) === selectedResponsavel)?.nome || "";
  }, [responsaveis, selectedResponsavel]);

  const mensalidadesFiltradas = useMemo(() => mensalidades.filter((item) => contaPassaFiltros(item, contaFilters)), [mensalidades, contaFilters]);
  const fantasiasFiltradas = useMemo(() => fantasias.filter((item) => contaPassaFiltros(item, contaFilters)), [fantasias, contaFilters]);
  const vendasFiltradas = useMemo(() => vendas.filter((item) => vendaPassaFiltros(item, contaFilters)), [vendas, contaFilters]);

  const resumoResponsavel = useMemo(() => {
    const base = { total: 0, pago: 0, saldo: 0, pendentes: 0, pagas: 0 };
    mensalidadesFiltradas.forEach((item) => addContaResumo(base, item));
    fantasiasFiltradas.forEach((item) => addContaResumo(base, item));
    vendasFiltradas.forEach((item) => {
      const valor = Number(item.valor_total || 0);
      base.total += valor;
      if (item.status === "PAGO") {
        base.pago += valor;
        base.pagas += 1;
      } else if (item.status !== "CANCELADO") {
        base.saldo += valor;
        base.pendentes += 1;
      }
    });
    return base;
  }, [mensalidadesFiltradas, fantasiasFiltradas, vendasFiltradas]);

  async function loadRefs() {
    try {
      setError(null);
      const [turmasResult, responsaveisResult, alunosResult] = await Promise.allSettled([
        fetchJson("/api/turmas"),
        fetchJson("/api/responsaveis?limit=500"),
        fetchJson("/api/alunos?limit=500"),
      ]);

      if (turmasResult.status === "fulfilled") setTurmas(Array.isArray(turmasResult.value) ? turmasResult.value : []);
      if (responsaveisResult.status === "fulfilled") setResponsaveis(Array.isArray(responsaveisResult.value) ? responsaveisResult.value : []);
      if (alunosResult.status === "fulfilled") setAlunos(Array.isArray(alunosResult.value) ? alunosResult.value : []);

      const failed = [turmasResult, responsaveisResult, alunosResult].find((result) => result.status === "rejected");
      if (failed?.status === "rejected") throw failed.reason;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar filtros");
    }
  }

  async function loadAlunosTurma(turmaId: string) {
    try {
      setLoadingTurma(true);
      setError(null);
      const response = await apiFetch(`/api/turmas/${turmaId}/alunos`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar alunos da turma");
      const lista = Array.isArray(data) ? data : [];
      setAlunosTurma(await enriquecerAlunosTurma(lista));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar alunos da turma");
    } finally {
      setLoadingTurma(false);
    }
  }

  async function enriquecerAlunosTurma(lista: Aluno[]) {
    return Promise.all(lista.map(async (aluno) => {
      const responsavelId = aluno.responsavel_id ? String(aluno.responsavel_id) : "";
      const mensalidadesPath = responsavelId ? `/api/mensalidades?responsavel_id=${responsavelId}` : `/api/mensalidades?aluno_id=${aluno.id}`;
      const fantasiasPath = `/api/mensalidades/fantasias?aluno_id=${aluno.id}`;

      const [mensalidadesResult, fantasiasResult] = await Promise.allSettled([
        fetchJson(mensalidadesPath),
        fetchJson(fantasiasPath),
      ]);

      const mensalidadesAluno = mensalidadesResult.status === "fulfilled" && Array.isArray(mensalidadesResult.value) ? mensalidadesResult.value : [];
      const fantasiasAluno = fantasiasResult.status === "fulfilled" && Array.isArray(fantasiasResult.value) ? fantasiasResult.value : [];

      return {
        ...aluno,
        resumo_mensalidades: montarResumoContas(mensalidadesAluno, aluno.resumo_mensalidades),
        resumo_fantasias: montarResumoContas(fantasiasAluno, aluno.resumo_fantasias),
      };
    }));
  }

  async function loadResponsavelFinanceiro(responsavelId: string) {
    try {
      setLoadingResponsavel(true);
      setError(null);
      const params = new URLSearchParams({ responsavel_id: responsavelId });
      const [alunosData, mensalidadesData, fantasiasData, vendasData] = await Promise.all([
        fetchJson("/api/alunos?limit=500"),
        fetchJson(`/api/mensalidades?${params.toString()}`),
        fetchJson(`/api/mensalidades/fantasias?${params.toString()}`),
        fetchJson(`/api/vendas?${params.toString()}`),
      ]);
      setAlunosResponsavel(Array.isArray(alunosData) ? alunosData.filter((aluno: Aluno) => String(aluno.responsavel_id) === responsavelId) : []);
      setMensalidades(Array.isArray(mensalidadesData) ? mensalidadesData : []);
      setFantasias(Array.isArray(fantasiasData) ? fantasiasData : []);
      setVendas(Array.isArray(vendasData) ? vendasData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar contas do responsável");
    } finally {
      setLoadingResponsavel(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Financeiro</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Contas por turma ou responsável</h1>
          </div>
          <Link href="/funcionarios" className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
            Voltar
          </Link>
        </div>

        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

        <section className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Busca</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Escolha como consultar</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <SearchableSelect label="Pesquisar por turma" value={selectedTurma} onChange={setSelectedTurma} options={turmas.map((turma) => [String(turma.id), formatTurma(turma)])} placeholder="Digite ou selecione uma turma" inputClassName="bg-[#F9FAFB]" showAllOnFocus />
            <SearchableSelect label="Pesquisar por responsável" value={selectedResponsavel} onChange={setSelectedResponsavel} options={responsaveis.map((responsavel) => [String(responsavel.id), responsavel.nome])} placeholder="Digite ou selecione um responsável" inputClassName="bg-[#F9FAFB]" showAllOnFocus />
            <SearchableSelect label="Pesquisar por aluno" value="" onChange={(value) => { if (value) router.push(`/funcionarios/alunos/${value}/contas`); }} options={alunos.map((aluno) => [String(aluno.id), aluno.nome])} placeholder="Digite ou selecione um aluno" inputClassName="bg-[#F9FAFB]" showAllOnFocus />
          </div>
        </section>

        <section className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Turma</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Alunos para abrir financeiro ({alunosTurma.length})</h2>
          </div>
          {loadingTurma ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando alunos...</p>
          ) : !selectedTurma ? (
            <p className="text-sm text-[#2B2B2B]/70">Selecione uma turma para listar os alunos.</p>
          ) : alunosTurma.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhum aluno encontrado nesta turma.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <Th>Aluno</Th><Th>Responsável</Th><Th>Plano mensalidade</Th><Th>Fantasias</Th><Th>Status</Th><Th>Ações</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {alunosTurma.map((aluno) => (
                    <tr key={aluno.id} className="bg-white hover:bg-[#F2F2F2]">
                      <Td strong>{aluno.nome}</Td>
                      <Td>{aluno.responsavel_nome || responsaveis.find((item) => item.id === aluno.responsavel_id)?.nome || "-"}</Td>
                      <Td>{formatResumoMensalidades(aluno)}</Td>
                      <Td>{formatResumoFantasias(aluno)}</Td>
                      <Td>{aluno.email || aluno.cpf || "-"}</Td>
                      <Td><AlunoLink id={aluno.id}>Ver financeiro</AlunoLink></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Responsável</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">{selectedResponsavelNome || "Contas do responsável"}</h2>
          </div>

          {!selectedResponsavel ? (
            <p className="text-sm text-[#2B2B2B]/70">Selecione um responsável para ver mensalidades, crianças no plano, fantasias e vendas.</p>
          ) : loadingResponsavel ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando contas...</p>
          ) : (
            <>
              <div className="mb-8 grid gap-4 md:grid-cols-4">
                <SummaryCard label="Total" value={currency.format(resumoResponsavel.total)} />
                <SummaryCard label="Pago" value={currency.format(resumoResponsavel.pago)} />
                <SummaryCard label="Em aberto" value={currency.format(resumoResponsavel.saldo)} />
                <SummaryCard label="Status" value={`${resumoResponsavel.pendentes} pendente(s) / ${resumoResponsavel.pagas} paga(s)`} />
              </div>

              <ChildrenList alunos={alunosResponsavel} />
              <ResponsavelFilters alunos={alunosResponsavel} filters={contaFilters} onChange={setContaFilters} />
              <ContaTable title="Mensalidades do plano" items={mensalidadesFiltradas} />
              <ContaTable title="Cobranças de fantasia" items={fantasiasFiltradas} showAluno />
              <VendaTable vendas={vendasFiltradas} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function ChildrenList({ alunos }: { alunos: Aluno[] }) {
  return (
    <div className="mb-8 rounded-[24px] border border-[#E5E7EB] bg-[#F9FAFB] p-5">
      <p className="mb-4 text-sm font-semibold text-[#1F2A5A]">Crianças vinculadas ao responsável ({alunos.length})</p>
      {alunos.length === 0 ? (
        <p className="text-sm text-[#2B2B2B]/70">Nenhuma criança vinculada.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {alunos.map((aluno) => <AlunoLink key={aluno.id} id={aluno.id}>{aluno.nome}</AlunoLink>)}
        </div>
      )}
    </div>
  );
}

function ResponsavelFilters({
  alunos,
  filters,
  onChange,
}: {
  alunos: Aluno[];
  filters: { status: string; mes: string; ano: string; aluno_id: string };
  onChange: React.Dispatch<React.SetStateAction<{ status: string; mes: string; ano: string; aluno_id: string }>>;
}) {
  const currentYear = new Date().getFullYear();
  const anos = Array.from({ length: 5 }, (_, index) => String(currentYear - 2 + index));

  return (
    <div className="mb-8 rounded-[24px] border border-[#E5E7EB] bg-[#F9FAFB] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#6A4FBF]">Filtros</p>
          <h3 className="mt-2 text-lg font-semibold text-[#1F2A5A]">Contas do responsável</h3>
        </div>
        <button type="button" onClick={() => onChange({ status: "", mes: "", ano: "", aluno_id: "" })} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
          Limpar filtros
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <SearchableSelect
          label="Status"
          value={filters.status}
          onChange={(value) => onChange((prev) => ({ ...prev, status: value }))}
          options={[["PENDENTE", "Pendente"], ["ATRASADA", "Atrasada"], ["ATRASADA_COM_MULTA", "Atrasada com multa"], ["PAGA", "Paga"], ["PAGO", "Pago"], ["CANCELADA", "Cancelada"], ["CANCELADO", "Cancelado"]]}
          placeholder="Todos"
          inputClassName="bg-white"
        />
        <SearchableSelect
          label="Mês/referência"
          value={filters.mes}
          onChange={(value) => onChange((prev) => ({ ...prev, mes: value }))}
          options={meses.slice(1).map((mes, index) => [String(index + 1), mes])}
          placeholder="Todos"
          inputClassName="bg-white"
        />
        <SearchableSelect
          label="Ano"
          value={filters.ano}
          onChange={(value) => onChange((prev) => ({ ...prev, ano: value }))}
          options={anos.map((ano) => [ano, ano])}
          placeholder="Todos"
          inputClassName="bg-white"
        />
        <SearchableSelect
          label="Aluno"
          value={filters.aluno_id}
          onChange={(value) => onChange((prev) => ({ ...prev, aluno_id: value }))}
          options={alunos.map((aluno) => [String(aluno.id), aluno.nome])}
          placeholder="Todos"
          inputClassName="bg-white"
        />
      </div>
    </div>
  );
}

function ContaTable({ title, items, showAluno = false }: { title: string; items: Conta[]; showAluno?: boolean }) {
  return (
    <div className="mb-8">
      <h3 className="mb-4 text-lg font-semibold text-[#1F2A5A]">{title} ({items.length})</h3>
      {items.length === 0 ? (
        <p className="text-sm text-[#2B2B2B]/70">Nenhuma conta encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
            <thead>
              <tr className="bg-[#F9FAFB]">
                {showAluno && <Th>Criança</Th>}
                <Th>Referência</Th><Th>Detalhe</Th><Th>Vencimento</Th><Th>Total</Th><Th>Pago</Th><Th>Saldo</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {items.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-[#F2F2F2]">
                  {showAluno && <Td>{formatAlunoConta(item)}</Td>}
                  <Td>{formatReferencia(item)}</Td>
                  <Td>{formatDetalheConta(item)}</Td>
                  <Td>{formatDateBR(item.data_vencimento)}</Td>
                  <Td>{currency.format(Number(item.valor_final || 0))}</Td>
                  <Td>{currency.format(Number(item.valor_pago || 0))}</Td>
                  <Td>{currency.format(Number(item.saldo || 0))}</Td>
                  <Td>{item.status}{item.prevista ? " (prevista)" : ""}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function VendaTable({ vendas }: { vendas: Venda[] }) {
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-[#1F2A5A]">Produtos e outras contas ({vendas.length})</h3>
      {vendas.length === 0 ? (
        <p className="text-sm text-[#2B2B2B]/70">Nenhuma venda encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
            <thead><tr className="bg-[#F9FAFB]"><Th>Criança</Th><Th>Data</Th><Th>Itens</Th><Th>Total</Th><Th>Status</Th></tr></thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {vendas.map((item) => (
                <tr key={item.id} className="bg-white hover:bg-[#F2F2F2]">
                  <Td>{item.aluno_nome || "-"}</Td>
                  <Td>{formatDateBR(item.data)}</Td>
                  <Td>{formatItensVenda(item)}</Td>
                  <Td>{currency.format(Number(item.valor_total || 0))}</Td>
                  <Td>{item.status}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F9FAFB] p-5"><p className="text-xs uppercase tracking-[0.18em] text-[#6A4FBF]">{label}</p><p className="mt-2 text-lg font-semibold text-[#1F2A5A]">{value}</p></div>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold text-[#1F2A5A]">{children}</th>;
}

function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return <td className={`px-4 py-4 ${strong ? "font-medium" : ""}`}>{children}</td>;
}

function AlunoLink({ id, children }: { id: number; children: React.ReactNode }) {
  return <Link href={`/funcionarios/alunos/${id}/contas`} className="inline-flex rounded-full bg-[#1F2A5A]/10 px-3 py-1 text-xs font-semibold text-[#1F2A5A] transition hover:bg-[#1F2A5A]/20">{children}</Link>;
}

function formatTurma(turma: Turma) {
  return `${turma.nome}${turma.nivel ? ` - ${turma.nivel}` : ""}`;
}

function formatResumoMensalidades(aluno: Aluno) {
  const resumo = aluno.resumo_mensalidades;
  if (!resumo || resumo.total === 0) return "Sem plano";
  return `${resumo.em_aberto + resumo.atrasadas} em aberto / ${resumo.pagas} pagas`;
}

function formatResumoFantasias(aluno: Aluno) {
  const resumo = aluno.resumo_fantasias;
  if (!resumo || resumo.total === 0) return "Sem cobranca";
  return `${resumo.em_aberto + resumo.atrasadas} em aberto / ${resumo.pagas} pagas`;
}

function formatReferencia(item: Conta) {
  if (item.mes_referencia || item.ano_referencia) {
    return `${meses[Number(item.mes_referencia)] || item.mes_referencia}/${item.ano_referencia || ""}`;
  }
  if (item.numero_parcela || item.total_parcelas) return `${item.numero_parcela || "-"} / ${item.total_parcelas || "-"}`;
  return "-";
}

function formatDetalheConta(item: Conta) {
  return item.plano_nome || item.espetaculo_nome || item.coreografia_nome || item.papel_nome || "-";
}

function formatAlunoConta(item: Conta) {
  if (item.aluno_nome) return item.aluno_nome;
  if (item.alunas?.length) return item.alunas.map((aluna) => aluna.nome).join(", ");
  return "-";
}

function formatItensVenda(venda: Venda) {
  if (!Array.isArray(venda.itens) || venda.itens.length === 0) return "-";
  return venda.itens.map((item) => `${item.quantidade}x ${item.produto_nome}`).join(", ");
}

function addContaResumo(base: { total: number; pago: number; saldo: number; pendentes: number; pagas: number }, item: Conta) {
  base.total += Number(item.valor_final || 0);
  base.pago += Number(item.valor_pago || 0);
  base.saldo += Number(item.saldo || 0);
  if (item.status === "PAGA") base.pagas += 1;
  if (!["PAGA", "CANCELADA"].includes(item.status)) base.pendentes += 1;
}

function montarResumoContas(items: Conta[], fallback?: { total: number; pagas: number; em_aberto: number; atrasadas: number }) {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback || { total: 0, pagas: 0, em_aberto: 0, atrasadas: 0 };
  }

  return items.reduce((resumo, item) => {
    const status = String(item.status || "").toUpperCase();
    resumo.total += 1;
    if (status === "PAGA" || status === "PAGO") resumo.pagas += 1;
    else if (["ATRASADA", "ATRASADA_COM_MULTA"].includes(status)) resumo.atrasadas += 1;
    else if (!["CANCELADA", "CANCELADO"].includes(status)) resumo.em_aberto += 1;
    return resumo;
  }, { total: 0, pagas: 0, em_aberto: 0, atrasadas: 0 });
}

function contaPassaFiltros(item: Conta, filters: { status: string; mes: string; ano: string; aluno_id: string }) {
  if (filters.status && !statusMatches(item.status, filters.status)) return false;
  if (filters.mes && String(item.mes_referencia || "") !== filters.mes) return false;
  if (filters.ano && String(item.ano_referencia || "") !== filters.ano) return false;
  if (filters.aluno_id && !contaTemAluno(item, filters.aluno_id)) return false;
  return true;
}

function vendaPassaFiltros(item: Venda, filters: { status: string; mes: string; ano: string; aluno_id: string }) {
  if (filters.status && !statusMatches(item.status, filters.status)) return false;
  if (filters.aluno_id && String(item.aluno_id || "") !== filters.aluno_id) return false;

  if ((filters.mes || filters.ano) && item.data) {
    const [ano, mes] = item.data.split("-");
    if (filters.mes && String(Number(mes)) !== filters.mes) return false;
    if (filters.ano && ano !== filters.ano) return false;
  } else if (filters.mes || filters.ano) {
    return false;
  }

  return true;
}

function contaTemAluno(item: Conta, alunoId: string) {
  if (String(item.aluno_id || "") === alunoId) return true;
  return Boolean(item.alunas?.some((aluna) => String(aluna.id) === alunoId));
}

function statusMatches(value: string, filter: string) {
  const status = String(value || "").toUpperCase();
  const filtro = String(filter || "").toUpperCase();
  if (filtro === "PAGA" || filtro === "PAGO") return status === "PAGA" || status === "PAGO";
  if (filtro === "CANCELADA" || filtro === "CANCELADO") return status === "CANCELADA" || status === "CANCELADO";
  return status === filtro;
}

async function fetchJson(path: string) {
  const response = await apiFetch(path);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erro ao carregar dados");
  return data;
}
