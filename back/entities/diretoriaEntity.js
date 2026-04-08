
import PessoaEntity from "./pessoaEntity.js";

export default class DiretoriaEntity extends PessoaEntity {
    #id;
    #cargo;
    #pessoa;

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

    get pessoa() {
        return this.#pessoa;
    }
    set pessoa(value) {
        this.#pessoa = value;
    }

    constructor(id, cargo, pessoa) {
        super(id, null, null, null, null, null);
        this.#id = id;
        this.#cargo = cargo;
        this.#pessoa = pessoa;
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
