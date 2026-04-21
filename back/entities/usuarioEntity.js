

export default class UsuarioEntity {
    #id;
    #pessoa_id;
    #email;
    #senha;
    #perfil;
    #primeiro_acesso;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }

    get pessoa_id() {
        return this.#pessoa_id;
    }
    set pessoa_id(value) {
        this.#pessoa_id = value;
    }

    get email() {
        return this.#email;
    }
    set email(value) {
        this.#email = value;
    }

    get senha() {
        return this.#senha;
    }
    set senha(value) {
        this.#senha = value;
    }

    get perfil() {
        return this.#perfil;
    }
    set perfil(value) {
        this.#perfil = value;
    }

    get primeiro_acesso() {
        return this.#primeiro_acesso;
    }
    set primeiro_acesso(value) {
        this.#primeiro_acesso = value;
    }

    constructor(id, pessoa_id, email, senha, perfil, primeiro_acesso = true) {
        this.#id = id;
        this.#pessoa_id = pessoa_id;
        this.#email = email;
        this.#senha = senha;
        this.#perfil = perfil;
        this.#primeiro_acesso = primeiro_acesso;
    }

    validar() {
        return this.#pessoa_id && this.#email && this.#senha && this.#perfil;
    }

    static toMap(row) {
        return {
            id: row["id"],
            pessoa_id: row["pessoa_id"],
            email: row["email"],
            senha: row["senha"],
            perfil: row["perfil"],
            primeiro_acesso: row["primeiro_acesso"] === 1 || row["primeiro_acesso"] === true,
        };
    }
}
