
import PessoaEntity from "./pessoaEntity.js";

export default class AlunoEntity extends PessoaEntity {
    #responsavel_id;
    #data_nascimento;
    #data_matricula;

    get responsavel_id() {
        return this.#responsavel_id;
    }
    set responsavel_id(value) {
        this.#responsavel_id = value;
    }

    get data_nascimento() {
        return this.#data_nascimento;
    }
    set data_nascimento(value) {
        this.#data_nascimento = value;
    }

    get data_matricula() {
        return this.#data_matricula;
    }
    set data_matricula(value) {
        this.#data_matricula = value;
    }

    constructor(id, responsavel_id, data_nascimento, data_matricula) {
        super(id, null, null, null, null, null);
        this.#responsavel_id = responsavel_id;
        this.#data_nascimento = data_nascimento;
        this.#data_matricula = data_matricula;
    }

    validar() {
        return this.id && this.#responsavel_id && this.#data_nascimento && this.#data_matricula;
    }

    static toMap(row) {
        return {
            id: row["id"],
            responsavel_id: row["responsavel_id"],
            data_nascimento: row["data_nascimento"],
            data_matricula: row["data_matricula"],
        };
    }
}
