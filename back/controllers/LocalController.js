import LocalEntity from "../entities/localEntity.js";
import LocalRepository from "../repositories/LocalRepository.js";

export default class LocalController {
    constructor() {
        this.localRepository = new LocalRepository();
    }

    async listar(req, res) {
        try {
            const incluirInativos = req.query.ativos === 'true' ? false : true;
            const lista = await this.localRepository.listar({ incluirInativos });
            return res.json(lista);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async obter(req, res) {
        try {
            const id = Number(req.params.id);
            const local = await this.localRepository.obter(id);
            if (!local) {
                return res.status(404).json({ error: 'Local não encontrado' });
            }
            return res.json(local);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrar(req, res) {
        try {
            const payload = this.normalizarPayload(req.body);
            const erro = this.validarPayload(payload);
            if (erro) {
                return res.status(400).json({ error: erro });
            }

            const entidade = new LocalEntity(null, payload.nome, payload.cep, payload.rua, payload.numero, payload.bairro, payload.cidade, payload.status || 'ATIVO');
            const id = await this.localRepository.cadastrar(entidade);
            if (!id) {
                return res.status(500).json({ error: 'Erro ao cadastrar local' });
            }

            return res.status(201).json({ id });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async alterar(req, res) {
        try {
            const id = Number(req.params.id);
            const localExistente = await this.localRepository.obter(id);
            if (!localExistente) {
                return res.status(404).json({ error: 'Local não encontrado' });
            }

            const payload = this.normalizarPayload(req.body);
            const erro = this.validarPayload(payload);
            if (erro) {
                return res.status(400).json({ error: erro });
            }

            const entidade = new LocalEntity(
                id,
                payload.nome,
                payload.cep,
                payload.rua,
                payload.numero,
                payload.bairro,
                payload.cidade,
                payload.status || localExistente.status
            );

            const alterado = await this.localRepository.alterar(entidade);
            if (!alterado) {
                return res.status(500).json({ error: 'Erro ao atualizar local' });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async inativar(req, res) {
        try {
            const id = Number(req.params.id);
            const local = await this.localRepository.obter(id);
            if (!local) {
                return res.status(404).json({ error: 'Local não encontrado' });
            }

            const inativado = await this.localRepository.inativar(id);
            if (!inativado) {
                return res.status(500).json({ error: 'Erro ao inativar local' });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    normalizarPayload(body = {}) {
        return {
            nome: String(body.nome || '').trim(),
            cep: String(body.cep || '').trim(),
            rua: String(body.rua || '').trim(),
            numero: String(body.numero || '').trim(),
            bairro: String(body.bairro || '').trim(),
            cidade: String(body.cidade || '').trim(),
            status: body.status || 'ATIVO',
        };
    }

    validarPayload(payload) {
        if (!payload.nome) return 'Nome do local é obrigatório';
        if (!payload.cep) return 'CEP é obrigatório';
        if (!payload.rua) return 'Rua é obrigatória';
        if (!payload.numero) return 'Número é obrigatório';
        if (!payload.bairro) return 'Bairro é obrigatório';
        if (!payload.cidade) return 'Cidade é obrigatória';
        return null;
    }
}
