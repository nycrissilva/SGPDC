import PessoaEntity from "../entities/pessoaEntity.js";
import PessoaRepository from "../repositories/PessoaRepository.js";

export default class PessoaController {
    constructor() {
        this.pessoaRepository = new PessoaRepository();
    }

    normalizarCpf(cpf) {
        return String(cpf ?? "").replace(/\D/g, "");
    }

    cpfValido(cpf) {
        const digitos = this.normalizarCpf(cpf);
        if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) {
            return false;
        }

        const calcularDigito = (tamanho) => {
            let soma = 0;
            for (let i = 0; i < tamanho; i += 1) {
                soma += Number(digitos[i]) * (tamanho + 1 - i);
            }

            const resto = (soma * 10) % 11;
            return resto === 10 ? 0 : resto;
        };

        return calcularDigito(9) === Number(digitos[9])
            && calcularDigito(10) === Number(digitos[10]);
    }

    async validarCpfParaSalvar(cpf, idIgnorado = null) {
        const cpfNormalizado = this.normalizarCpf(cpf);
        if (!this.cpfValido(cpfNormalizado)) {
            return { error: "CPF inválido" };
        }

        const pessoaExistente = await this.pessoaRepository.obterPorCpf(cpfNormalizado);
        if (pessoaExistente && Number(pessoaExistente.id) !== Number(idIgnorado)) {
            return { error: "CPF já cadastrado" };
        }

        return { cpf: cpfNormalizado };
    }

    /**
     * Retorna o tipo de filtro para busca (ex: "ALUNO", "PROFESSOR")
     * Deve ser sobrescrito pelas subclasses
     */
    obterTipoFiltro() {
        throw new Error("obterTipoFiltro() deve ser implementado na subclasse");
    }

    /**
     * Retorna o nome da entidade (ex: "Aluno", "Professor")
     * Deve ser sobrescrito pelas subclasses
     */
    obterNomeEntidade() {
        throw new Error("obterNomeEntidade() deve ser implementado na subclasse");
    }

    /**
     * Retorna o repository específico da subentidade
     * Deve ser sobrescrito pelas subclasses
     */
    obterRepositorioEspecifico() {
        throw new Error("obterRepositorioEspecifico() deve ser implementado na subclasse");
    }

    /**
     * Lista todas as pessoas do tipo específico
     */
    async listar(req, res) {
        try {
            const filtro = req.query.q || "";
            const pagina = Number(req.query.page || 1);
            const limite = Number(req.query.limit || 20);
            const lista = await this.pessoaRepository.buscar(
                filtro,
                this.obterTipoFiltro(),
                pagina,
                limite
            );
            return res.json(lista);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtém uma pessoa específica com seus dados da subentidade
     */
    async obter(req, res) {
        try {
            const id = Number(req.params.id);
            const pessoa = await this.pessoaRepository.obter(id);
            if (!pessoa) {
                return res.status(404).json({
                    error: `${this.obterNomeEntidade()} não encontrado`
                });
            }

            const especifico = await this.obterRepositorioEspecifico().obter(id);
            return res.json({ ...pessoa, ...especifico });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Método auxiliar para cadastrado (deve ser sobrescrito com lógica específica)
     */
    async cadastrar(req, res) {
        throw new Error("cadastrar() deve ser implementado na subclasse");
    }

    /**
     * Método auxiliar para alteração (deve ser sobrescrito com lógica específica)
     */
    async alterar(req, res) {
        throw new Error("alterar() deve ser implementado na subclasse");
    }

    /**
     * Remove/inativa uma pessoa
     */
    async remover(req, res) {
        try {
            const id = Number(req.params.id);
            const pessoaExistente = await this.pessoaRepository.obter(id);
            if (!pessoaExistente) {
                return res.status(404).json({
                    error: `${this.obterNomeEntidade()} não encontrado`
                });
            }

            const removido = await this.pessoaRepository.inativar(id);
            if (!removido) {
                return res.status(500).json({ error: "Erro ao remover" });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
