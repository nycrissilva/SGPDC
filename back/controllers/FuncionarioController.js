import PessoaEntity from "../entities/pessoaEntity.js";
import FuncionarioEntity from "../entities/funcionarioEntity.js";
import PessoaRepository from "../repositories/PessoaRepository.js";
import FuncionarioRepository from "../repositories/FuncionarioRespository.js";

export default class FuncionarioController {
    constructor() {
        this.pessoaRepository = new PessoaRepository();
        this.funcionarioRepository = new FuncionarioRepository();
    }

    async listar(req, res) {
        try {
            const filtro = req.query.q || "";
            const pagina = Number(req.query.page || 1);
            const limite = Number(req.query.limit || 20);
            const lista = await this.pessoaRepository.buscar(filtro, "DIRETORIA", pagina, limite);
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
                return res.status(404).json({ error: "Diretoria n�o encontrada" });
            }

            const funcionario = await this.funcionarioRepository.obter(id);
            return res.json({ ...pessoa, ...funcionario });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrar(req, res) {
        try {
            const { nome, cpf, telefone, email, status, cargo } = req.body;

            if (!nome || !cpf || !email || !cargo) {
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

            const funcionario = new FuncionarioEntity(pessoa.id, cargo);
            const funcionarioCadastrado = await this.funcionarioRepository.cadastrar(funcionario);
            if (!funcionarioCadastrado) {
                await this.pessoaRepository.inativar(pessoa.id);
                return res.status(500).json({ error: "Erro ao cadastrar diretoria" });
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
                return res.status(404).json({ error: "Diretoria n�o encontrada" });
            }

            const { nome, cpf, telefone, email, status, cargo } = req.body;
            const funcionarioExistente = await this.funcionarioRepository.obter(id);
            if (!funcionarioExistente) {
                return res.status(404).json({ error: "Diretoria não encontrada" });
            }

            const pessoa = new PessoaEntity(id, nome || pessoaExistente.nome, cpf || pessoaExistente.cpf,
                telefone || pessoaExistente.telefone, email || pessoaExistente.email, status || pessoaExistente.status);

            const pessoaAtualizada = await this.pessoaRepository.alterar(pessoa);
            if (!pessoaAtualizada) {
                return res.status(500).json({ error: "Erro ao atualizar pessoa" });
            }

            const funcionario = new FuncionarioEntity(id, cargo || funcionarioExistente.cargo);
            const funcionarioAtualizado = await this.funcionarioRepository.alterar(funcionario);
            if (!funcionarioAtualizado) {
                return res.status(500).json({ error: "Erro ao atualizar diretoria" });
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
                return res.status(404).json({ error: "Diretoria n�o encontrada" });
            }

            const inativado = await this.funcionarioRepository.inativar(id);
            if (!inativado) {
                return res.status(500).json({ error: "Erro ao inativar diretoria" });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
