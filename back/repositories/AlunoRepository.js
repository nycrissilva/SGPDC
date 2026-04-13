import AlunoEntity from "../entities/alunoEntity.js";
import Repository from "./repository.js";

export default class AlunoRepository extends Repository {
    constructor() {
        super();
    }

    async listar() {
        let sql = `
            select a.*
            from aluno a
            join pessoa p on p.id = a.id
            where p.status = 'ATIVO'`;

        let rows = await this.banco.ExecutaComando(sql);
        let lista = [];
        for (let row of rows) {
            lista.push(AlunoEntity.toMap(row));
        }
        return lista;
    }

    async obter(id) {
        let sql = `
            select
                a.*,
                group_concat(distinct mt.turma_id) as turma_ids
            from aluno a
            left join matricula m on m.aluno_id = a.id and m.status = 'ATIVA'
            left join matricula_turma mt on mt.matricula_id = m.id
            where a.id = ?
            group by a.id`;
        let valores = [id];

        let rows = await this.banco.ExecutaComando(sql, valores);
        if (rows.length === 0)
            return null;

        return AlunoEntity.toMap(rows[0]);
    }

    async cadastrar(entidade) {
        let sql = `insert into aluno (id, responsavel_id, data_nascimento, data_matricula)
                   values (?, ?, ?, ?)`;
        let valores = [
            entidade.id,
            entidade.responsavel_id,
            entidade.data_nascimento,
            entidade.data_matricula
        ];

        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }

    async alterar(entidade) {
        let sql = `update aluno set responsavel_id = ?, data_nascimento = ?, data_matricula = ? where id = ?`;
        let valores = [
            entidade.responsavel_id,
            entidade.data_nascimento,
            entidade.data_matricula,
            entidade.id
        ];

        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }

    async inativar(id) {
        let sql = "update pessoa set status = 'INATIVO' where id = ?";
        let valores = [id];
        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }

    async deletar(id) {
        return await this.inativar(id);
    }

    async criarMatricula(alunoId, data_matricula, plano_pagamento_id = null, status = "ATIVA") {
        const sql = `insert into matricula (aluno_id, data_matricula, status, data_cancelamento, plano_pagamento_id) values (?, ?, ?, null, ?)`;
        const valores = [alunoId, data_matricula, status, plano_pagamento_id];
        return await this.banco.ExecutaComandoLastInserted(sql, valores);
    }

    async criarMatriculaTurma(matriculaId, turmaId) {
        const sql = `insert into matricula_turma (matricula_id, turma_id) values (?, ?)`;
        const valores = [matriculaId, turmaId];
        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }

    async existeMatriculaAtiva(alunoId, turmaId) {
        const sql = `
            select count(*) as total
            from matricula m
            join matricula_turma mt on mt.matricula_id = m.id
            where m.aluno_id = ?
              and mt.turma_id = ?
              and m.status = 'ATIVA'`;
        const valores = [alunoId, turmaId];
        const rows = await this.banco.ExecutaComando(sql, valores);
        return rows.length > 0 && rows[0].total > 0;
    }

    async deletarMatricula(matriculaId) {
        const sql = `delete from matricula where id = ?`;
        return await this.banco.ExecutaComandoNonQuery(sql, [matriculaId]);
    }

    async verificarMensalidadesPendentes(alunoId) {
        let sql = `
            select count(*) as pendencias
            from conta_receber cr
            join matricula m on m.id = cr.matricula_id
            where m.aluno_id = ?
            and cr.status = 'PENDENTE'`;
        let valores = [alunoId];

        let rows = await this.banco.ExecutaComando(sql, valores);
        return rows.length > 0 && rows[0].pendencias > 0;
    }
}
