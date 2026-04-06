import Entity from "./entity.js";

export default class ProfessorEntity extends Entity {
    #id;
    #modalidade;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }

    get modalidade() {
        return this.#modalidade;
    }
    set modalidade(value) {
        this.#modalidade = value;
    }

    constructor(id, modalidade) {
        super();
        this.#id = id;
        this.#modalidade = modalidade;
    }

    validar() {
        return this.#id && this.#modalidade;
    }

    static toMap(row) {
        return new ProfessorEntity(
            row["id"],
            row["modalidade"]
        );
    }
}
