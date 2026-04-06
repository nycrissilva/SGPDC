import PessoaEntity from "../entities/pessoaEntity.js";
import ResponsavelEntity from "../entities/responsavelEntity.js";
import PessoaRepository from "../repositories/PessoaRepository.js";
import ResponsavelRepository from "../repositories/ResponsavelRepository.js";

export default class ResponsavelController {
    constructor() {
        this.pessoaRepository = new PessoaRepository();
        this.responsavelRepository = new ResponsavelRepository();
    }

    async listar(req, res) {
        try {
            const filtro = req.query.q || "";
            const pagina = Number(req.query.page || 1);
            const limite = Number(req.query.limit || 20);
            const lista = await this.pessoaRepository.buscar(filtro, "RESPONSAVEL", pagina, limite);
            return res.json(lista);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async obter(req, res) {
        try {
            const id = Number(req.params.id);
            const pessoa = await this.pessoaRepository.obter(id);
            if (!pessoa) {
                return res.status(404).json({ error: "Respons�vel n�o encontrado" });
            }

            const responsavel = await this.responsavelRepository.obter(id);
            return res.json({ ...pessoa, ...responsavel });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrar(req, res) {
        try {
            const { nome, cpf, telefone, email, status, parentesco } = req.body;

            if (!nome || !cpf || !email || !parentesco) {
                return res.status(400).json({ error: "Campos obrigat�rios faltando" });
            }

            const pessoaExistente = await this.pessoaRepository.obterPorCpf(cpf);
            if (pessoaExistente) {
                return res.status(400).json({ error: "CPF j� cadastrado" });
            }

            const pessoa = new PessoaEntity(null, nome, cpf, telefone, email, status || "ATIVO");
            const pessoaCadastrada = await this.pessoaRepository.cadastrar(pessoa);
            if (!pessoaCadastrada) {
                return res.status(500).json({ error: "Erro ao cadastrar pessoa" });
            }

            const responsavel = new ResponsavelEntity(pessoa.id, parentesco);
            const responsavelCadastrado = await this.responsavelRepository.cadastrar(responsavel);
            if (!responsavelCadastrado) {
                await this.pessoaRepository.inativar(pessoa.id);
                return res.status(500).json({ error: "Erro ao cadastrar respons�vel" });
            }

            return res.status(201).json({ id: pessoa.id });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async alterar(req, res) {
        try {
            const id = Number(req.params.id);
            const pessoaExistente = await this.pessoaRepository.obter(id);
            if (!pessoaExistente) {
                return res.status(404).json({ error: "Respons�vel n�o encontrado" });
            }

            const { nome, cpf, telefone, email, status, parentesco } = req.body;
            const responsavelExistente = await this.responsavelRepository.obter(id);
            if (!responsavelExistente) {
                return res.status(404).json({ error: "Responsável não encontrado" });
            }

            const pessoa = new PessoaEntity(id, nome || pessoaExistente.nome, cpf || pessoaExistente.cpf,
                telefone || pessoaExistente.telefone, email || pessoaExistente.email, status || pessoaExistente.status);

            const pessoaAtualizada = await this.pessoaRepository.alterar(pessoa);
            if (!pessoaAtualizada) {
                return res.status(500).json({ error: "Erro ao atualizar pessoa" });
            }

            const responsavel = new ResponsavelEntity(id, parentesco || responsavelExistente.parentesco);
            const responsavelAtualizado = await this.responsavelRepository.alterar(responsavel);
            if (!responsavelAtualizado) {
                return res.status(500).json({ error: "Erro ao atualizar respons�vel" });
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
                return res.status(404).json({ error: "Respons�vel n�o encontrado" });
            }

            const inativado = await this.responsavelRepository.inativar(id);
            if (!inativado) {
                return res.status(500).json({ error: "Erro ao inativar respons�vel" });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
