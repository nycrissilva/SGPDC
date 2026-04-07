import PessoaEntity from "./pessoaEntity.js";

export default class FuncionarioEntity extends PessoaEntity {
    #cargo;

    get cargo() {
        return this.#cargo;
    }
    set cargo(value) {
        this.#cargo = value;
    }

    constructor(id, cargo) {
        super(id, null, null, null, null, null);
        this.#cargo = cargo;
    }

    validar() {
        return this.id && this.#cargo;
    }

    static toMap(row) {
        return {
            id: row["id"],
            cargo: row["cargo"],
        };
    }
}
