

export default class MatriculaEntity  {
    #id;
    #aluno_id;
    #data_matricula;
    #status;
    #data_cancelamento;
    #plano_pagamento_id;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }

    get aluno_id() {
        return this.#aluno_id;
    }
    set aluno_id(value) {
        this.#aluno_id = value;
    }

    get data_matricula() {
        return this.#data_matricula;
    }
    set data_matricula(value) {
        this.#data_matricula = value;
    }

    get data_cancelamento() {
        return this.#data_cancelamento;
    }
    set data_cancelamento(value) {
        this.#data_cancelamento = value;
    }

    get plano_pagamento_id() {
        return this.#plano_pagamento_id;
    }
    set plano_pagamento_id(value) {
        this.#plano_pagamento_id = value;
    }

    get status() {
        return this.#status;
    }
    set status(value) {
        this.#status = value;
    }

    constructor(id, aluno_id, data_matricula, data_cancelamento, plano_pagamento_id, status) {
        this.#id = id;
        this.#aluno_id = aluno_id;
        this.#data_matricula = data_matricula;
        this.#data_cancelamento = data_cancelamento;
        this.#plano_pagamento_id = plano_pagamento_id;
        this.#status = status;
    }

    validar() {
        return this.#aluno_id && this.#data_matricula && this.#plano_pagamento_id;
    }

    static toMap(row) {
        return {
            id: row["id"],
            aluno_id: row["aluno_id"],
            data_matricula: row["data_matricula"],
            data_cancelamento: row["data_cancelamento"],
            plano_pagamento_id: row["plano_pagamento_id"],
            status: row["status"],
        };
    }
}
