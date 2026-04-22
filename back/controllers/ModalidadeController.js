import ModalidadeEntity from "../entities/modalidadeEntity.js";
import ModalidadeRepository from "../repositories/ModalidadeRepository.js";

export default class ModalidadeController {
    constructor() {
        this.modalidadeRepository = new ModalidadeRepository();
    }

    async listar(req, res) {
        try {
            const incluirInativas = req.query.ativas === 'true' ? false : true;
            const lista = await this.modalidadeRepository.listar({ incluirInativas });
            return res.json(lista);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async obter(req, res) {
        try {
            const id = Number(req.params.id);
            const modalidade = await this.modalidadeRepository.obter(id);
            if (!modalidade) {
                return res.status(404).json({ error: 'Modalidade não encontrada' });
            }
            return res.json(modalidade);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrar(req, res) {
        try {
            const nome = String(req.body.nome || '').trim();
            if (!nome) {
                return res.status(400).json({ error: 'Nome da modalidade é obrigatório' });
            }

            const existente = await this.modalidadeRepository.obterPorNome(nome);
            if (existente) {
                return res.status(400).json({ error: 'Já existe uma modalidade cadastrada com este nome' });
            }

            const entidade = new ModalidadeEntity(null, nome, req.body.status || 'ATIVA');
            const id = await this.modalidadeRepository.cadastrar(entidade);
            if (!id) {
                return res.status(500).json({ error: 'Erro ao cadastrar modalidade' });
            }

            return res.status(201).json({ id });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async alterar(req, res) {
        try {
            const id = Number(req.params.id);
            const modalidadeExistente = await this.modalidadeRepository.obter(id);
            if (!modalidadeExistente) {
                return res.status(404).json({ error: 'Modalidade não encontrada' });
            }

            const nome = String(req.body.nome || '').trim();
            if (!nome) {
                return res.status(400).json({ error: 'Nome da modalidade é obrigatório' });
            }

            const nomeExistente = await this.modalidadeRepository.obterPorNome(nome);
            if (nomeExistente && nomeExistente.id !== id) {
                return res.status(400).json({ error: 'Já existe uma modalidade cadastrada com este nome' });
            }

            const entidade = new ModalidadeEntity(id, nome, req.body.status || modalidadeExistente.status);
            const alterado = await this.modalidadeRepository.alterar(entidade);
            if (!alterado) {
                return res.status(500).json({ error: 'Erro ao atualizar modalidade' });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async inativar(req, res) {
        try {
            const id = Number(req.params.id);
            const confirmar = req.query.confirmar === 'true';
            const modalidade = await this.modalidadeRepository.obter(id);
            if (!modalidade) {
                return res.status(404).json({ error: 'Modalidade não encontrada' });
            }

            const turmasAtivas = await this.modalidadeRepository.contarTurmasAtivas(id);
            if (turmasAtivas > 0 && !confirmar) {
                return res.status(409).json({
                    error: 'A modalidade está vinculada a turmas ativas',
                    confirmacaoNecessaria: true,
                    turmasAtivas,
                });
            }

            const inativado = await this.modalidadeRepository.inativar(id);
            if (!inativado) {
                return res.status(500).json({ error: 'Erro ao inativar modalidade' });
            }

            return res.json({ success: true, turmasAtivas });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
