export default class PresencaEntity {
    #id;
    #matricula_turma_id;
    #data;
    #presente;

    constructor(id, matricula_turma_id, data, presente) {
        this.#id = id;
        this.#matricula_turma_id = matricula_turma_id;
        this.#data = data;
        this.#presente = presente;
    }

    get id() {
        return this.#id;
    }

    get matricula_turma_id() {
        return this.#matricula_turma_id;
    }

    get data() {
        return this.#data;
    }

    get presente() {
        return this.#presente;
    }

    validar() {
        return this.#matricula_turma_id && this.#data != null;
    }

    static toMap(row) {
        return {
            id: row["id"],
            matricula_turma_id: row["matricula_turma_id"],
            data: row["data"],
            presente: row["presente"] === 1 || row["presente"] === true,
        };
    }
}
