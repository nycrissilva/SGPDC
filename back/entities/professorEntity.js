
import PessoaEntity from "./pessoaEntity.js";

export default class ProfessorEntity extends PessoaEntity {
    #modalidade;

    get modalidade() {
        return this.#modalidade;
    }
    set modalidade(value) {
        this.#modalidade = value;
    }

    constructor(id, modalidade) {
        super(id, null, null, null, null, null);
        this.#modalidade = modalidade;
    }

    validar() {
        return this.id && this.#modalidade;
    }

    static toMap(row) {
        return {
            id: row["id"],
            modalidade: row["modalidade"],
        };
    }
}
