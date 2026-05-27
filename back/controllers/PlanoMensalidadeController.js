import PlanoMensalidadeEntity from "../entities/planoMensalidadeEntity.js";
import PlanoMensalidadeRepository from "../repositories/PlanoMensalidadeRepository.js";

const TIPOS_PLANO = ['INDIVIDUAL', 'FAMILIAR'];
const STATUS_PLANO = ['ATIVO', 'INATIVO'];

function normalizarPlano(body, statusPadrao = 'ATIVO') {
    const tipo_plano = String(body.tipo_plano || '').trim().toUpperCase();
    const qtd_alunas = Number(body.qtd_alunas);
    const qtd_cursos = Number(body.qtd_cursos);
    const nome = String(body.nome || `${tipo_plano === 'FAMILIAR' ? 'Familiar' : 'Individual'} ${qtd_alunas} aluna(s) ${qtd_cursos} curso(s)`).trim();
    const status = String(body.status || statusPadrao).trim().toUpperCase();
    const valor_cartao_pix = Number(body.valor_cartao_pix);
    const valor_dinheiro = Number(body.valor_dinheiro);

    return { nome, tipo_plano, qtd_alunas, qtd_cursos, valor_cartao_pix, valor_dinheiro, status };
}

function validarPlano(dados) {
    if (!dados.nome) return 'Nome do plano e obrigatorio';
    if (!TIPOS_PLANO.includes(dados.tipo_plano)) return 'Tipo do plano invalido';
    if (!Number.isInteger(dados.qtd_alunas) || dados.qtd_alunas < 1) return 'Quantidade de alunas deve ser maior que zero';
    if (!Number.isInteger(dados.qtd_cursos) || dados.qtd_cursos < 1) return 'Quantidade de cursos deve ser maior que zero';
    if (!Number.isFinite(dados.valor_cartao_pix) || dados.valor_cartao_pix < 0) return 'Valor para cartao/pix invalido';
    if (!Number.isFinite(dados.valor_dinheiro) || dados.valor_dinheiro < 0) return 'Valor para dinheiro invalido';
    if (!STATUS_PLANO.includes(dados.status)) return 'Status invalido';
    return null;
}

export default class PlanoMensalidadeController {
    constructor() {
        this.planoMensalidadeRepository = new PlanoMensalidadeRepository();
    }

    async listar(req, res) {
        try {
            const incluirInativos = req.query.ativos === 'true' ? false : true;
            const lista = await this.planoMensalidadeRepository.listar({ incluirInativos });
            return res.json(lista);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async obter(req, res) {
        try {
            const id = Number(req.params.id);
            const plano = await this.planoMensalidadeRepository.obter(id);
            if (!plano) {
                return res.status(404).json({ error: 'Plano de mensalidade nao encontrado' });
            }
            return res.json(plano);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrar(req, res) {
        try {
            const dados = normalizarPlano(req.body, 'ATIVO');
            dados.status = 'ATIVO';

            const erro = validarPlano(dados);
            if (erro) return res.status(400).json({ error: erro });

            const existente = await this.planoMensalidadeRepository.obterPorNome(dados.nome);
            if (existente) {
                return res.status(400).json({ error: 'Ja existe um plano cadastrado com este nome' });
            }

            const entidade = new PlanoMensalidadeEntity(
                null,
                dados.nome,
                dados.tipo_plano,
                dados.qtd_alunas,
                dados.qtd_cursos,
                dados.valor_cartao_pix,
                dados.valor_dinheiro,
                dados.status
            );
            const id = await this.planoMensalidadeRepository.cadastrar(entidade);
            if (!id) {
                return res.status(500).json({ error: 'Erro ao cadastrar plano de mensalidade' });
            }

            return res.status(201).json({ id });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async alterar(req, res) {
        try {
            const id = Number(req.params.id);
            const planoExistente = await this.planoMensalidadeRepository.obter(id);
            if (!planoExistente) {
                return res.status(404).json({ error: 'Plano de mensalidade nao encontrado' });
            }

            const dados = normalizarPlano(req.body, planoExistente.status);
            const erro = validarPlano(dados);
            if (erro) return res.status(400).json({ error: erro });

            const nomeExistente = await this.planoMensalidadeRepository.obterPorNome(dados.nome);
            if (nomeExistente && nomeExistente.id !== id) {
                return res.status(400).json({ error: 'Ja existe um plano cadastrado com este nome' });
            }

            const entidade = new PlanoMensalidadeEntity(
                id,
                dados.nome,
                dados.tipo_plano,
                dados.qtd_alunas,
                dados.qtd_cursos,
                dados.valor_cartao_pix,
                dados.valor_dinheiro,
                dados.status
            );
            const alterado = await this.planoMensalidadeRepository.alterar(entidade);
            if (!alterado) {
                return res.status(500).json({ error: 'Erro ao atualizar plano de mensalidade' });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async inativar(req, res) {
        try {
            const id = Number(req.params.id);
            const plano = await this.planoMensalidadeRepository.obter(id);
            if (!plano) {
                return res.status(404).json({ error: 'Plano de mensalidade nao encontrado' });
            }

            const inativado = await this.planoMensalidadeRepository.inativar(id);
            if (!inativado) {
                return res.status(500).json({ error: 'Erro ao inativar plano de mensalidade' });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
