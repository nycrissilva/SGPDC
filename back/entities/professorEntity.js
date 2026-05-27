
import PessoaEntity from "./pessoaEntity.js";

export default class ProfessorEntity extends PessoaEntity {
    #id;
    #modalidade;
    #pessoa;

    get modalidade() {
        return this.#modalidade;
    }
    set modalidade(value) {
        this.#modalidade = value;
    }

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }

    get pessoa() {
        return this.#pessoa;
    }
    set pessoa(value) {
        this.#pessoa = value;
    }

    constructor(id, modalidade, pessoa) {
        super(id, null, null, null, null, null);
        this.#id = id;
        this.#modalidade = modalidade;
        this.#pessoa = pessoa;
    }

    validar() {
        return this.id && this.#modalidade;
    }

    static toMap(row) {
        return {
            id: row["id"],
            modalidade: row["modalidade"],
            data_nascimento: PessoaEntity.formatDateValue(row["data_nascimento"]),
        };
    }
}
