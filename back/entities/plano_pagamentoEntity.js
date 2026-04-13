

export default class PessoaEntity  {
    #id;
    #descricao;
    #valor_base;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }

    get descricao() {
        return this.#descricao;
    }
    set descricao(value) {
        this.#descricao = value;
    }

    get valor_base() {
        return this.#valor_base;
    }
    set valor_base(value) {
        this.#valor_base = value;
    }

    constructor(id, descricao, valor_base) {
        this.#id = id;
        this.#descricao = descricao;
        this.#valor_base = valor_base;
    }

    validar() {
        return this.#descricao && this.#valor_base;
    }

    static toMap(row) {
        return {
            id: row["id"],
            descricao: row["descricao"],
            valor_base: row["valor_base"],
        };
    }
}
