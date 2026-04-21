import PessoaController from "./PessoaController.js";
import PessoaEntity from "../entities/pessoaEntity.js";
import ProfessorEntity from "../entities/professorEntity.js";
import ProfessorRepository from "../repositories/ProfessorRepository.js";
import UsuarioEntity from "../entities/usuarioEntity.js";
import UsuarioRepository from "../repositories/UsuarioRepository.js";
import { hashPassword, buildInitialPassword } from '../utils/passwordUtils.js';

export default class ProfessorController extends PessoaController {
    constructor() {
        super();
        this.professorRepository = new ProfessorRepository();
        this.usuarioRepository = new UsuarioRepository();
    }

    obterTipoFiltro() {
        return "PROFESSOR";
    }

    obterNomeEntidade() {
        return "Professor";
    }

    obterRepositorioEspecifico() {
        return this.professorRepository;
    }

    async cadastrar(req, res) {
        try {
            const { nome, cpf, telefone, email, status, modalidade, data_nascimento } = req.body;

            if (!nome || !cpf || !email || !modalidade || !data_nascimento) {
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

            const professor = new ProfessorEntity(pessoa.id, modalidade);
            const professorCadastrado = await this.professorRepository.cadastrar(professor);
            if (!professorCadastrado) {
                await this.pessoaRepository.inativar(pessoa.id);
                return res.status(500).json({ error: "Erro ao cadastrar professor" });
            }

            const initialPassword = buildInitialPassword(data_nascimento);
            if (!initialPassword) {
                await this.professorRepository.inativar(pessoa.id);
                await this.pessoaRepository.inativar(pessoa.id);
                return res.status(400).json({ error: "Data de nascimento inválida para gerar senha inicial" });
            }
            console.log(`Senha inicial gerada: ${initialPassword} para data: ${data_nascimento}`);
            const usuarioSenhaHash = await hashPassword(initialPassword);
            const usuario = new UsuarioEntity(null, pessoa.id, email, usuarioSenhaHash, "PROFESSOR", true);
            const usuarioCadastrado = await this.usuarioRepository.cadastrar(usuario);
            if (!usuarioCadastrado) {
                await this.professorRepository.inativar(pessoa.id);
                await this.pessoaRepository.inativar(pessoa.id);
                return res.status(500).json({ error: "Erro ao cadastrar usuário do professor" });
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
                return res.status(404).json({ error: "Professor não encontrado" });
            }

            const { nome, cpf, telefone, email, status, modalidade, data_nascimento } = req.body;
            const professorExistente = await this.professorRepository.obter(id);
            if (!professorExistente) {
                return res.status(404).json({ error: "Professor não encontrado" });
            }

            const pessoa = new PessoaEntity(id, nome || pessoaExistente.nome, cpf || pessoaExistente.cpf,
                telefone || pessoaExistente.telefone, email || pessoaExistente.email, status || pessoaExistente.status, data_nascimento || pessoaExistente.data_nascimento);

            const pessoaAtualizada = await this.pessoaRepository.alterar(pessoa);
            if (!pessoaAtualizada) {
                return res.status(500).json({ error: "Erro ao atualizar pessoa" });
            }

            const professor = new ProfessorEntity(id, modalidade || professorExistente.modalidade);
            const professorAtualizado = await this.professorRepository.alterar(professor);
            if (!professorAtualizado) {
                return res.status(500).json({ error: "Erro ao atualizar professor" });
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
                return res.status(404).json({ error: "Professor não encontrado" });
            }

            const inativado = await this.professorRepository.inativar(id);
            if (!inativado) {
                return res.status(500).json({ error: "Erro ao inativar professor" });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
