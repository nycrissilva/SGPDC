import PessoaController from "./PessoaController.js";
import PessoaEntity from "../entities/pessoaEntity.js";
import ProfessorEntity from "../entities/professorEntity.js";
import ProfessorRepository from "../repositories/ProfessorRepository.js";

export default class ProfessorController extends PessoaController {
    constructor() {
        super();
        this.professorRepository = new ProfessorRepository();
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
            const { nome, cpf, telefone, email, status, modalidade } = req.body;

            if (!nome || !cpf || !email || !modalidade) {
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

            const professor = new ProfessorEntity(pessoa.id, modalidade);
            const professorCadastrado = await this.professorRepository.cadastrar(professor);
            if (!professorCadastrado) {
                await this.pessoaRepository.inativar(pessoa.id);
                return res.status(500).json({ error: "Erro ao cadastrar professor" });
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
                return res.status(404).json({ error: "Professor não encontrado" });
            }

            const { nome, cpf, telefone, email, status, modalidade } = req.body;
            const professorExistente = await this.professorRepository.obter(id);
            if (!professorExistente) {
                return res.status(404).json({ error: "Professor não encontrado" });
            }

            const pessoa = new PessoaEntity(id, nome || pessoaExistente.nome, cpf || pessoaExistente.cpf,
                telefone || pessoaExistente.telefone, email || pessoaExistente.email, status || pessoaExistente.status);

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
