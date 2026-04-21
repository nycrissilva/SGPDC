import PessoaController from "./PessoaController.js";
import PessoaEntity from "../entities/pessoaEntity.js";
import FuncionarioEntity from "../entities/funcionarioEntity.js";
import FuncionarioRepository from "../repositories/FuncionarioRespository.js";
import UsuarioEntity from "../entities/usuarioEntity.js";
import UsuarioRepository from "../repositories/UsuarioRepository.js";
import { hashPassword, buildInitialPassword } from '../utils/passwordUtils.js';

export default class FuncionarioController extends PessoaController {
    constructor() {
        super();
        this.funcionarioRepository = new FuncionarioRepository();
        this.usuarioRepository = new UsuarioRepository();
    }

    obterTipoFiltro() {
        return "DIRETORIA";
    }

    obterNomeEntidade() {
        return "Funcionário";
    }

    obterRepositorioEspecifico() {
        return this.funcionarioRepository;
    }

    async cadastrar(req, res) {
        try {
            const { nome, cpf, telefone, email, status, cargo, data_nascimento } = req.body;

            if (!nome || !cpf || !email || !cargo || !data_nascimento) {
                return res.status(400).json({ error: "Campos obrigatórios faltando" });
            }

            const pessoaExistente = await this.pessoaRepository.obterPorCpf(cpf);
            if (pessoaExistente) {
                return res.status(400).json({ error: "CPF já cadastrado" });
            }

            const usuarioExistente = await this.usuarioRepository.obterPorEmail(email);
            if (usuarioExistente) {
                return res.status(400).json({ error: "Já existe um usuário cadastrado com este email" });
            }

            const pessoa = new PessoaEntity(null, nome, cpf, telefone, email, status || "ATIVO", data_nascimento);
            const pessoaCadastrada = await this.pessoaRepository.cadastrar(pessoa);
            if (!pessoaCadastrada) {
                return res.status(500).json({ error: "Erro ao cadastrar pessoa" });
            }

            const funcionario = new FuncionarioEntity(pessoa.id, cargo);
            const funcionarioCadastrado = await this.funcionarioRepository.cadastrar(funcionario);
            if (!funcionarioCadastrado) {
                await this.pessoaRepository.inativar(pessoa.id);
                return res.status(500).json({ error: "Erro ao cadastrar funcionário" });
            }

            const initialPassword = buildInitialPassword(data_nascimento);
            if (!initialPassword) {
                await this.funcionarioRepository.inativar(pessoa.id);
                await this.pessoaRepository.inativar(pessoa.id);
                return res.status(400).json({ error: "Data de nascimento inválida para gerar senha inicial" });
            }

            const usuarioSenhaHash = await hashPassword(initialPassword);
            const usuario = new UsuarioEntity(null, pessoa.id, email, usuarioSenhaHash, "FUNCIONARIO", true);
            const usuarioCadastrado = await this.usuarioRepository.cadastrar(usuario);
            if (!usuarioCadastrado) {
                await this.funcionarioRepository.inativar(pessoa.id);
                await this.pessoaRepository.inativar(pessoa.id);
                return res.status(500).json({ error: "Erro ao cadastrar usuário do funcionário" });
            }

            return res.status(201).json({ id: pessoa.id, senhaInicial: initialPassword });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async alterar(req, res) {
        try {
            const id = Number(req.params.id);
            const pessoaExistente = await this.pessoaRepository.obter(id);
            if (!pessoaExistente) {
                return res.status(404).json({ error: "Funcionário não encontrado" });
            }

            const { nome, cpf, telefone, email, status, cargo, data_nascimento } = req.body;
            const funcionarioExistente = await this.funcionarioRepository.obter(id);
            if (!funcionarioExistente) {
                return res.status(404).json({ error: "Funcionário não encontrado" });
            }

            const pessoa = new PessoaEntity(id, nome || pessoaExistente.nome, cpf || pessoaExistente.cpf,
                telefone || pessoaExistente.telefone, email || pessoaExistente.email, status || pessoaExistente.status, data_nascimento || pessoaExistente.data_nascimento);

            const pessoaAtualizada = await this.pessoaRepository.alterar(pessoa);
            if (!pessoaAtualizada) {
                return res.status(500).json({ error: "Erro ao atualizar pessoa" });
            }

            const funcionario = new FuncionarioEntity(id, cargo || funcionarioExistente.cargo);
            const funcionarioAtualizado = await this.funcionarioRepository.alterar(funcionario);
            if (!funcionarioAtualizado) {
                return res.status(500).json({ error: "Erro ao atualizar funcionário" });
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
                return res.status(404).json({ error: "Funcionário não encontrado" });
            }

            const inativado = await this.funcionarioRepository.inativar(id);
            if (!inativado) {
                return res.status(500).json({ error: "Erro ao inativar funcionário" });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
