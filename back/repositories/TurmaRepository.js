import Repository from "./repository.js";
import TurmaEntity from "../entities/turmaEntity.js";

export default class TurmaRepository extends Repository {
    async listar({ nivel, modalidade, professorId, sort } = {}) {
        let sql = `
            select
                t.id,
                t.nome,
                t.modalidade,
                t.modalidade_id,
                m.nome as modalidade_nome,
                t.nivel,
                t.descricao,
                t.status,
                a.dia_semana,
                a.horario_inicio,
                a.horario_fim,
                t.local_id,
                l.nome as local_nome,
                group_concat(distinct pt.professor_id) as professor_ids,
                group_concat(distinct p.nome) as professor_names
            from turma t
            left join modalidade m on m.id = t.modalidade_id
            left join local_aula l on l.id = t.local_id
            left join agenda a on a.turma_id = t.id
            left join professor_turma pt on pt.turma_id = t.id
            left join pessoa p on p.id = pt.professor_id
            where t.status = 'ATIVA'`;

        const values = [];
        if (modalidade) {
            sql += ` and upper(coalesce(m.nome, t.modalidade)) = upper(?)`;
            values.push(modalidade);
        }
        if (nivel) {
            sql += ` and upper(t.nivel) like upper(?)`;
            values.push(`%${nivel}%`);
        }
        if (professorId) {
            sql += ` and pt.professor_id = ?`;
            values.push(professorId);
        }

        sql += ` group by t.id`;

        if (sort === "nivel") {
            sql += ` order by t.nivel asc, t.nome asc`;
        } else if (sort === "nome") {
            sql += ` order by t.nome asc`;
        } else {
            sql += ` order by t.id desc`;
        }

        const rows = await this.banco.ExecutaComando(sql, values);
        return rows.map((row) => TurmaEntity.toMap(row));
    }

    async listarPorProfessor(professorId) {
        const sql = `
            select
                t.id,
                t.nome,
                t.modalidade,
                t.modalidade_id,
                m.nome as modalidade_nome,
                t.nivel,
                t.descricao,
                t.status,
                a.dia_semana,
                a.horario_inicio,
                a.horario_fim,
                t.local_id,
                l.nome as local_nome,
                group_concat(distinct pt.professor_id) as professor_ids,
                group_concat(distinct p.nome) as professor_names
            from turma t
            left join modalidade m on m.id = t.modalidade_id
            left join local_aula l on l.id = t.local_id
            left join agenda a on a.turma_id = t.id
            join professor_turma pt on pt.turma_id = t.id
            left join pessoa p on p.id = pt.professor_id
            where t.status = 'ATIVA'
              and pt.professor_id = ?
            group by t.id
            order by t.nome asc`;

        const rows = await this.banco.ExecutaComando(sql, [professorId]);
        return rows.map((row) => TurmaEntity.toMap(row));
    }

    async obter(id) {
        const sql = `
            select
                t.id,
                t.nome,
                t.modalidade,
                t.modalidade_id,
                m.nome as modalidade_nome,
                t.nivel,
                t.descricao,
                t.status,
                a.dia_semana,
                a.horario_inicio,
                a.horario_fim,
                t.local_id,
                l.nome as local_nome,
                group_concat(distinct pt.professor_id) as professor_ids,
                group_concat(distinct p.nome) as professor_names
            from turma t
            left join modalidade m on m.id = t.modalidade_id
            left join local_aula l on l.id = t.local_id
            left join agenda a on a.turma_id = t.id
            left join professor_turma pt on pt.turma_id = t.id
            left join pessoa p on p.id = pt.professor_id
            where t.id = ?
            group by t.id`;

        const rows = await this.banco.ExecutaComando(sql, [id]);
        if (rows.length === 0) return null;
        return TurmaEntity.toMap(rows[0]);
    }

    async cadastrar(entidade, professorIds) {
        const sql = `
            insert into turma (nome, modalidade, modalidade_id, local_id, nivel, descricao, status)
            values (?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            entidade.nome,
            entidade.modalidade,
            entidade.modalidade_id,
            entidade.local_id,
            entidade.nivel,
            entidade.descricao,
            entidade.status,
        ];
        const insertedId = await this.banco.ExecutaComandoLastInserted(sql, values);
        if (!insertedId) return null;

        const agendaSql = `insert into agenda (turma_id, dia_semana, horario_inicio, horario_fim) values (?, ?, ?, ?)`;
        await this.banco.ExecutaComandoNonQuery(agendaSql, [insertedId, entidade.dia_semana, entidade.horario_inicio, entidade.horario_fim]);

        for (const professorId of professorIds) {
            const professorSql = `insert into professor_turma (professor_id, turma_id, funcao_prof, data_inicio) values (?, ?, ?, ?)`;
            await this.banco.ExecutaComandoNonQuery(professorSql, [professorId, insertedId, null, null]);
        }

        return insertedId;
    }

    async alterar(entidade, professorIds) {
        const sql = `
            update turma
            set nome = ?, modalidade = ?, modalidade_id = ?, local_id = ?, nivel = ?, descricao = ?, status = ?
            where id = ?`;
        const values = [
            entidade.nome,
            entidade.modalidade,
            entidade.modalidade_id,
            entidade.local_id,
            entidade.nivel,
            entidade.descricao,
            entidade.status,
            entidade.id,
        ];
        const updated = await this.banco.ExecutaComandoNonQuery(sql, values);
        if (!updated) return false;

        const agendaSql = `update agenda set dia_semana = ?, horario_inicio = ?, horario_fim = ? where turma_id = ?`;
        await this.banco.ExecutaComandoNonQuery(agendaSql, [entidade.dia_semana, entidade.horario_inicio, entidade.horario_fim, entidade.id]);

        const deleteSql = `delete from professor_turma where turma_id = ?`;
        await this.banco.ExecutaComandoNonQuery(deleteSql, [entidade.id]);

        for (const professorId of professorIds) {
            const professorSql = `insert into professor_turma (professor_id, turma_id, funcao_prof, data_inicio) values (?, ?, ?, ?)`;
            await this.banco.ExecutaComandoNonQuery(professorSql, [professorId, entidade.id, null, null]);
        }

        return true;
    }

    async inativar(id) {
        const sql = `update turma set status = 'INATIVA' where id = ?`;
        return await this.banco.ExecutaComandoNonQuery(sql, [id]);
    }

    async existeConflito(professorId, diaSemana, inicio, fim, turmaId = null) {
        let sql = `
            select count(*) as total
            from professor_turma pt
            join agenda a on a.turma_id = pt.turma_id
            join turma t on t.id = pt.turma_id
            where pt.professor_id = ?
              and t.status = 'ATIVA'
              and a.dia_semana = ?
              and not (a.horario_fim <= ? or a.horario_inicio >= ?)`;
        const values = [professorId, diaSemana, inicio, fim];
        if (turmaId) {
            sql += ` and pt.turma_id <> ?`;
            values.push(turmaId);
        }

        const rows = await this.banco.ExecutaComando(sql, values);
        return rows[0]?.total > 0;
    }

    async existeConflitoLocal(localId, diaSemana, inicio, fim, turmaId = null) {
        let sql = `
            select count(*) as total
            from turma t
            join agenda a on a.turma_id = t.id
            where t.local_id = ?
              and t.status = 'ATIVA'
              and a.dia_semana = ?
              and not (a.horario_fim <= ? or a.horario_inicio >= ?)`;
        const values = [localId, diaSemana, inicio, fim];
        if (turmaId) {
            sql += ` and t.id <> ?`;
            values.push(turmaId);
        }

        const rows = await this.banco.ExecutaComando(sql, values);
        return rows[0]?.total > 0;
    }
}
