import Entity from "./entity.js";

export default class FuncionarioEntity extends Entity {
    #id;
    #cargo;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }

    get cargo() {
        return this.#cargo;
    }
    set cargo(value) {
        this.#cargo = value;
    }

    constructor(id, cargo) {
        super();
        this.#id = id;
        this.#cargo = cargo;
    }

    validar() {
        return this.#id && this.#cargo;
    }

    static toMap(row) {
        return new FuncionarioEntity(
            row["id"],
            row["cargo"]
        );
    }
}
