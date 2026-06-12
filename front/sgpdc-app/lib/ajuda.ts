import type { DriveStep } from "driver.js";

export type PerfilAjuda = "ADMIN" | "FUNCIONARIO" | "PROFESSOR";

export type ItemAjuda = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaAjuda;
  caminhoMenu: string;
  href: string;
  perfis: PerfilAjuda[];
};

export type CategoriaAjuda =
  | "Primeiros passos"
  | "Cadastros"
  | "Turmas e Alunos"
  | "Financeiro"
  | "Espetáculos e Coreografias"
  | "Relatórios"
  | "Área do Professor";

export type DefinicaoTour = {
  id: string;
  titulo: string;
  passos: DriveStep[];
};

const equipe: PerfilAjuda[] = ["ADMIN", "FUNCIONARIO"];
const professor: PerfilAjuda[] = ["PROFESSOR"];

export const categoriasAjuda: CategoriaAjuda[] = [
  "Primeiros passos",
  "Cadastros",
  "Turmas e Alunos",
  "Financeiro",
  "Espetáculos e Coreografias",
  "Relatórios",
  "Área do Professor",
];

export const itensAjuda: ItemAjuda[] = [
  { id: "dashboard", titulo: "Dashboard", descricao: "Acompanhe receitas, despesas, movimentações e o resultado financeiro do período.", categoria: "Primeiros passos", caminhoMenu: "Página inicial", href: "/funcionarios", perfis: equipe },
  { id: "pessoas", titulo: "Pessoas e matrículas", descricao: "Cadastre alunos, responsáveis, professores e funcionários e mantenha seus dados atualizados.", categoria: "Cadastros", caminhoMenu: "Pessoas", href: "/funcionarios/alunos", perfis: equipe },
  { id: "turmas", titulo: "Turmas", descricao: "Crie turmas, defina horários, locais, modalidades, professores e alunos alocados.", categoria: "Turmas e Alunos", caminhoMenu: "Turmas > Turmas", href: "/funcionarios/turmas", perfis: equipe },
  { id: "matriculas", titulo: "Matrículas e alocação", descricao: "Matricule alunos, associe planos financeiros e faça a alocação nas turmas.", categoria: "Turmas e Alunos", caminhoMenu: "Pessoas > Alunos", href: "/funcionarios/alunos", perfis: equipe },
  { id: "modalidades", titulo: "Modalidades", descricao: "Cadastre e edite as modalidades oferecidas pela escola.", categoria: "Cadastros", caminhoMenu: "Estrutura da Escola > Modalidades", href: "/funcionarios/modalidades", perfis: equipe },
  { id: "locais", titulo: "Locais", descricao: "Gerencie salas e demais locais utilizados pelas turmas.", categoria: "Cadastros", caminhoMenu: "Estrutura da Escola > Locais", href: "/funcionarios/locais", perfis: equipe },
  { id: "planos", titulo: "Planos de mensalidade", descricao: "Configure valores, vencimentos e condições dos planos financeiros.", categoria: "Financeiro", caminhoMenu: "Estrutura da Escola > Planos Financeiros", href: "/funcionarios/planos-mensalidade", perfis: equipe },
  { id: "vendas", titulo: "Vendas", descricao: "Registre vendas de produtos e consulte as transações realizadas.", categoria: "Financeiro", caminhoMenu: "Vendas > Vendas", href: "/funcionarios/vendas", perfis: equipe },
  { id: "contas", titulo: "Contas a receber", descricao: "Consulte cobranças por turma ou responsável e acesse o financeiro dos alunos.", categoria: "Financeiro", caminhoMenu: "Mensalidades > Contas", href: "/funcionarios/contas", perfis: equipe },
  { id: "despesas", titulo: "Despesas", descricao: "Lance, categorize, consulte e quite despesas da escola.", categoria: "Financeiro", caminhoMenu: "Despesas > Despesas", href: "/funcionarios/despesas", perfis: equipe },
  { id: "coreografias", titulo: "Coreografias", descricao: "Organize coreografias, participantes e vínculos com espetáculos.", categoria: "Espetáculos e Coreografias", caminhoMenu: "Espetáculos > Coreografias", href: "/funcionarios/coreografias", perfis: equipe },
  { id: "espetaculos", titulo: "Espetáculos", descricao: "Cadastre espetáculos e acompanhe sua organização.", categoria: "Espetáculos e Coreografias", caminhoMenu: "Espetáculos > Espetáculos", href: "/funcionarios/espetaculos", perfis: equipe },
  { id: "relatorios", titulo: "Relatórios", descricao: "Acesse relatórios de presença, receitas e despesas.", categoria: "Relatórios", caminhoMenu: "Relatórios", href: "/funcionarios/relatorios", perfis: equipe },
  { id: "dre", titulo: "DRE", descricao: "Analise receitas, despesas, resultado e comparação por período.", categoria: "Relatórios", caminhoMenu: "Relatórios > DRE", href: "/funcionarios/relatorios/dre", perfis: equipe },
  { id: "agenda-professor", titulo: "Agenda do professor", descricao: "Consulte as aulas da semana, horários, turmas e locais.", categoria: "Área do Professor", caminhoMenu: "Minha Agenda", href: "/professores", perfis: professor },
  { id: "presenca-professor", titulo: "Registro de presença", descricao: "Selecione a turma e a data para registrar e finalizar a chamada.", categoria: "Área do Professor", caminhoMenu: "Registrar Presenças", href: "/professores/presencas", perfis: professor },
];

const criarTour = (id: string, titulo: string, textos: { conteudo: string; acao?: string; formulario?: string; lista?: string }): DefinicaoTour => ({
  id,
  titulo,
  passos: [
    {
      element: `[data-help="${id}-titulo"]`,
      popover: { title: titulo, description: textos.conteudo },
    },
    {
      element: `[data-help="${id}-acao"]`,
      popover: { title: "Ações rápidas", description: textos.acao || "Use esta ação para acessar a principal operação disponível nesta tela." },
    },
    {
      element: `[data-help="${id}-formulario"]`,
      popover: { title: "Filtros e cadastro", description: textos.formulario || "Preencha ou filtre as informações desta funcionalidade neste bloco." },
    },
    {
      element: `[data-help="${id}-lista"]`,
      popover: { title: "Informações disponíveis", description: textos.lista || "Consulte aqui os registros e resultados encontrados." },
    },
    {
      element: "[data-help=\"botao-ajuda\"]",
      popover: { title: "Ajuda sempre disponível", description: "Clique neste botão quando quiser rever o tutorial da página." },
    },
  ],
});

const tours: Array<{ corresponde: (pathname: string) => boolean; tour: DefinicaoTour }> = [
  { corresponde: (p) => p === "/funcionarios", tour: criarTour("dashboard", "Dashboard", { conteudo: "Este painel resume a situação financeira e as movimentações da escola.", formulario: "Ajuste o período e os demais filtros para atualizar os indicadores.", lista: "Confira as movimentações financeiras que compõem os resultados." }) },
  { corresponde: (p) => p.startsWith("/funcionarios/alunos"), tour: criarTour("matriculas", "Matrículas e alocação", { conteudo: "Gerencie os alunos matriculados e suas informações acadêmicas e financeiras.", acao: "Use os atalhos da tela para voltar, cadastrar ou acessar contas.", formulario: "Preencha os dados para cadastrar ou atualizar uma matrícula.", lista: "Aqui aparecem os alunos e as ações disponíveis para cada matrícula." }) },
  { corresponde: (p) => p.startsWith("/funcionarios/responsaveis") || p.startsWith("/funcionarios/professores") || p.startsWith("/funcionarios/funcionarioGerenciar"), tour: criarTour("pessoas", "Gestão de pessoas", { conteudo: "Cadastre e mantenha atualizadas as pessoas que utilizam o sistema.", formulario: "Use este formulário para incluir ou editar os dados.", lista: "Consulte os cadastros existentes e suas ações." }) },
  { corresponde: (p) => p === "/funcionarios/turmas", tour: criarTour("turmas", "Turmas", { conteudo: "Organize turmas, horários, professores, locais e alunos.", formulario: "Preencha os dados necessários para criar ou editar uma turma.", lista: "Expanda e consulte cada turma para ver seus detalhes e participantes." }) },
  { corresponde: (p) => p === "/funcionarios/modalidades", tour: criarTour("modalidades", "Modalidades", { conteudo: "Cadastre as modalidades oferecidas pela escola.", formulario: "Informe o nome e os dados da modalidade.", lista: "Consulte, edite ou inative modalidades cadastradas." }) },
  { corresponde: (p) => p === "/funcionarios/locais", tour: criarTour("locais", "Locais", { conteudo: "Gerencie os espaços onde as aulas e atividades acontecem.", formulario: "Cadastre ou atualize as informações do local.", lista: "Veja os locais já cadastrados e suas ações." }) },
  { corresponde: (p) => p === "/funcionarios/planos-mensalidade", tour: criarTour("planos", "Planos de mensalidade", { conteudo: "Configure os planos financeiros usados nas matrículas.", formulario: "Defina nome, valor e condições do plano.", lista: "Consulte e gerencie os planos existentes." }) },
  { corresponde: (p) => p === "/funcionarios/vendas", tour: criarTour("vendas", "Vendas", { conteudo: "Registre vendas e acompanhe o histórico de transações.", formulario: "Selecione o comprador, os itens e a forma de pagamento.", lista: "Confira as vendas registradas e seus valores." }) },
  { corresponde: (p) => p === "/funcionarios/contas" || p.includes("/contas"), tour: criarTour("contas", "Contas a receber", { conteudo: "Consulte cobranças e o financeiro vinculado aos alunos.", formulario: "Escolha a turma ou o responsável para localizar as contas.", lista: "Acompanhe vencimentos, pagamentos e valores em aberto." }) },
  { corresponde: (p) => p === "/funcionarios/despesas", tour: criarTour("despesas", "Despesas", { conteudo: "Registre e acompanhe os gastos da escola.", formulario: "Informe categoria, valor, vencimento e demais dados da despesa.", lista: "Consulte as despesas lançadas e suas parcelas." }) },
  { corresponde: (p) => p === "/funcionarios/coreografias", tour: criarTour("coreografias", "Coreografias", { conteudo: "Organize coreografias e seus participantes.", formulario: "Cadastre ou atualize os dados da coreografia.", lista: "Veja coreografias, alunos participantes e vínculos." }) },
  { corresponde: (p) => p === "/funcionarios/espetaculos", tour: criarTour("espetaculos", "Espetáculos", { conteudo: "Cadastre e acompanhe os espetáculos da escola.", formulario: "Informe os dados principais do espetáculo.", lista: "Consulte e edite os espetáculos cadastrados." }) },
  { corresponde: (p) => p === "/funcionarios/relatorios/dre", tour: criarTour("dre", "DRE", { conteudo: "Analise o resultado financeiro por período e regime.", formulario: "Escolha o período para recalcular a demonstração.", lista: "Confira receitas, despesas, subtotais e resultado." }) },
  { corresponde: (p) => p.startsWith("/funcionarios/relatorios"), tour: criarTour("relatorios", "Relatórios", { conteudo: "Use os relatórios para acompanhar dados acadêmicos e financeiros.", acao: "Abra o relatório que deseja consultar.", formulario: "Defina os filtros para gerar informações mais precisas.", lista: "Os resultados detalhados aparecem nesta área." }) },
  { corresponde: (p) => p === "/professores", tour: criarTour("agenda-professor", "Agenda do professor", { conteudo: "Consulte suas aulas organizadas por dia e horário.", acao: "Acesse o registro de presença por este atalho.", lista: "Veja as turmas da semana e os detalhes de cada aula." }) },
  { corresponde: (p) => p === "/professores/presencas", tour: criarTour("presenca-professor", "Registro de presença", { conteudo: "Registre a chamada das suas turmas nas datas disponíveis.", formulario: "Selecione turma e data, marque as presenças e finalize a chamada.", lista: "A lista de alunos será exibida após a seleção da turma e da data." }) },
];

export function obterTourDaRota(pathname: string) {
  return tours.find((item) => item.corresponde(pathname))?.tour;
}
