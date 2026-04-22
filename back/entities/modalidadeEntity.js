export default class ModalidadeEntity {
    #id;
    #nome;
    #status;

    constructor(id, nome, status = 'ATIVA') {
        this.#id = id;
        this.#nome = nome;
        this.#status = status;
    }

    get id() {
        return this.#id;
    }

    get nome() {
        return this.#nome;
    }

    get status() {
        return this.#status;
    }

    static toMap(row) {
        return {
            id: row["id"],
            nome: row["nome"],
            status: row["status"],
            turmas_ativas: Number(row["turmas_ativas"] || 0),
        };
    }
}
