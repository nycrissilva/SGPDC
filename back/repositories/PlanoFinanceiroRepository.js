import Repository from "./repository.js";

export default class PlanoFinanceiroRepository extends Repository {
    async listarAtivosPorResponsavel(responsavelId) {
        const sql = `
            select
                gf.id,
                gf.responsavel_id,
                gf.plano_mensalidade_id,
                gf.tipo_grupo,
                gf.data_inicio,
                gf.data_fim,
                gf.status,
                pm.nome as plano_nome,
                pm.tipo_plano,
                pm.qtd_alunas,
                pm.qtd_cursos,
                pm.valor_cartao_pix,
                pm.valor_dinheiro,
                group_concat(distinct a.id order by p.nome separator ',') as aluna_ids,
                group_concat(distinct p.nome order by p.nome separator '||') as aluna_nomes
            from grupo_financeiro gf
            join plano_mensalidade pm on pm.id = gf.plano_mensalidade_id
            left join grupo_financeiro_aluno gfa on gfa.grupo_financeiro_id = gf.id
            left join aluno a on a.id = gfa.aluno_id
            left join pessoa p on p.id = a.id
            where gf.responsavel_id = ?
              and gf.status = 'ATIVO'
            group by
                gf.id,
                gf.responsavel_id,
                gf.plano_mensalidade_id,
                gf.tipo_grupo,
                gf.data_inicio,
                gf.data_fim,
                gf.status,
                pm.nome,
                pm.tipo_plano,
                pm.qtd_alunas,
                pm.qtd_cursos,
                pm.valor_cartao_pix,
                pm.valor_dinheiro
            order by gf.data_inicio desc, gf.id desc`;

        const rows = await this.banco.ExecutaComando(sql, [responsavelId]);
        return rows.map((row) => ({
            id: row.id,
            responsavel_id: row.responsavel_id,
            plano_mensalidade_id: row.plano_mensalidade_id,
            tipo_grupo: row.tipo_grupo,
            data_inicio: this.formatDateValue(row.data_inicio),
            data_fim: this.formatDateValue(row.data_fim),
            status: row.status,
            plano: {
                id: row.plano_mensalidade_id,
                nome: row.plano_nome,
                tipo_plano: row.tipo_plano,
                qtd_alunas: Number(row.qtd_alunas || 0),
                qtd_cursos: Number(row.qtd_cursos || 0),
                valor_cartao_pix: Number(row.valor_cartao_pix || 0),
                valor_dinheiro: Number(row.valor_dinheiro || 0),
            },
            alunas: this.mapAlunas(row.aluna_ids, row.aluna_nomes),
        }));
    }

    async obter(id) {
        const sql = `select * from grupo_financeiro where id = ?`;
        const rows = await this.banco.ExecutaComando(sql, [id]);
        if (rows.length === 0) return null;
        return rows[0];
    }

    async obterPlanoMensalidadeAtivo(id) {
        const sql = `select * from plano_mensalidade where id = ? and status = 'ATIVO'`;
        const rows = await this.banco.ExecutaComando(sql, [id]);
        if (rows.length === 0) return null;
        return rows[0];
    }

    async obterPlanoMensalidade(id) {
        const sql = `select * from plano_mensalidade where id = ?`;
        const rows = await this.banco.ExecutaComando(sql, [id]);
        if (rows.length === 0) return null;
        return rows[0];
    }

    async alunoPossuiPlanoFinanceiroAtivo(alunoId) {
        const sql = `
            select gf.id
            from grupo_financeiro_aluno gfa
            join grupo_financeiro gf on gf.id = gfa.grupo_financeiro_id
            where gfa.aluno_id = ?
              and gf.status = 'ATIVO'
            limit 1`;
        const rows = await this.banco.ExecutaComando(sql, [alunoId]);
        return rows.length > 0 ? rows[0] : null;
    }

    async alunoEstaNoGrupo(grupoId, alunoId) {
        const sql = `select id from grupo_financeiro_aluno where grupo_financeiro_id = ? and aluno_id = ? limit 1`;
        const rows = await this.banco.ExecutaComando(sql, [grupoId, alunoId]);
        return rows.length > 0;
    }

    async criarGrupo({ responsavel_id, plano_mensalidade_id, tipo_grupo, data_inicio }) {
        const sql = `
            insert into grupo_financeiro
                (responsavel_id, plano_mensalidade_id, tipo_grupo, data_inicio, data_fim, status)
            values (?, ?, ?, ?, null, 'ATIVO')`;
        return await this.banco.ExecutaComandoLastInserted(sql, [
            responsavel_id,
            plano_mensalidade_id,
            tipo_grupo,
            data_inicio,
        ]);
    }

    async atualizarPlanoGrupo(grupoId, planoMensalidadeId) {
        const sql = `update grupo_financeiro set plano_mensalidade_id = ? where id = ? and status = 'ATIVO'`;
        return await this.banco.ExecutaComandoNonQuery(sql, [planoMensalidadeId, grupoId]);
    }

    async inativarGrupo(grupoId, dataFim = null) {
        const sql = `
            update grupo_financeiro
            set status = 'INATIVO',
                data_fim = coalesce(?, curdate())
            where id = ?
              and status = 'ATIVO'`;
        return await this.banco.ExecutaComandoNonQuery(sql, [dataFim, grupoId]);
    }

    async vincularAluno(grupoId, alunoId) {
        const sql = `insert into grupo_financeiro_aluno (grupo_financeiro_id, aluno_id) values (?, ?)`;
        return await this.banco.ExecutaComandoLastInserted(sql, [grupoId, alunoId]);
    }

    async obterMensalidadeReferencia(grupoId, mesReferencia, anoReferencia) {
        const sql = `
            select id
            from conta_receber
            where grupo_financeiro_id = ?
              and tipo_receita = 'MENSALIDADE'
              and mes_referencia = ?
              and ano_referencia = ?
            limit 1`;
        const rows = await this.banco.ExecutaComando(sql, [grupoId, mesReferencia, anoReferencia]);
        return rows.length > 0 ? rows[0] : null;
    }

    async criarMensalidadeInicial({ grupo_financeiro_id, mes_referencia, ano_referencia, valor_base, data_vencimento }) {
        const existente = await this.obterMensalidadeReferencia(grupo_financeiro_id, mes_referencia, ano_referencia);
        if (existente) return existente.id;

        const sql = `
            insert into conta_receber
                (grupo_financeiro_id, matricula_id, tipo_receita, mes_referencia, ano_referencia, valor_base, valor_final, multa, valor, status, data_vencimento)
            values (?, null, 'MENSALIDADE', ?, ?, ?, ?, 0.00, ?, 'PENDENTE', ?)`;
        return await this.banco.ExecutaComandoLastInserted(sql, [
            grupo_financeiro_id,
            mes_referencia,
            ano_referencia,
            valor_base,
            valor_base,
            valor_base,
            data_vencimento,
        ]);
    }

    mapAlunas(ids, nomes) {
        if (!ids) return [];
        const idList = ids.split(",").map((id) => Number(id));
        const nomeList = nomes ? nomes.split("||") : [];
        return idList.map((id, index) => ({ id, nome: nomeList[index] || "" }));
    }

    formatDateValue(value) {
        if (!value) return null;
        if (value instanceof Date) return value.toISOString().split("T")[0];
        const str = value.toString();
        if (str.includes("T")) return str.split("T")[0];
        if (str.includes(" ")) return str.split(" ")[0];
        return str;
    }
}
