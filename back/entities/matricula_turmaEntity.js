

export default class PessoaEntity  {
    #id;
    #matricula_id;
    #turma_id;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }

    get matricula_id() {
        return this.#matricula_id;
    }
    set matricula_id(value) {
        this.#matricula_id = value;
    }

    get turma_id() {
        return this.#turma_id;
    }
    set turma_id(value) {
        this.#turma_id = value;
    }

    constructor(id, matricula_id, turma_id) {
        this.#id = id;
        this.#matricula_id = matricula_id;
        this.#turma_id = turma_id;
    }

    validar() {
        return this.#matricula_id && this.#turma_id;
    }

    static toMap(row) {
        return {
            id: row["id"],
            matricula_id: row["matricula_id"],
            turma_id: row["turma_id"],
        };
    }
}
