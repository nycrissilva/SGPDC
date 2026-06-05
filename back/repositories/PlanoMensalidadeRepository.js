import PlanoMensalidadeEntity from "../entities/planoMensalidadeEntity.js";
import Repository from "./repository.js";

export default class PlanoMensalidadeRepository extends Repository {
    async listar({ incluirInativos = true } = {}) {
        let sql = `
            select
                pm.id,
                pm.nome,
                pm.tipo_plano,
                pm.qtd_alunas,
                pm.qtd_cursos,
                pm.valor_cartao_pix,
                pm.valor_dinheiro,
                pm.status,
                count(case when gf.status = 'ATIVO' then 1 end) as grupos_ativos
            from plano_mensalidade pm
            left join grupo_financeiro gf on gf.plano_mensalidade_id = pm.id
            where 1 = 1`;

        const values = [];
        if (!incluirInativos) {
            sql += ` and pm.status = 'ATIVO'`;
        }

        sql += `
            group by
                pm.id,
                pm.nome,
                pm.tipo_plano,
                pm.qtd_alunas,
                pm.qtd_cursos,
                pm.valor_cartao_pix,
                pm.valor_dinheiro,
                pm.status
            order by pm.status asc, pm.nome asc`;

        const rows = await this.banco.ExecutaComando(sql, values);
        return rows.map((row) => PlanoMensalidadeEntity.toMap(row));
    }

    async obter(id) {
        const sql = `
            select
                pm.id,
                pm.nome,
                pm.tipo_plano,
                pm.qtd_alunas,
                pm.qtd_cursos,
                pm.valor_cartao_pix,
                pm.valor_dinheiro,
                pm.status,
                count(case when gf.status = 'ATIVO' then 1 end) as grupos_ativos
            from plano_mensalidade pm
            left join grupo_financeiro gf on gf.plano_mensalidade_id = pm.id
            where pm.id = ?
            group by
                pm.id,
                pm.nome,
                pm.tipo_plano,
                pm.qtd_alunas,
                pm.qtd_cursos,
                pm.valor_cartao_pix,
                pm.valor_dinheiro,
                pm.status`;
        const rows = await this.banco.ExecutaComando(sql, [id]);
        if (rows.length === 0) return null;
        return PlanoMensalidadeEntity.toMap(rows[0]);
    }

    async obterPorNome(nome) {
        const sql = `select * from plano_mensalidade where upper(nome) = upper(?)`;
        const rows = await this.banco.ExecutaComando(sql, [nome]);
        if (rows.length === 0) return null;
        return PlanoMensalidadeEntity.toMap(rows[0]);
    }

    async cadastrar(entidade) {
        const sql = `
            insert into plano_mensalidade
                (nome, tipo_plano, qtd_alunas, qtd_cursos, valor_cartao_pix, valor_dinheiro, status)
            values (?, ?, ?, ?, ?, ?, ?)`;
        return await this.banco.ExecutaComandoLastInserted(sql, [
            entidade.nome,
            entidade.tipo_plano,
            entidade.qtd_alunas,
            entidade.qtd_cursos,
            entidade.valor_cartao_pix,
            entidade.valor_dinheiro,
            entidade.status,
        ]);
    }

    async alterar(entidade) {
        const sql = `
            update plano_mensalidade
            set nome = ?,
                tipo_plano = ?,
                qtd_alunas = ?,
                qtd_cursos = ?,
                valor_cartao_pix = ?,
                valor_dinheiro = ?,
                status = ?
            where id = ?`;
        return await this.banco.ExecutaComandoNonQuery(sql, [
            entidade.nome,
            entidade.tipo_plano,
            entidade.qtd_alunas,
            entidade.qtd_cursos,
            entidade.valor_cartao_pix,
            entidade.valor_dinheiro,
            entidade.status,
            entidade.id,
        ]);
    }

    async inativar(id) {
        const sql = `update plano_mensalidade set status = 'INATIVO' where id = ?`;
        return await this.banco.ExecutaComandoNonQuery(sql, [id]);
    }
}
