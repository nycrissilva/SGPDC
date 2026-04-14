
export default class TurmaEntity {
    #id;
    #nome;
    #modalidade;
    #nivel;
    #descricao;
    #status;
    #dia_semana;
    #horario_inicio;
    #horario_fim;
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
    get professor_ids() {
        return this.#professor_ids;
    }
    get professor_names() {
        return this.#professor_names;
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
    set nivel(nivel) {
        this.#nivel = nivel;
    }
    set descricao(descricao) {
        this.#descricao = descricao;
    }
    set status(status) {
        this.#status = status;
    }
    set dia_semana(value) {
        this.#dia_semana = value;
    }
    set horario_inicio(value) {
        this.#horario_inicio = value;
    }
    set horario_fim(value) {
        this.#horario_fim = value;
    }
    set professor_ids(value) {
        this.#professor_ids = value;
    }
    set professor_names(value) {
        this.#professor_names = value;
    }

    constructor(id, nome, modalidade, nivel, descricao, status, dia_semana, horario_inicio, horario_fim, professor_ids = [], professor_names = []) {
        this.#id = id;
        this.#nome = nome;
        this.#modalidade = modalidade;
        this.#nivel = nivel;
        this.#descricao = descricao;
        this.#status = status;
        this.#dia_semana = dia_semana;
        this.#horario_inicio = horario_inicio;
        this.#horario_fim = horario_fim;
        this.#professor_ids = professor_ids;
        this.#professor_names = professor_names;
    }

    static toMap(row) {
        return {
            id: row["id"],
            nome: row["nome"],
            modalidade: row["modalidade"],
            nivel: row["nivel"],
            descricao: row["descricao"],
            status: row["status"],
            dia_semana: row["dia_semana"],
            horario_inicio: row["horario_inicio"],
            horario_fim: row["horario_fim"],
            professor_ids: row["professor_ids"] ? String(row["professor_ids"]).split(",").map((id) => Number(id)) : [],
            professor_names: row["professor_names"] ? String(row["professor_names"]).split(",") : [],
        };
    }
}
