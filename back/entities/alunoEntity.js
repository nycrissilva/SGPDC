import Entity from "./entity.js";

export default class AlunoEntity extends Entity {
    #id;
    #responsavel_id;
    #data_nascimento;
    #data_matricula;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }

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
        super();
        this.#id = id;
        this.#responsavel_id = responsavel_id;
        this.#data_nascimento = data_nascimento;
        this.#data_matricula = data_matricula;
    }

    validar() {
        return this.#id && this.#responsavel_id && this.#data_nascimento && this.#data_matricula;
    }

    static toMap(row) {
        return new AlunoEntity(
            row["id"],
            row["responsavel_id"],
            row["data_nascimento"],
            row["data_matricula"]
        );
    }
}
