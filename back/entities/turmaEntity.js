
export default class TurmaEntity {
    #id;
    #nome;
    #modalidade;
    #descricao;
    #status;

    get id() {
        return this.#id;
    }
    get nome() {
        return this.#nome;
    }
    get modalidade() {
        return this.#modalidade;
    }
    get descricao() {
        return this.#descricao;
    }
    get status() {
        return this.#status;
    }

    set id(id) {
        this.#id = id;
    }
    set nome(nome) {
        this.#nome = nome;
    }
    set modalidade(modalidade) {
        this.#modalidade = modalidade;
    }
    set descricao(descricao) {
        this.#descricao = descricao;
    }
    set status(status) {
        this.#status = status;
    }

    constructor(id, nome, modalidade, descricao, status) {
        this.#id = id;
        this.#nome = nome;
        this.#modalidade = modalidade;
        this.#descricao = descricao;
        this.#status = status;
    }

    static toMap(row){
        return{
            id: row["id"],
            nome: row["nome"],
            modalidade: row["modalidade"],
            descricao: row["descricao"],
            status: row["status"],
        }
    }

}