import PessoaController from "./PessoaController.js";
import PessoaEntity from "../entities/pessoaEntity.js";
import AlunoEntity from "../entities/alunoEntity.js";
import AlunoRepository from "../repositories/AlunoRepository.js";

export default class AlunoController extends PessoaController {
    constructor() {
        super();
        this.alunoRepository = new AlunoRepository();
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
                data_matricula
            } = req.body;

            if (!nome || !cpf || !data_nascimento || !data_matricula) {
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

            const aluno = new AlunoEntity(pessoa.id, responsavel_id, data_nascimento, data_matricula);
            const alunoCadastrado = await this.alunoRepository.cadastrar(aluno);
            if (!alunoCadastrado) {
                await this.pessoaRepository.inativar(pessoa.id);
                return res.status(500).json({ error: "Erro ao cadastrar aluno" });
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

            const pessoa = new PessoaEntity(id, nome || pessoaExistente.nome, cpf || pessoaExistente.cpf,
                telefone || pessoaExistente.telefone, email || pessoaExistente.email, status || pessoaExistente.status);

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
}
