import Repository from "./repository.js";

export default class MensalidadeRepository extends Repository {
    async listar(filtros = {}) {
        const contas = await this.listarContasReceber(filtros);
        const previstas = await this.listarMensalidadesPrevistas(filtros);
        const existentes = new Set(contas.map((item) => `${item.plano_financeiro_id}-${item.mes_referencia}-${item.ano_referencia}`));

        return [
            ...contas,
            ...previstas.filter((item) => !existentes.has(`${item.plano_financeiro_id}-${item.mes_referencia}-${item.ano_referencia}`)),
        ].sort((a, b) => {
            const anoDiff = Number(b.ano_referencia || 0) - Number(a.ano_referencia || 0);
            if (anoDiff !== 0) return anoDiff;
            return Number(b.mes_referencia || 0) - Number(a.mes_referencia || 0);
        });
    }

    async listarContasReceber(filtros = {}) {
        let sql = `
            select
                cr.id,
                cr.tipo_receita,
                cr.mes_referencia,
                cr.ano_referencia,
                cr.valor_base,
                cr.valor_final,
                cr.multa,
                cr.status,
                cr.data_vencimento,
                gf.id as plano_financeiro_id,
                gf.tipo_grupo,
                gf.responsavel_id,
                responsavel.nome as responsavel_nome,
                pm.nome as plano_nome,
                coalesce(sum(pg.valor_pago), 0) as valor_pago,
                group_concat(distinct aluno.id order by aluno_pessoa.nome separator ',') as aluna_ids,
                group_concat(distinct aluno_pessoa.nome order by aluno_pessoa.nome separator '||') as aluna_nomes
            from conta_receber cr
            left join grupo_financeiro gf on gf.id = cr.grupo_financeiro_id
            left join pessoa responsavel on responsavel.id = gf.responsavel_id
            left join plano_mensalidade pm on pm.id = gf.plano_mensalidade_id
            left join grupo_financeiro_aluno gfa on gfa.grupo_financeiro_id = gf.id
            left join aluno aluno on aluno.id = gfa.aluno_id
            left join pessoa aluno_pessoa on aluno_pessoa.id = aluno.id
            left join pagamento pg on pg.conta_receber_id = cr.id
            where cr.tipo_receita = 'MENSALIDADE'`;

        const values = [];

        if (filtros.responsavel_id) {
            sql += ` and gf.responsavel_id = ?`;
            values.push(filtros.responsavel_id);
        }

        if (filtros.aluno_id) {
            sql += `
                and (
                    exists (
                        select 1
                        from grupo_financeiro_aluno filtro_gfa
                        where filtro_gfa.grupo_financeiro_id = gf.id
                          and filtro_gfa.aluno_id = ?
                    )
                    or exists (
                        select 1
                        from aluno filtro_aluno
                        where filtro_aluno.id = ?
                          and filtro_aluno.responsavel_id = gf.responsavel_id
                    )
                    or exists (
                        select 1
                        from matricula filtro_matricula
                        where filtro_matricula.id = cr.matricula_id
                          and filtro_matricula.aluno_id = ?
                    )
                )`;
            values.push(filtros.aluno_id, filtros.aluno_id, filtros.aluno_id);
        }

        if (filtros.status) {
            sql += ` and cr.status = ?`;
            values.push(filtros.status);
        }

        if (filtros.mes_referencia) {
            sql += ` and cr.mes_referencia = ?`;
            values.push(filtros.mes_referencia);
        }

        if (filtros.ano_referencia) {
            sql += ` and cr.ano_referencia = ?`;
            values.push(filtros.ano_referencia);
        }

        sql += `
            group by cr.id
            order by cr.ano_referencia desc, cr.mes_referencia desc, cr.data_vencimento desc, cr.id desc`;

        const rows = await this.banco.ExecutaComando(sql, values);
        return rows.map((row) => ({
            id: row.id,
            tipo_receita: row.tipo_receita,
            mes_referencia: row.mes_referencia,
            ano_referencia: row.ano_referencia,
            valor_base: Number(row.valor_base || 0),
            valor_final: Number(row.valor_final || 0),
            multa: Number(row.multa || 0),
            valor_pago: Number(row.valor_pago || 0),
            saldo: Number(row.valor_final || 0) - Number(row.valor_pago || 0),
            status: row.status,
            data_vencimento: this.formatDateValue(row.data_vencimento),
            plano_financeiro_id: row.plano_financeiro_id,
            tipo_grupo: row.tipo_grupo,
            responsavel_id: row.responsavel_id,
            responsavel_nome: row.responsavel_nome,
            plano_nome: row.plano_nome,
            alunas: this.mapAlunas(row.aluna_ids, row.aluna_nomes),
        }));
    }

    async listarMensalidadesPrevistas(filtros = {}) {
        let sql = `
            select
                gf.id as plano_financeiro_id,
                gf.tipo_grupo,
                gf.responsavel_id,
                gf.data_inicio,
                responsavel.nome as responsavel_nome,
                pm.nome as plano_nome,
                pm.valor_cartao_pix,
                pm.valor_dinheiro,
                month(gf.data_inicio) as mes_referencia,
                year(gf.data_inicio) as ano_referencia,
                group_concat(distinct aluno.id order by aluno_pessoa.nome separator ',') as aluna_ids,
                group_concat(distinct aluno_pessoa.nome order by aluno_pessoa.nome separator '||') as aluna_nomes
            from grupo_financeiro gf
            join pessoa responsavel on responsavel.id = gf.responsavel_id
            join plano_mensalidade pm on pm.id = gf.plano_mensalidade_id
            left join grupo_financeiro_aluno gfa on gfa.grupo_financeiro_id = gf.id
            left join aluno aluno on aluno.id = gfa.aluno_id
            left join pessoa aluno_pessoa on aluno_pessoa.id = aluno.id
            where gf.status = 'ATIVO'`;

        const values = [];

        if (filtros.responsavel_id) {
            sql += ` and gf.responsavel_id = ?`;
            values.push(filtros.responsavel_id);
        }

        if (filtros.aluno_id) {
            sql += `
                and (
                    exists (
                        select 1
                        from grupo_financeiro_aluno filtro_gfa
                        where filtro_gfa.grupo_financeiro_id = gf.id
                          and filtro_gfa.aluno_id = ?
                    )
                    or exists (
                        select 1
                        from aluno filtro_aluno
                        where filtro_aluno.id = ?
                          and filtro_aluno.responsavel_id = gf.responsavel_id
                    )
                )`;
            values.push(filtros.aluno_id, filtros.aluno_id);
        }

        if (filtros.status && filtros.status !== 'PENDENTE') {
            sql += ` and 1 = 0`;
        }

        if (filtros.mes_referencia) {
            sql += ` and month(gf.data_inicio) = ?`;
            values.push(filtros.mes_referencia);
        }

        if (filtros.ano_referencia) {
            sql += ` and year(gf.data_inicio) = ?`;
            values.push(filtros.ano_referencia);
        }

        sql += ` group by gf.id`;

        const rows = await this.banco.ExecutaComando(sql, values);
        return rows.map((row) => {
            const valorBase = Number(row.valor_cartao_pix || row.valor_dinheiro || 0);
            const dataVencimento = `${row.ano_referencia}-${String(row.mes_referencia).padStart(2, "0")}-15`;
            return {
                id: `prevista-${row.plano_financeiro_id}-${row.mes_referencia}-${row.ano_referencia}`,
                prevista: true,
                tipo_receita: 'MENSALIDADE',
                mes_referencia: row.mes_referencia,
                ano_referencia: row.ano_referencia,
                valor_base: valorBase,
                valor_final: valorBase,
                multa: 0,
                valor_pago: 0,
                saldo: valorBase,
                status: 'PENDENTE',
                data_vencimento: dataVencimento,
                plano_financeiro_id: row.plano_financeiro_id,
                tipo_grupo: row.tipo_grupo,
                responsavel_id: row.responsavel_id,
                responsavel_nome: row.responsavel_nome,
                plano_nome: row.plano_nome,
                alunas: this.mapAlunas(row.aluna_ids, row.aluna_nomes),
            };
        });
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

    async gerarMensalidades(mesReferencia, anoReferencia) {
        const grupos = await this.banco.ExecutaComando(`
            select
                gf.id as grupo_financeiro_id,
                pm.valor_cartao_pix,
                pm.valor_dinheiro
            from grupo_financeiro gf
            join plano_mensalidade pm on pm.id = gf.plano_mensalidade_id
            where gf.status = 'ATIVO'
              and pm.status = 'ATIVO'
        `, []);

        const dataVencimento = `${anoReferencia}-${String(mesReferencia).padStart(2, "0")}-15`;
        const conn = await this.getConnection();
        const geradas = [];
        const ignoradas = [];

        try {
            await this.query(conn, "START TRANSACTION");

            for (const grupo of grupos) {
                const existentes = await this.query(conn, `
                    select id
                    from conta_receber
                    where grupo_financeiro_id = ?
                      and tipo_receita = 'MENSALIDADE'
                      and mes_referencia = ?
                      and ano_referencia = ?
                    limit 1
                `, [grupo.grupo_financeiro_id, mesReferencia, anoReferencia]);

                if (existentes.length > 0) {
                    ignoradas.push({ grupo_financeiro_id: grupo.grupo_financeiro_id, conta_receber_id: existentes[0].id });
                    continue;
                }

                const valorBase = Number(grupo.valor_cartao_pix || grupo.valor_dinheiro || 0);
                const result = await this.query(conn, `
                    insert into conta_receber
                        (grupo_financeiro_id, matricula_id, tipo_receita, mes_referencia, ano_referencia, valor_base, valor_final, multa, valor, status, data_vencimento)
                    values (?, null, 'MENSALIDADE', ?, ?, ?, ?, 0.00, ?, 'PENDENTE', ?)
                `, [
                    grupo.grupo_financeiro_id,
                    mesReferencia,
                    anoReferencia,
                    valorBase,
                    valorBase,
                    valorBase,
                    dataVencimento,
                ]);

                geradas.push({ grupo_financeiro_id: grupo.grupo_financeiro_id, conta_receber_id: result.insertId });
            }

            await this.query(conn, "COMMIT");
            return { geradas: geradas.length, ignoradas: ignoradas.length, detalhes: { geradas, ignoradas } };
        } catch (error) {
            await this.query(conn, "ROLLBACK");
            throw error;
        } finally {
            conn.release();
        }
    }

    async gerarMensalidadeGrupo(grupoId, mesReferencia, anoReferencia) {
        const grupos = await this.banco.ExecutaComando(`
            select
                gf.id as grupo_financeiro_id,
                pm.valor_cartao_pix,
                pm.valor_dinheiro
            from grupo_financeiro gf
            join plano_mensalidade pm on pm.id = gf.plano_mensalidade_id
            where gf.id = ?
              and gf.status = 'ATIVO'
              and pm.status = 'ATIVO'
            limit 1
        `, [grupoId]);

        if (grupos.length === 0) return null;

        const existente = await this.banco.ExecutaComando(`
            select id
            from conta_receber
            where grupo_financeiro_id = ?
              and tipo_receita = 'MENSALIDADE'
              and mes_referencia = ?
              and ano_referencia = ?
            limit 1
        `, [grupoId, mesReferencia, anoReferencia]);

        if (existente.length > 0) return existente[0].id;

        const valorBase = Number(grupos[0].valor_cartao_pix || grupos[0].valor_dinheiro || 0);
        const dataVencimento = `${anoReferencia}-${String(mesReferencia).padStart(2, "0")}-15`;
        return await this.banco.ExecutaComandoLastInserted(`
            insert into conta_receber
                (grupo_financeiro_id, matricula_id, tipo_receita, mes_referencia, ano_referencia, valor_base, valor_final, multa, valor, status, data_vencimento)
            values (?, null, 'MENSALIDADE', ?, ?, ?, ?, 0.00, ?, 'PENDENTE', ?)
        `, [grupoId, mesReferencia, anoReferencia, valorBase, valorBase, valorBase, dataVencimento]);
    }

    async obterConta(id) {
        const rows = await this.banco.ExecutaComando(`select * from conta_receber where id = ?`, [id]);
        return rows.length > 0 ? rows[0] : null;
    }

    async listarFantasias(filtros = {}) {
        await this.garantirParcelasContaReceber();
        let sql = `
            select
                cr.id,
                cr.tipo_receita,
                cr.valor_base,
                cr.valor_final,
                cr.multa,
                cr.status,
                cr.data_vencimento,
                cr.numero_parcela,
                cr.total_parcelas,
                cr.matricula_id,
                coalesce(m.aluno_id, pc.aluno_id) as aluno_id,
                aluno_pessoa.nome as aluno_nome,
                coalesce(aluno_matricula.responsavel_id, aluno_participacao.responsavel_id) as responsavel_id,
                responsavel_pessoa.nome as responsavel_nome,
                (
                    select group_concat(distinct turma_filtro.id order by turma_filtro.nome separator ',')
                    from matricula matricula_filtro
                    join matricula_turma mt_filtro on mt_filtro.matricula_id = matricula_filtro.id
                    join turma turma_filtro on turma_filtro.id = mt_filtro.turma_id
                    where matricula_filtro.aluno_id = coalesce(m.aluno_id, pc.aluno_id)
                      and matricula_filtro.status = 'ATIVA'
                ) as turma_ids,
                (
                    select group_concat(distinct turma_filtro.nome order by turma_filtro.nome separator '||')
                    from matricula matricula_filtro
                    join matricula_turma mt_filtro on mt_filtro.matricula_id = matricula_filtro.id
                    join turma turma_filtro on turma_filtro.id = mt_filtro.turma_id
                    where matricula_filtro.aluno_id = coalesce(m.aluno_id, pc.aluno_id)
                      and matricula_filtro.status = 'ATIVA'
                ) as turma_nomes,
                e.nome as espetaculo_nome,
                c.nome as coreografia_nome,
                coalesce(cp.nome, pc.papel) as papel_nome,
                coalesce(sum(pg.valor_pago), 0) as valor_pago
            from conta_receber cr
            left join matricula m on m.id = cr.matricula_id
            left join aluno aluno_matricula on aluno_matricula.id = m.aluno_id
            left join evento e on e.id = cr.espetaculo_id
            left join coreografia c on c.id = cr.coreografia_id
            left join participacao_coreografia pc on pc.id = cr.participacao_coreografia_id
            left join aluno aluno_participacao on aluno_participacao.id = pc.aluno_id
            left join pessoa aluno_pessoa on aluno_pessoa.id = coalesce(m.aluno_id, pc.aluno_id)
            left join pessoa responsavel_pessoa on responsavel_pessoa.id = coalesce(aluno_matricula.responsavel_id, aluno_participacao.responsavel_id)
            left join coreografia_papel cp on cp.id = cr.fantasia_id
            left join pagamento pg on pg.conta_receber_id = cr.id
            where cr.tipo_receita = 'FANTASIA'`;

        const values = [];

        if (filtros.aluno_id) {
            sql += ` and (m.aluno_id = ? or pc.aluno_id = ?)`;
            values.push(filtros.aluno_id, filtros.aluno_id);
        }

        if (filtros.responsavel_id) {
            sql += ` and (aluno_matricula.responsavel_id = ? or aluno_participacao.responsavel_id = ?)`;
            values.push(filtros.responsavel_id, filtros.responsavel_id);
        }

        if (filtros.turma_id) {
            sql += `
                and exists (
                    select 1
                    from matricula filtro_matricula
                    join matricula_turma filtro_mt on filtro_mt.matricula_id = filtro_matricula.id
                    where filtro_matricula.aluno_id = coalesce(m.aluno_id, pc.aluno_id)
                      and filtro_matricula.status = 'ATIVA'
                      and filtro_mt.turma_id = ?
                )`;
            values.push(filtros.turma_id);
        }

        if (filtros.status) {
            sql += ` and cr.status = ?`;
            values.push(filtros.status);
        }

        sql += `
            group by cr.id
            order by cr.data_vencimento desc, cr.id desc`;

        const rows = await this.banco.ExecutaComando(sql, values);
        return rows.map((row) => ({
            id: row.id,
            tipo_receita: row.tipo_receita,
            valor_base: Number(row.valor_base || 0),
            valor_final: Number(row.valor_final || 0),
            multa: Number(row.multa || 0),
            valor_pago: Number(row.valor_pago || 0),
            saldo: Number(row.valor_final || 0) - Number(row.valor_pago || 0),
            status: row.status,
            data_vencimento: this.formatDateValue(row.data_vencimento),
            numero_parcela: Number(row.numero_parcela || 1),
            total_parcelas: Number(row.total_parcelas || 1),
            matricula_id: row.matricula_id,
            aluno_id: row.aluno_id,
            aluno_nome: row.aluno_nome,
            responsavel_id: row.responsavel_id,
            responsavel_nome: row.responsavel_nome,
            turmas: this.mapAlunas(row.turma_ids, row.turma_nomes),
            espetaculo_nome: row.espetaculo_nome,
            coreografia_nome: row.coreografia_nome,
            papel_nome: row.papel_nome,
        }));
    }

    async garantirParcelasContaReceber() {
        await this.banco.ExecutaComando(`
            alter table conta_receber
              add column if not exists numero_parcela int(11) not null default 1 after participacao_coreografia_id,
              add column if not exists total_parcelas int(11) not null default 1 after numero_parcela
        `, []);
    }

    async editarMensalidade(id, dados) {
        const valorBase = Number(dados.valor_base);
        const multa = Number(dados.multa || 0);
        const valorFinal = Number(dados.valor_final ?? (valorBase + multa));
        const status = String(dados.status || '').toUpperCase();

        const sql = `
            update conta_receber
            set mes_referencia = ?,
                ano_referencia = ?,
                valor_base = ?,
                valor_final = ?,
                multa = ?,
                valor = ?,
                status = ?,
                data_vencimento = ?
            where id = ?
              and tipo_receita = 'MENSALIDADE'`;
        return await this.banco.ExecutaComandoNonQuery(sql, [
            dados.mes_referencia,
            dados.ano_referencia,
            valorBase,
            valorFinal,
            multa,
            valorFinal,
            status,
            dados.data_vencimento,
            id,
        ]);
    }

    async marcarComoPaga(id, { valor_pago, forma_pagamento, data_pagamento }) {
        const conta = await this.obterConta(id);
        if (!conta) return false;
        if (['PAGA', 'CANCELADA'].includes(conta.status)) return false;

        const valorPago = Number(valor_pago || conta.valor_final || 0);
        const dataPagamento = data_pagamento || this.formatDateValue(new Date());
        const formaPagamento = forma_pagamento || 'NAO_INFORMADO';

        const conn = await this.getConnection();
        try {
            await this.query(conn, "START TRANSACTION");
            await this.query(conn, `
                insert into pagamento (conta_receber_id, data_pagamento, valor_pago, forma_pagamento)
                values (?, ?, ?, ?)
            `, [id, dataPagamento, valorPago, formaPagamento]);
            await this.query(conn, `update conta_receber set status = 'PAGA' where id = ?`, [id]);
            await this.query(conn, "COMMIT");
            return true;
        } catch (error) {
            await this.query(conn, "ROLLBACK");
            throw error;
        } finally {
            conn.release();
        }
    }

    async atualizarAtrasos(dataAtual = new Date()) {
        const hoje = this.formatDateValue(dataAtual);
        const sql = `
            update conta_receber
            set status = 'ATRASADA'
            where tipo_receita = 'MENSALIDADE'
              and status = 'PENDENTE'
              and data_vencimento < ?
              and status not in ('PAGA', 'CANCELADA')`;
        return await this.banco.ExecutaComandoNonQuery(sql, [hoje]);
    }

    async aplicarMultas(dataAtual = new Date()) {
        await this.garantirTabelaConfiguracaoFinanceira();
        const config = await this.obterConfiguracaoMulta();
        const valorMulta = Number(config.valor_multa_mensalidade || 0);
        const hoje = this.formatDateValue(dataAtual);

        const sql = `
            update conta_receber
            set multa = ?,
                valor_final = coalesce(valor_base, 0) + ?,
                status = 'ATRASADA_COM_MULTA'
            where tipo_receita = 'MENSALIDADE'
              and status in ('PENDENTE', 'ATRASADA')
              and last_day(str_to_date(concat(ano_referencia, '-', lpad(mes_referencia, 2, '0'), '-01'), '%Y-%m-%d')) < ?
              and status not in ('PAGA', 'CANCELADA')`;
        return await this.banco.ExecutaComandoNonQuery(sql, [valorMulta, valorMulta, hoje]);
    }

    async garantirTabelaConfiguracaoFinanceira() {
        const sql = `
            create table if not exists configuracao_financeira (
                id int(11) not null auto_increment,
                valor_multa_mensalidade decimal(10,2) not null default 0.00,
                status enum('ATIVO','INATIVO') not null default 'ATIVO',
                data_atualizacao datetime not null default current_timestamp,
                primary key (id),
                key idx_configuracao_financeira_status (status)
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_general_ci`;
        await this.banco.ExecutaComando(sql, []);
    }

    async obterConfiguracaoMulta() {
        await this.garantirTabelaConfiguracaoFinanceira();
        const rows = await this.banco.ExecutaComando(`
            select id, valor_multa_mensalidade, status, data_atualizacao
            from configuracao_financeira
            where status = 'ATIVO'
            order by data_atualizacao desc, id desc
            limit 1
        `, []);

        if (rows.length > 0) {
            return {
                id: rows[0].id,
                valor_multa_mensalidade: Number(rows[0].valor_multa_mensalidade || 0),
                status: rows[0].status,
                data_atualizacao: this.formatDateValue(rows[0].data_atualizacao),
            };
        }

        const id = await this.banco.ExecutaComandoLastInserted(`
            insert into configuracao_financeira (valor_multa_mensalidade, status, data_atualizacao)
            values (0.00, 'ATIVO', now())
        `, []);

        return { id, valor_multa_mensalidade: 0, status: 'ATIVO', data_atualizacao: this.formatDateValue(new Date()) };
    }

    async alterarConfiguracaoMulta(valorMulta) {
        await this.garantirTabelaConfiguracaoFinanceira();
        await this.banco.ExecutaComando(`
            update configuracao_financeira
            set status = 'INATIVO'
            where status = 'ATIVO'
        `, []);

        const id = await this.banco.ExecutaComandoLastInserted(`
            insert into configuracao_financeira (valor_multa_mensalidade, status, data_atualizacao)
            values (?, 'ATIVO', now())
        `, [valorMulta]);

        return { id, valor_multa_mensalidade: valorMulta, status: 'ATIVO' };
    }

    getConnection() {
        return new Promise((resolve, reject) => {
            this.banco.conexao.getConnection((error, connection) => {
                if (error) reject(error);
                else resolve(connection);
            });
        });
    }

    query(connection, sql, values = []) {
        return new Promise((resolve, reject) => {
            connection.query(sql, values, (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        });
    }
}
