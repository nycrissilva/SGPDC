export default class LocalEntity {
    #id;
    #nome;
    #cep;
    #rua;
    #numero;
    #bairro;
    #cidade;
    #status;

    constructor(id, nome, cep, rua, numero, bairro, cidade, status = 'ATIVO') {
        this.#id = id;
        this.#nome = nome;
        this.#cep = cep;
        this.#rua = rua;
        this.#numero = numero;
        this.#bairro = bairro;
        this.#cidade = cidade;
        this.#status = status;
    }

    get id() {
        return this.#id;
    }

    get nome() {
        return this.#nome;
    }

    get cep() {
        return this.#cep;
    }

    get rua() {
        return this.#rua;
    }

    get numero() {
        return this.#numero;
    }

    get bairro() {
        return this.#bairro;
    }

    get cidade() {
        return this.#cidade;
    }

    get status() {
        return this.#status;
    }

    static toMap(row) {
        return {
            id: row["id"],
            nome: row["nome"],
            cep: row["cep"],
            rua: row["rua"],
            numero: row["numero"],
            bairro: row["bairro"],
            cidade: row["cidade"],
            status: row["status"],
            turmas_ativas: Number(row["turmas_ativas"] || 0),
        };
    }
}
