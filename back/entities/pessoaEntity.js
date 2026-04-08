

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
        return {
            id: row["id"],
            nome: row["nome"],
            cpf: row["cpf"],
            telefone: row["telefone"],
            email: row["email"],
            status: row["status"],
            cargo: row["cargo"],
            parentesco: row["parentesco"],
            responsavel_id: row["responsavel_id"],
            data_nascimento: row["data_nascimento"],
            data_matricula: row["data_matricula"],
            modalidade: row["modalidade"],
        };
    }
}
