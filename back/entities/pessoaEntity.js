

export default class PessoaEntity  {
    #id;
    #nome;
    #cpf;
    #telefone;
    #email;
    #status;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }

    get nome() {
        return this.#nome;
    }
    set nome(value) {
        this.#nome = value;
    }

    get cpf() {
        return this.#cpf;
    }
    set cpf(value) {
        this.#cpf = value;
    }

    get telefone() {
        return this.#telefone;
    }
    set telefone(value) {
        this.#telefone = value;
    }

    get email() {
        return this.#email;
    }
    set email(value) {
        this.#email = value;
    }

    get status() {
        return this.#status;
    }
    set status(value) {
        this.#status = value;
    }

    constructor(id, nome, cpf, telefone, email, status) {
        super();
        this.#id = id;
        this.#nome = nome;
        this.#cpf = cpf;
        this.#telefone = telefone;
        this.#email = email;
        this.#status = status;
    }

    validar() {
        return this.#nome && this.#cpf && this.#email;
    }

    static toMap(row) {
        return new PessoaEntity(
            row["id"],
            row["nome"],
            row["cpf"],
            row["telefone"],
            row["email"],
            row["status"]
        );
    }
}
