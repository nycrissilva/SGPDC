import PessoaController from "./PessoaController.js";
import PessoaEntity from "../entities/pessoaEntity.js";
import AlunoEntity from "../entities/alunoEntity.js";
import AlunoRepository from "../repositories/AlunoRepository.js";
import PlanoFinanceiroRepository from "../repositories/PlanoFinanceiroRepository.js";

export default class AlunoController extends PessoaController {
    constructor() {
        super();
        this.alunoRepository = new AlunoRepository();
        this.planoFinanceiroRepository = new PlanoFinanceiroRepository();
    }

    obterTipoFiltro() {
        return "ALUNO";
    }

    obterNomeEntidade() {
        return "Aluno";
    }

    obterRepositorioEspecifico() {
        return this.alunoRepository;
    }

    async listar(req, res) {
        try {
            const filtros = {
                q: req.query.q || "",
                turma_id: this.parsePositiveInt(req.query.turma_id),
                turma: req.query.turma || "",
                pagina: Number(req.query.page || 1),
                limite: Number(req.query.limit || 200),
            };

            const lista = await this.alunoRepository.buscarComFiltros(filtros);
            return res.json(lista);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrar(req, res) {
        try {
            const {
                nome,
                cpf,
                telefone,
                email,
                status,
                responsavel_id,
                data_nascimento,
                data_matricula,
                turma_ids,
                plano_financeiro
            } = req.body;

            if (!nome || !cpf || !data_nascimento || !data_matricula) {
                return res.status(400).json({ error: "Campos obrigatórios faltando" });
            }

            if (!Array.isArray(turma_ids) || turma_ids.length === 0) {
                return res.status(400).json({ error: "Selecione ao menos uma turma ativa" });
            }

            const validacaoCpf = await this.validarCpfParaSalvar(cpf);
            if (validacaoCpf.error) {
                return res.status(400).json({ error: validacaoCpf.error });
            }

            const turmaIds = turma_ids.map(Number).filter((id) => Number.isInteger(id) && id > 0);
            if (turmaIds.length === 0) {
                return res.status(400).json({ error: "Selecione ao menos uma turma válida" });
            }

            const erroPlanoFinanceiro = await this.validarDadosPlanoFinanceiro(plano_financeiro);
            if (erroPlanoFinanceiro) {
                return res.status(400).json({ error: erroPlanoFinanceiro });
            }

            const dataMatricula = data_matricula || this.today();
            const pessoa = new PessoaEntity(null, nome, validacaoCpf.cpf, telefone, email, status || "ATIVO", data_nascimento);
            const pessoaCadastrada = await this.pessoaRepository.cadastrar(pessoa);
            if (!pessoaCadastrada) {
                return res.status(500).json({ error: "Erro ao cadastrar pessoa" });
            }

            const aluno = new AlunoEntity(pessoa.id, responsavel_id, data_nascimento, dataMatricula);
            const alunoCadastrado = await this.alunoRepository.cadastrar(aluno);
            if (!alunoCadastrado) {
                await this.pessoaRepository.inativar(pessoa.id);
                return res.status(500).json({ error: "Erro ao cadastrar aluno" });
            }

            let matriculaId = null;
            try {
                matriculaId = await this.alunoRepository.criarMatricula(pessoa.id, dataMatricula, "ATIVA");
                if (!matriculaId) {
                    throw new Error("Erro ao criar matrícula");
                }

                for (const turmaId of turmaIds) {
                    const existeAtiva = await this.alunoRepository.existeMatriculaAtiva(pessoa.id, turmaId);
                    if (existeAtiva) {
                        throw new Error(`Aluno já possui matrícula ativa na turma ${turmaId}`);
                    }

                    const vinculoCriado = await this.alunoRepository.criarMatriculaTurma(matriculaId, turmaId);
                    if (!vinculoCriado) {
                        throw new Error("Erro ao vincular aluno à turma");
                    }
                }

                await this.salvarPlanoFinanceiro(pessoa.id, plano_financeiro);
            } catch (innerError) {
                if (matriculaId) {
                    await this.alunoRepository.deletarMatriculaTurmas(matriculaId);
                    await this.alunoRepository.deletarMatricula(matriculaId);
                }
                await this.pessoaRepository.inativar(pessoa.id);
                return res.status(500).json({ error: innerError.message });
            }

            return res.status(201).json({ id: pessoa.id });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async validarDadosPlanoFinanceiro(planoFinanceiro) {
        if (!planoFinanceiro) return "Plano financeiro e obrigatorio";

        const responsavelFinanceiroId = Number(planoFinanceiro.responsavel_financeiro_id);
        const planoMensalidadeId = Number(planoFinanceiro.plano_mensalidade_id);
        const tipoCobranca = String(planoFinanceiro.tipo_cobranca || '').toUpperCase();
        const dataInicio = planoFinanceiro.data_inicio;
        const acao = String(planoFinanceiro.acao || 'CRIAR').toUpperCase();

        if (!Number.isInteger(responsavelFinanceiroId) || responsavelFinanceiroId <= 0) {
            return "Responsavel financeiro e obrigatorio";
        }

        if (!['INDIVIDUAL', 'FAMILIAR'].includes(tipoCobranca)) {
            return "Tipo de cobranca invalido";
        }

        if (!Number.isInteger(planoMensalidadeId) || planoMensalidadeId <= 0) {
            return "Plano de mensalidade e obrigatorio";
        }

        if (!dataInicio) {
            return "Data de inicio da cobranca e obrigatoria";
        }

        const plano = await this.planoFinanceiroRepository.obterPlanoMensalidadeAtivo(planoMensalidadeId);
        if (!plano) {
            return "Plano de mensalidade inativo ou inexistente";
        }

        if (tipoCobranca === 'FAMILIAR' && plano.tipo_plano !== 'FAMILIAR') {
            return "Selecione um plano de mensalidade familiar";
        }

        if (tipoCobranca === 'INDIVIDUAL' && plano.tipo_plano === 'FAMILIAR') {
            return "Selecione um plano de mensalidade individual";
        }

        if (!['CRIAR', 'VINCULAR', 'SUBSTITUIR'].includes(acao)) {
            return "Acao do plano financeiro invalida";
        }

        const alunaIds = Array.isArray(planoFinanceiro.aluna_ids) ? planoFinanceiro.aluna_ids : [];
        if (tipoCobranca === 'INDIVIDUAL' && alunaIds.length > 0) {
            return "Plano financeiro individual permite apenas o aluno matriculado";
        }

        if (acao === 'VINCULAR' || acao === 'SUBSTITUIR') {
            const grupoId = Number(planoFinanceiro.grupo_financeiro_id);
            if (!Number.isInteger(grupoId) || grupoId <= 0) {
                return "Selecione o plano financeiro existente";
            }

            const grupo = await this.planoFinanceiroRepository.obter(grupoId);
            if (!grupo || grupo.status !== 'ATIVO') {
                return "Plano financeiro existente inativo ou inexistente";
            }

            if (Number(grupo.responsavel_id) !== responsavelFinanceiroId) {
                return "Plano financeiro existente nao pertence ao responsavel informado";
            }

            if (acao === 'VINCULAR' && grupo.tipo_grupo !== tipoCobranca) {
                return "Tipo de cobranca diferente do plano financeiro existente";
            }

            if (acao === 'VINCULAR' && grupo.tipo_grupo === 'INDIVIDUAL') {
                return "Plano financeiro individual nao permite vincular outro aluno";
            }

            if (acao === 'SUBSTITUIR' && (grupo.tipo_grupo !== 'INDIVIDUAL' || tipoCobranca !== 'FAMILIAR')) {
                return "A substituicao deve transformar um plano individual em familiar";
            }
        }

        for (const alunaIdBruto of alunaIds) {
            const alunaId = Number(alunaIdBruto);
            if (!Number.isInteger(alunaId) || alunaId <= 0) {
                return "Aluno vinculado ao plano financeiro invalido";
            }

            const grupoAtivo = await this.planoFinanceiroRepository.alunoPossuiPlanoFinanceiroAtivo(alunaId);
            const grupoSelecionadoId = Number(planoFinanceiro.grupo_financeiro_id);
            if (grupoAtivo && grupoAtivo.id !== grupoSelecionadoId) {
                return "Um dos alunos selecionados ja possui plano financeiro ativo";
            }
        }

        return null;
    }

    async salvarPlanoFinanceiro(alunoId, planoFinanceiro) {
        const responsavelFinanceiroId = Number(planoFinanceiro.responsavel_financeiro_id);
        const planoMensalidadeId = Number(planoFinanceiro.plano_mensalidade_id);
        const tipoCobranca = String(planoFinanceiro.tipo_cobranca || '').toUpperCase();
        const acao = String(planoFinanceiro.acao || 'CRIAR').toUpperCase();
        const dataInicio = planoFinanceiro.data_inicio;
        let grupoId = Number(planoFinanceiro.grupo_financeiro_id);

        const alunoJaPossuiPlano = await this.planoFinanceiroRepository.alunoPossuiPlanoFinanceiroAtivo(alunoId);
        if (alunoJaPossuiPlano) {
            throw new Error("Aluno ja possui plano financeiro ativo");
        }

        const grupoAntigoId = grupoId;

        if (acao === 'VINCULAR') {
            await this.planoFinanceiroRepository.atualizarPlanoGrupo(grupoId, planoMensalidadeId);
        } else {
            if (acao === 'SUBSTITUIR') {
                await this.planoFinanceiroRepository.inativarGrupo(grupoAntigoId, dataInicio);
            }

            grupoId = await this.planoFinanceiroRepository.criarGrupo({
                responsavel_id: responsavelFinanceiroId,
                plano_mensalidade_id: planoMensalidadeId,
                tipo_grupo: tipoCobranca,
                data_inicio: dataInicio,
            });
        }

        const alunaIds = Array.isArray(planoFinanceiro.aluna_ids)
            ? planoFinanceiro.aluna_ids.map(Number).filter((id) => Number.isInteger(id) && id > 0)
            : [];
        const idsParaVincular = Array.from(new Set([...alunaIds, alunoId]));

        if (tipoCobranca === 'INDIVIDUAL' && idsParaVincular.length > 1) {
            throw new Error("Plano financeiro individual permite apenas um aluno");
        }

        for (const idParaVincular of idsParaVincular) {
            const jaEstaNoGrupo = await this.planoFinanceiroRepository.alunoEstaNoGrupo(grupoId, idParaVincular);
            if (jaEstaNoGrupo) continue;

            const grupoAtivo = await this.planoFinanceiroRepository.alunoPossuiPlanoFinanceiroAtivo(idParaVincular);
            const estaNoPlanoSubstituido = acao === 'SUBSTITUIR' && grupoAtivo?.id === grupoAntigoId;
            if (grupoAtivo && grupoAtivo.id !== grupoId && !estaNoPlanoSubstituido) {
                throw new Error("Um dos alunos ja possui plano financeiro ativo");
            }

            await this.planoFinanceiroRepository.vincularAluno(grupoId, idParaVincular);
        }

        await this.gerarMensalidadeInicial(grupoId, planoMensalidadeId, dataInicio);

        return grupoId;
    }

    async gerarMensalidadeInicial(grupoId, planoMensalidadeId, dataInicio) {
        const plano = await this.planoFinanceiroRepository.obterPlanoMensalidade(planoMensalidadeId);
        if (!plano) {
            throw new Error("Plano de mensalidade nao encontrado para gerar cobranca");
        }

        const dataReferencia = new Date(`${dataInicio}T00:00:00`);
        if (Number.isNaN(dataReferencia.getTime())) {
            throw new Error("Data de inicio da cobranca invalida");
        }

        const mesReferencia = dataReferencia.getMonth() + 1;
        const anoReferencia = dataReferencia.getFullYear();
        const valorBase = Number(plano.valor_cartao_pix || plano.valor_dinheiro || 0);
        const dataVencimento = `${anoReferencia}-${String(mesReferencia).padStart(2, '0')}-15`;

        await this.planoFinanceiroRepository.criarMensalidadeInicial({
            grupo_financeiro_id: grupoId,
            mes_referencia: mesReferencia,
            ano_referencia: anoReferencia,
            valor_base: valorBase,
            data_vencimento: dataVencimento,
        });
    }

    async alterar(req, res) {
        try {
            const id = Number(req.params.id);
            const pessoaExistente = await this.pessoaRepository.obter(id);
            if (!pessoaExistente) {
                return res.status(404).json({ error: "Aluno não encontrado" });
            }

            const {
                nome,
                cpf,
                telefone,
                email,
                status,
                responsavel_id,
                data_nascimento,
                data_matricula
            } = req.body;

            const alunoExistente = await this.alunoRepository.obter(id);
            if (!alunoExistente) {
                return res.status(404).json({ error: "Aluno não encontrado" });
            }

            const validacaoCpf = await this.validarCpfParaSalvar(cpf ?? pessoaExistente.cpf, id);
            if (validacaoCpf.error) {
                return res.status(400).json({ error: validacaoCpf.error });
            }

            const pessoa = new PessoaEntity(id, nome || pessoaExistente.nome, validacaoCpf.cpf,
                telefone || pessoaExistente.telefone, email || pessoaExistente.email, status || pessoaExistente.status,
                data_nascimento || pessoaExistente.data_nascimento || alunoExistente.data_nascimento);

            const pessoaAtualizada = await this.pessoaRepository.alterar(pessoa);
            if (!pessoaAtualizada) {
                return res.status(500).json({ error: "Erro ao atualizar pessoa" });
            }

            const aluno = new AlunoEntity(
                id,
                responsavel_id ?? alunoExistente.responsavel_id,
                data_nascimento || alunoExistente.data_nascimento,
                data_matricula || alunoExistente.data_matricula
            );
            const alunoAtualizado = await this.alunoRepository.alterar(aluno);
            if (!alunoAtualizado) {
                return res.status(500).json({ error: "Erro ao atualizar aluno" });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async inativar(req, res) {
        try {
            const id = Number(req.params.id);
            const pessoaExistente = await this.pessoaRepository.obter(id);
            if (!pessoaExistente) {
                return res.status(404).json({ error: "Aluno não encontrado" });
            }

            const inativado = await this.alunoRepository.inativar(id);
            if (!inativado) {
                return res.status(500).json({ error: "Erro ao inativar aluno" });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    parsePositiveInt(value) {
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }

    today() {
        return new Date().toISOString().split("T")[0];
    }
}
