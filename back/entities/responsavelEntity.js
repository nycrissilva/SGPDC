
import PessoaEntity from "./pessoaEntity.js";

export default class ResponsavelEntity extends PessoaEntity {
    #id;
    #parentesco;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }

    get parentesco() {
        return this.#parentesco;
    }
    set parentesco(value) {
        this.#parentesco = value;
    }

    constructor(id, parentesco) {
        super(id, null, null, null, null, null);
        this.#parentesco = parentesco;
    }

    validar() {
        return this.id && this.#parentesco;
    }

    static toMap(row) {
        return {
            id: row["id"],
            parentesco: row["parentesco"],
        };
    }
}
