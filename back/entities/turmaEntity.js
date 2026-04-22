export default class TurmaEntity {
    #id;
    #nome;
    #modalidade;
    #modalidade_id;
    #nivel;
    #descricao;
    #status;
    #dia_semana;
    #horario_inicio;
    #horario_fim;
    #local_id;
    #local_nome;
    #professor_ids;
    #professor_names;

    get id() {
        return this.#id;
    }
    get nome() {
        return this.#nome;
    }
    get modalidade() {
        return this.#modalidade;
    }
    get modalidade_id() {
        return this.#modalidade_id;
    }
    get nivel() {
        return this.#nivel;
    }
    get descricao() {
        return this.#descricao;
    }
    get status() {
        return this.#status;
    }
    get dia_semana() {
        return this.#dia_semana;
    }
    get horario_inicio() {
        return this.#horario_inicio;
    }
    get horario_fim() {
        return this.#horario_fim;
    }
    get local_id() {
        return this.#local_id;
    }
    get local_nome() {
        return this.#local_nome;
    }
    get professor_ids() {
        return this.#professor_ids;
    }
    get professor_names() {
        return this.#professor_names;
    }

    constructor(
        id,
        nome,
        modalidade,
        modalidade_id,
        nivel,
        descricao,
        status,
        dia_semana,
        horario_inicio,
        horario_fim,
        local_id,
        local_nome = null,
        professor_ids = [],
        professor_names = []
    ) {
        this.#id = id;
        this.#nome = nome;
        this.#modalidade = modalidade;
        this.#modalidade_id = modalidade_id;
        this.#nivel = nivel;
        this.#descricao = descricao;
        this.#status = status;
        this.#dia_semana = dia_semana;
        this.#horario_inicio = horario_inicio;
        this.#horario_fim = horario_fim;
        this.#local_id = local_id;
        this.#local_nome = local_nome;
        this.#professor_ids = professor_ids;
        this.#professor_names = professor_names;
    }

    static toMap(row) {
        return {
            id: row["id"],
            nome: row["nome"],
            modalidade: row["modalidade_nome"] || row["modalidade"],
            modalidade_id: row["modalidade_id"] ? Number(row["modalidade_id"]) : null,
            nivel: row["nivel"],
            descricao: row["descricao"],
            status: row["status"],
            dia_semana: row["dia_semana"],
            horario_inicio: row["horario_inicio"],
            horario_fim: row["horario_fim"],
            local_id: row["local_id"] ? Number(row["local_id"]) : null,
            local_nome: row["local_nome"] || null,
            professor_ids: row["professor_ids"] ? String(row["professor_ids"]).split(",").map((id) => Number(id)) : [],
            professor_names: row["professor_names"] ? String(row["professor_names"]).split(",") : [],
        };
    }
}
