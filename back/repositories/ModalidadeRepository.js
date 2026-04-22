import ModalidadeEntity from "../entities/modalidadeEntity.js";
import Repository from "./repository.js";

export default class ModalidadeRepository extends Repository {
    async listar({ incluirInativas = true } = {}) {
        let sql = `
            select
                m.id,
                m.nome,
                m.status,
                count(case when t.status = 'ATIVA' then 1 end) as turmas_ativas
            from modalidade m
            left join turma t on t.modalidade_id = m.id
            where 1 = 1`;

        const values = [];
        if (!incluirInativas) {
            sql += ` and m.status = 'ATIVA'`;
        }

        sql += ` group by m.id order by m.nome asc`;

        const rows = await this.banco.ExecutaComando(sql, values);
        return rows.map((row) => ModalidadeEntity.toMap(row));
    }

    async obter(id) {
        const sql = `
            select
                m.id,
                m.nome,
                m.status,
                count(case when t.status = 'ATIVA' then 1 end) as turmas_ativas
            from modalidade m
            left join turma t on t.modalidade_id = m.id
            where m.id = ?
            group by m.id`;
        const rows = await this.banco.ExecutaComando(sql, [id]);
        if (rows.length === 0) return null;
        return ModalidadeEntity.toMap(rows[0]);
    }

    async obterPorNome(nome) {
        const sql = `select id, nome, status from modalidade where upper(nome) = upper(?)`;
        const rows = await this.banco.ExecutaComando(sql, [nome]);
        if (rows.length === 0) return null;
        return ModalidadeEntity.toMap(rows[0]);
    }

    async cadastrar(entidade) {
        const sql = `insert into modalidade (nome, status) values (?, ?)`;
        return await this.banco.ExecutaComandoLastInserted(sql, [entidade.nome, entidade.status]);
    }

    async alterar(entidade) {
        const sql = `update modalidade set nome = ?, status = ? where id = ?`;
        return await this.banco.ExecutaComandoNonQuery(sql, [entidade.nome, entidade.status, entidade.id]);
    }

    async inativar(id) {
        const sql = `update modalidade set status = 'INATIVA' where id = ?`;
        return await this.banco.ExecutaComandoNonQuery(sql, [id]);
    }

    async contarTurmasAtivas(id) {
        const sql = `select count(*) as total from turma where modalidade_id = ? and status = 'ATIVA'`;
        const rows = await this.banco.ExecutaComando(sql, [id]);
        return Number(rows[0]?.total || 0);
    }
}
