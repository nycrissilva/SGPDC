export default class PlanoMensalidadeEntity {
    #id;
    #nome;
    #tipo_plano;
    #qtd_alunas;
    #qtd_cursos;
    #valor_cartao_pix;
    #valor_dinheiro;
    #status;

    constructor(
        id,
        nome,
        tipo_plano,
        qtd_alunas,
        qtd_cursos,
        valor_cartao_pix,
        valor_dinheiro,
        status = 'ATIVO'
    ) {
        this.#id = id;
        this.#nome = nome;
        this.#tipo_plano = tipo_plano;
        this.#qtd_alunas = qtd_alunas;
        this.#qtd_cursos = qtd_cursos;
        this.#valor_cartao_pix = valor_cartao_pix;
        this.#valor_dinheiro = valor_dinheiro;
        this.#status = status;
    }

    get id() {
        return this.#id;
    }

    get nome() {
        return this.#nome;
    }

    get tipo_plano() {
        return this.#tipo_plano;
    }

    get qtd_alunas() {
        return this.#qtd_alunas;
    }

    get qtd_cursos() {
        return this.#qtd_cursos;
    }

    get valor_cartao_pix() {
        return this.#valor_cartao_pix;
    }

    get valor_dinheiro() {
        return this.#valor_dinheiro;
    }

    get status() {
        return this.#status;
    }

    static toMap(row) {
        return {
            id: row["id"],
            nome: row["nome"],
            tipo_plano: row["tipo_plano"],
            qtd_alunas: Number(row["qtd_alunas"] || 0),
            qtd_cursos: Number(row["qtd_cursos"] || 0),
            valor_cartao_pix: Number(row["valor_cartao_pix"] || 0),
            valor_dinheiro: Number(row["valor_dinheiro"] || 0),
            status: row["status"],
            grupos_ativos: Number(row["grupos_ativos"] || 0),
        };
    }
}
