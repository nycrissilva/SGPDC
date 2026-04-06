

export default class ResponsavelEntity {
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
        super();
        this.#id = id;
        this.#parentesco = parentesco;
    }

    validar() {
        return this.#id && this.#parentesco;
    }

    static toMap(row) {
        return new ResponsavelEntity(
            row["id"],
            row["parentesco"]
        );
    }
}
