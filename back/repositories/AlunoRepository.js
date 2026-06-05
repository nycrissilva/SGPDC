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

    async buscarComFiltros({ q = "", turma_id = null, turma = "", pagina = 1, limite = 200 } = {}) {
        let sql = `
            select
                p.id,
                p.nome,
                p.cpf,
                p.telefone,
                p.email,
                p.status,
                a.responsavel_id,
                a.data_nascimento,
                a.data_matricula,
                group_concat(distinct t.id order by t.nome separator ',') as turma_ids,
                group_concat(distinct t.nome order by t.nome separator '||') as turma_nomes
            from aluno a
            join pessoa p on p.id = a.id
            left join matricula m on m.aluno_id = a.id and m.status = 'ATIVA'
            left join matricula_turma mt on mt.matricula_id = m.id
            left join turma t on t.id = mt.turma_id
            where p.status = 'ATIVO'`;

        const valores = [];

        if (q) {
            sql += ` and (p.nome like ? or p.cpf like ? or p.email like ?)`;
            valores.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }

        if (turma_id) {
            sql += `
                and exists (
                    select 1
                    from matricula filtro_matricula
                    join matricula_turma filtro_mt on filtro_mt.matricula_id = filtro_matricula.id
                    where filtro_matricula.aluno_id = a.id
                      and filtro_matricula.status = 'ATIVA'
                      and filtro_mt.turma_id = ?
                )`;
            valores.push(turma_id);
        }

        if (turma) {
            const turmaFiltro = String(turma).split(" - ")[0].trim();
            sql += `
                and exists (
                    select 1
                    from matricula filtro_matricula_nome
                    join matricula_turma filtro_mt_nome on filtro_mt_nome.matricula_id = filtro_matricula_nome.id
                    join turma filtro_turma on filtro_turma.id = filtro_mt_nome.turma_id
                    where filtro_matricula_nome.aluno_id = a.id
                      and filtro_matricula_nome.status = 'ATIVA'
                      and (
                        filtro_turma.nome like ?
                        or filtro_turma.nivel like ?
                        or filtro_turma.modalidade like ?
                      )
                )`;
            valores.push(`%${turmaFiltro}%`, `%${turmaFiltro}%`, `%${turmaFiltro}%`);
        }

        sql += `
            group by
                p.id,
                p.nome,
                p.cpf,
                p.telefone,
                p.email,
                p.status,
                a.responsavel_id,
                a.data_nascimento,
                a.data_matricula
            order by p.nome asc
            limit ? offset ?`;
        valores.push(Number(limite) || 200, ((Number(pagina) || 1) - 1) * (Number(limite) || 200));

        const rows = await this.banco.ExecutaComando(sql, valores);
        return rows.map((row) => ({
            id: row.id,
            nome: row.nome,
            cpf: row.cpf,
            telefone: row.telefone,
            email: row.email,
            status: row.status,
            responsavel_id: row.responsavel_id,
            data_nascimento: AlunoEntity.formatDateValue(row.data_nascimento),
            data_matricula: AlunoEntity.formatDateValue(row.data_matricula),
            turma_ids: row.turma_ids ? row.turma_ids.split(",").map((id) => Number(id)) : [],
            turmas: this.mapTurmas(row.turma_ids, row.turma_nomes),
        }));
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
            group by
                a.id,
                a.responsavel_id,
                a.data_nascimento,
                a.data_matricula`;
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

    async criarMatricula(alunoId, data_matricula, status = "ATIVA") {
        const sql = `insert into matricula (aluno_id, data_matricula, status, data_cancelamento) values (?, ?, ?, null)`;
        const valores = [alunoId, data_matricula, status];
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

    async deletarMatriculaTurmas(matriculaId) {
        const sql = `delete from matricula_turma where matricula_id = ?`;
        await this.banco.ExecutaComando(sql, [matriculaId]);
        return true;
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

    mapTurmas(ids, nomes) {
        if (!ids) return [];
        const idList = ids.split(",").map((id) => Number(id));
        const nomeList = nomes ? nomes.split("||") : [];
        return idList.map((id, index) => ({ id, nome: nomeList[index] || "" }));
    }
}
