import Repository from "./repository.js";

export default class PresencaRepository extends Repository {
    constructor() {
        super();
    }

    async listarPorTurmaData(turmaId, data) {
        const sql = `
            select
                mt.id as matricula_turma_id,
                m.id as matricula_id,
                a.id as aluno_id,
                p.nome,
                pr.presente,
                pr.data
            from matricula_turma mt
            join matricula m on m.id = mt.matricula_id and m.status = 'ATIVA'
            join aluno a on a.id = m.aluno_id
            join pessoa p on p.id = a.id
            left join presenca pr on pr.matricula_turma_id = mt.id and pr.data = ?
            where mt.turma_id = ?
            order by p.nome`;

        const rows = await this.banco.ExecutaComando(sql, [data, turmaId]);
        return rows.map((row) => ({
            matricula_turma_id: row["matricula_turma_id"],
            matricula_id: row["matricula_id"],
            aluno_id: row["aluno_id"],
            nome: row["nome"],
            presente: row["presente"] === 1 || row["presente"] === true,
            data: row["data"] ? row["data"] : data,
        }));
    }

    async listarPorProfessorTurmaData(professorId, turmaId, data) {
        const sql = `
            select
                mt.id as matricula_turma_id,
                m.id as matricula_id,
                a.id as aluno_id,
                p.nome,
                pr.presente,
                pr.data
            from matricula_turma mt
            join matricula m on m.id = mt.matricula_id and m.status = 'ATIVA'
            join aluno a on a.id = m.aluno_id
            join pessoa p on p.id = a.id
            join professor_turma pt on pt.turma_id = mt.turma_id and pt.professor_id = ?
            left join presenca pr on pr.matricula_turma_id = mt.id and pr.data = ?
            where mt.turma_id = ?
            order by p.nome`;

        const rows = await this.banco.ExecutaComando(sql, [professorId, data, turmaId]);
        return rows.map((row) => ({
            matricula_turma_id: row["matricula_turma_id"],
            matricula_id: row["matricula_id"],
            aluno_id: row["aluno_id"],
            nome: row["nome"],
            presente: row["presente"] === 1 || row["presente"] === true,
            data: row["data"] ? row["data"] : data,
        }));
    }

    async turmaPertenceAoProfessor(professorId, turmaId) {
        const sql = `
            select count(*) as total
            from professor_turma pt
            where pt.turma_id = ?
              and pt.professor_id = ?`;
        const rows = await this.banco.ExecutaComando(sql, [turmaId, professorId]);
        return rows.length > 0 && rows[0].total > 0;
    }

    async salvar(matriculaTurmaId, data, presente) {
        const existing = await this.banco.ExecutaComando(
            `select id from presenca where matricula_turma_id = ? and data = ?`,
            [matriculaTurmaId, data]
        );

        if (existing.length > 0) {
            return await this.banco.ExecutaComandoNonQuery(
                `update presenca set presente = ? where id = ?`,
                [presente ? 1 : 0, existing[0].id]
            );
        }

        return await this.banco.ExecutaComandoNonQuery(
            `insert into presenca (matricula_turma_id, data, presente) values (?, ?, ?)`,
            [matriculaTurmaId, data, presente ? 1 : 0]
        );
    }

    async listarRelatorio({ turmaId, alunoId, dataInicial, dataFinal }) {
        let sql = `
            select
                a.id as aluno_id,
                p.nome as aluno_nome,
                t.id as turma_id,
                t.nome as turma_nome,
                pr.data as data_aula,
                pr.presente
            from presenca pr
            join matricula_turma mt on mt.id = pr.matricula_turma_id
            join matricula m on m.id = mt.matricula_id
            join aluno a on a.id = m.aluno_id
            join pessoa p on p.id = a.id
            join turma t on t.id = mt.turma_id
            where pr.data between ? and ?
              and p.status = 'ATIVO'
              and m.data_matricula <= ?
              and (m.data_cancelamento is null or m.data_cancelamento >= ?)`;

        const values = [dataInicial, dataFinal, dataFinal, dataInicial];

        if (turmaId) {
            sql += ` and t.id = ?`;
            values.push(turmaId);
        }

        if (alunoId) {
            sql += ` and a.id = ?`;
            values.push(alunoId);
        }

        sql += ` order by p.nome asc, pr.data asc, t.nome asc`;

        const rows = await this.banco.ExecutaComando(sql, values);
        return rows.map((row) => ({
            aluno_id: row["aluno_id"],
            aluno_nome: row["aluno_nome"],
            turma_id: row["turma_id"],
            turma_nome: row["turma_nome"],
            data_aula: row["data_aula"] instanceof Date
                ? row["data_aula"].toISOString().split("T")[0]
                : String(row["data_aula"]).split("T")[0],
            presente: row["presente"] === 1 || row["presente"] === true,
        }));
    }
}
