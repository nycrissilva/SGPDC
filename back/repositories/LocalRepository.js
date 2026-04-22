import LocalEntity from "../entities/localEntity.js";
import Repository from "./repository.js";

export default class LocalRepository extends Repository {
    async listar({ incluirInativos = true } = {}) {
        let sql = `
            select
                l.id,
                l.nome,
                l.cep,
                l.rua,
                l.numero,
                l.bairro,
                l.cidade,
                l.status,
                count(case when t.status = 'ATIVA' then 1 end) as turmas_ativas
            from local_aula l
            left join turma t on t.local_id = l.id
            where 1 = 1`;

        if (!incluirInativos) {
            sql += ` and l.status = 'ATIVO'`;
        }

        sql += ` group by l.id order by l.nome asc`;

        const rows = await this.banco.ExecutaComando(sql);
        return rows.map((row) => LocalEntity.toMap(row));
    }

    async obter(id) {
        const sql = `
            select
                l.id,
                l.nome,
                l.cep,
                l.rua,
                l.numero,
                l.bairro,
                l.cidade,
                l.status,
                count(case when t.status = 'ATIVA' then 1 end) as turmas_ativas
            from local_aula l
            left join turma t on t.local_id = l.id
            where l.id = ?
            group by l.id`;
        const rows = await this.banco.ExecutaComando(sql, [id]);
        if (rows.length === 0) return null;
        return LocalEntity.toMap(rows[0]);
    }

    async cadastrar(entidade) {
        const sql = `
            insert into local_aula (nome, cep, rua, numero, bairro, cidade, status)
            values (?, ?, ?, ?, ?, ?, ?)`;
        return await this.banco.ExecutaComandoLastInserted(sql, [
            entidade.nome,
            entidade.cep,
            entidade.rua,
            entidade.numero,
            entidade.bairro,
            entidade.cidade,
            entidade.status,
        ]);
    }

    async alterar(entidade) {
        const sql = `
            update local_aula
            set nome = ?, cep = ?, rua = ?, numero = ?, bairro = ?, cidade = ?, status = ?
            where id = ?`;
        return await this.banco.ExecutaComandoNonQuery(sql, [
            entidade.nome,
            entidade.cep,
            entidade.rua,
            entidade.numero,
            entidade.bairro,
            entidade.cidade,
            entidade.status,
            entidade.id,
        ]);
    }

    async inativar(id) {
        const sql = `update local_aula set status = 'INATIVO' where id = ?`;
        return await this.banco.ExecutaComandoNonQuery(sql, [id]);
    }

    async contarTurmasAtivas(id) {
        const sql = `select count(*) as total from turma where local_id = ? and status = 'ATIVA'`;
        const rows = await this.banco.ExecutaComando(sql, [id]);
        return Number(rows[0]?.total || 0);
    }
}
