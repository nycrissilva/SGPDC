import PessoaController from "./PessoaController.js";
import PessoaEntity from "../entities/pessoaEntity.js";
import ResponsavelEntity from "../entities/responsavelEntity.js";
import ResponsavelRepository from "../repositories/ResponsavelRepository.js";
import { normalizarParentesco } from "../utils/parentesco.js";

export default class ResponsavelController extends PessoaController {
    constructor() {
        super();
        this.responsavelRepository = new ResponsavelRepository();
    }

    obterTipoFiltro() {
        return "RESPONSAVEL";
    }

    obterNomeEntidade() {
        return "Responsável";
    }

    obterRepositorioEspecifico() {
        return this.responsavelRepository;
    }

    async cadastrar(req, res) {
        try {
            const { nome, cpf, telefone, email, status, parentesco } = req.body;

            if (!nome || !cpf || !email || !parentesco) {
                return res.status(400).json({ error: "Campos obrigatórios faltando" });
            }

            const pessoaExistente = await this.pessoaRepository.obterPorCpf(cpf);
            if (pessoaExistente) {
                return res.status(400).json({ error: "CPF já cadastrado" });
            }

            const pessoa = new PessoaEntity(null, nome, cpf, telefone, email, status || "ATIVO");
            const pessoaCadastrada = await this.pessoaRepository.cadastrar(pessoa);
            if (!pessoaCadastrada) {
                return res.status(500).json({ error: "Erro ao cadastrar pessoa" });
            }

            let pessoaId = Number(pessoa.id);
            if (!Number.isInteger(pessoaId) || pessoaId <= 0) {
                const pessoaCriada = await this.pessoaRepository.obterPorCpf(cpf);
                pessoaId = Number(pessoaCriada?.id);
            }

            if (!Number.isInteger(pessoaId) || pessoaId <= 0) {
                return res.status(500).json({ error: "Pessoa cadastrada sem id válido" });
            }

            const responsavel = new ResponsavelEntity(pessoaId, normalizarParentesco(parentesco));
            const responsavelCadastrado = await this.responsavelRepository.cadastrar(responsavel);
            if (!responsavelCadastrado) {
                await this.pessoaRepository.inativar(pessoaId);
                return res.status(500).json({ error: "Erro ao cadastrar responsável" });
            }

            return res.status(201).json({ id: pessoaId });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async alterar(req, res) {
        try {
            const id = Number(req.params.id);
            const pessoaExistente = await this.pessoaRepository.obter(id);
            if (!pessoaExistente) {
                return res.status(404).json({ error: "Responsável não encontrado" });
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

            const responsavel = new ResponsavelEntity(id, normalizarParentesco(parentesco || responsavelExistente.parentesco));
            const responsavelAtualizado = await this.responsavelRepository.alterar(responsavel);
            if (!responsavelAtualizado) {
                return res.status(500).json({ error: "Erro ao atualizar responsável" });
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
                return res.status(404).json({ error: "Responsável não encontrado" });
            }

            const inativado = await this.responsavelRepository.inativar(id);
            if (!inativado) {
                return res.status(500).json({ error: "Erro ao inativar responsável" });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
