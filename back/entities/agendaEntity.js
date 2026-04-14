import TurmaEntity from "./turmaEntity.js";

export default class AgendaEntity extends TurmaEntity{
    #id;
    #turma_id;
    #dia_semana;
    #horario_inicio;
    #horario_fim;

    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }

    get turma_id() {
        return this.#turma_id;
    }
    set turma_id(value) {
        this.#turma_id = value;
    }

    get dia_semana() {
        return this.#dia_semana;
    }
    set dia_semana(value) {
        this.#dia_semana = value;
    }

    get horario_inicio() {
        return this.#horario_inicio;
    }
    set horario_inicio(value) {
        this.#horario_inicio = value;
    }

    get horario_fim() {
        return this.#horario_fim;
    }
    set horario_fim(value) {
        this.#horario_fim = value;
    }


    constructor(id, turma_id, dia_semana, horario_inicio, horario_fim) {
        this.#id = id;
        this.#turma_id = turma_id;
        this.#dia_semana = dia_semana;
        this.#horario_inicio = horario_inicio;
        this.#horario_fim = horario_fim;
    }

    validar() {
        return this.#turma_id && this.#dia_semana && this.#horario_fim;
    }

    static toMap(row) {
        return {
            id: row["id"],
            turma_id: row["turma_id"],
            dia_semana: row["dia_semana"],
            horario_inicio: row["horario_inicio"],
            horario_fim: row["horario_fim"],
        };
    }
}
