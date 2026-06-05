import Repository from "./repository.js";

export default class DespesaRepository extends Repository {
    async listarTipos({ incluirInativos = false } = {}) {
        await this.garantirEstrutura();
        let sql = `
            select id, nome, descricao, status
            from tipo_despesa`;
        const values = [];

        if (!incluirInativos) {
            sql += ` where status = 'ATIVO'`;
        }

        sql += ` order by nome asc`;
        const rows = await this.banco.ExecutaComando(sql, values);
        return rows.map((row) => this.mapTipo(row));
    }

    async cadastrarTipo(dados) {
        await this.garantirEstrutura();
        const id = await this.banco.ExecutaComandoLastInserted(`
            insert into tipo_despesa (nome, descricao, status)
            values (?, ?, 'ATIVO')
        `, [dados.nome, dados.descricao || null]);
        return id;
    }

    async listarDespesas(filtros = {}) {
        await this.garantirEstrutura();
        await this.atualizarParcelasAtrasadas();

        const values = [];
        let sql = `
            select
                d.id,
                d.tipo_despesa_id,
                td.nome as tipo_despesa_nome,
                d.descricao,
                d.valor_total,
                d.data_despesa,
                d.forma_pagamento_prevista,
                d.quantidade_parcelas,
                d.data_primeiro_vencimento,
                d.status,
                coalesce(sum(pg.valor_pago), 0) as valor_pago,
                greatest(coalesce(d.valor_total, 0) - coalesce(sum(pg.valor_pago), 0), 0) as saldo,
                count(cp.id) as total_parcelas,
                sum(case when cp.status in ('PENDENTE', 'ATRASADA') then 1 else 0 end) as parcelas_abertas,
                sum(case when cp.status = 'PAGA' then 1 else 0 end) as parcelas_pagas
            from despesa d
            join tipo_despesa td on td.id = d.tipo_despesa_id
            left join conta_pagar cp on cp.despesa_id = d.id
            left join pagamento_despesa pg on pg.conta_pagar_id = cp.id
            where 1 = 1`;

        if (filtros.status) {
            sql += ` and d.status = ?`;
            values.push(filtros.status);
        }

        if (filtros.tipo_despesa_id) {
            sql += ` and d.tipo_despesa_id = ?`;
            values.push(filtros.tipo_despesa_id);
        }

        if (filtros.em_aberto) {
            sql += ` and exists (
                select 1
                from conta_pagar aberto
                where aberto.despesa_id = d.id
                  and aberto.status in ('PENDENTE', 'ATRASADA')
            )`;
        }

        sql += `
            group by
                d.id,
                d.tipo_despesa_id,
                td.nome,
                d.descricao,
                d.valor_total,
                d.data_despesa,
                d.forma_pagamento_prevista,
                d.quantidade_parcelas,
                d.data_primeiro_vencimento,
                d.status
            order by d.data_despesa desc, d.id desc`;

        const rows = await this.banco.ExecutaComando(sql, values);
        const despesas = rows.map((row) => this.mapDespesa(row));
        if (despesas.length === 0) return [];

        const parcelas = await this.listarParcelasPorDespesas(despesas.map((despesa) => despesa.id));
        return despesas.map((despesa) => ({
            ...despesa,
            parcelas: parcelas.filter((parcela) => parcela.despesa_id === despesa.id),
        }));
    }

    async obterDespesa(id) {
        const despesas = await this.listarDespesas({});
        return despesas.find((despesa) => despesa.id === id) || null;
    }

    async lancarDespesa(dados) {
        await this.garantirEstrutura();
        const conn = await this.getConnection();
        try {
            await this.query(conn, "START TRANSACTION");

            const tipo = await this.obterTipoAtivo(conn, dados.tipo_despesa_id);
            if (!tipo) throw new Error("Tipo de despesa inativo ou inexistente");

            const despesaResult = await this.query(conn, `
                insert into despesa
                    (tipo_despesa_id, descricao, valor_total, data_despesa, forma_pagamento_prevista, quantidade_parcelas, data_primeiro_vencimento, status)
                values (?, ?, ?, ?, ?, ?, ?, 'PENDENTE')
            `, [
                dados.tipo_despesa_id,
                dados.descricao,
                dados.valor_total,
                dados.data_despesa,
                dados.forma_pagamento_prevista,
                dados.quantidade_parcelas,
                dados.data_primeiro_vencimento,
            ]);

            const despesaId = despesaResult.insertId;
            const parcelas = this.gerarParcelas(dados.valor_total, dados.quantidade_parcelas, dados.data_primeiro_vencimento);
            for (const parcela of parcelas) {
                await this.query(conn, `
                    insert into conta_pagar
                        (despesa_id, numero_parcela, total_parcelas, valor, data_vencimento, status)
                    values (?, ?, ?, ?, ?, 'PENDENTE')
                `, [despesaId, parcela.numero_parcela, dados.quantidade_parcelas, parcela.valor, parcela.data_vencimento]);
            }

            await this.query(conn, "COMMIT");
            return { id: despesaId };
        } catch (error) {
            await this.query(conn, "ROLLBACK");
            throw error;
        } finally {
            conn.release();
        }
    }

    async editarDespesa(id, dados) {
        await this.garantirEstrutura();
        const conn = await this.getConnection();
        try {
            await this.query(conn, "START TRANSACTION");

            const despesas = await this.query(conn, `select id from despesa where id = ? limit 1`, [id]);
            if (despesas.length === 0) {
                await this.query(conn, "ROLLBACK");
                return false;
            }

            const pagas = await this.query(conn, `
                select count(*) as total
                from conta_pagar
                where despesa_id = ?
                  and status = 'PAGA'
            `, [id]);

            if (Number(pagas[0]?.total || 0) > 0) {
                throw new Error("Nao e permitido editar dados financeiros de despesa com parcela paga");
            }

            const tipo = await this.obterTipoAtivo(conn, dados.tipo_despesa_id);
            if (!tipo) throw new Error("Tipo de despesa inativo ou inexistente");

            await this.query(conn, `
                update despesa
                set tipo_despesa_id = ?,
                    descricao = ?,
                    valor_total = ?,
                    data_despesa = ?,
                    forma_pagamento_prevista = ?,
                    quantidade_parcelas = ?,
                    data_primeiro_vencimento = ?,
                    status = 'PENDENTE'
                where id = ?
            `, [
                dados.tipo_despesa_id,
                dados.descricao,
                dados.valor_total,
                dados.data_despesa,
                dados.forma_pagamento_prevista,
                dados.quantidade_parcelas,
                dados.data_primeiro_vencimento,
                id,
            ]);

            await this.query(conn, `delete from conta_pagar where despesa_id = ?`, [id]);
            const parcelas = this.gerarParcelas(dados.valor_total, dados.quantidade_parcelas, dados.data_primeiro_vencimento);
            for (const parcela of parcelas) {
                await this.query(conn, `
                    insert into conta_pagar
                        (despesa_id, numero_parcela, total_parcelas, valor, data_vencimento, status)
                    values (?, ?, ?, ?, ?, 'PENDENTE')
                `, [id, parcela.numero_parcela, dados.quantidade_parcelas, parcela.valor, parcela.data_vencimento]);
            }

            await this.query(conn, "COMMIT");
            return true;
        } catch (error) {
            await this.query(conn, "ROLLBACK");
            throw error;
        } finally {
            conn.release();
        }
    }

    async quitarParcela(parcelaId, dados) {
        await this.garantirEstrutura();
        const conn = await this.getConnection();
        try {
            await this.query(conn, "START TRANSACTION");
            await this.atualizarParcelasAtrasadas(conn);

            const parcelas = await this.query(conn, `
                select id, despesa_id, valor, status
                from conta_pagar
                where id = ?
                limit 1
            `, [parcelaId]);

            if (parcelas.length === 0) {
                await this.query(conn, "ROLLBACK");
                return false;
            }

            const parcela = parcelas[0];
            if (!['PENDENTE', 'ATRASADA'].includes(String(parcela.status || '').toUpperCase())) {
                throw new Error("Parcela ja paga ou indisponivel para quitacao");
            }

            const valorPago = Math.min(Number(dados.valor_pago || parcela.valor || 0), Number(parcela.valor || 0));

            await this.query(conn, `
                insert into pagamento_despesa (conta_pagar_id, data_pagamento, valor_pago, forma_pagamento)
                values (?, ?, ?, ?)
            `, [parcelaId, dados.data_pagamento, valorPago, dados.forma_pagamento]);

            await this.query(conn, `
                update conta_pagar
                set status = ?,
                    data_pagamento = ?,
                    forma_pagamento = ?
                where id = ?
            `, [valorPago >= Number(parcela.valor || 0) ? 'PAGA' : 'PENDENTE', dados.data_pagamento, dados.forma_pagamento, parcelaId]);

            const abertas = await this.query(conn, `
                select count(*) as total
                from conta_pagar
                where despesa_id = ?
                  and status <> 'PAGA'
            `, [parcela.despesa_id]);

            await this.query(conn, `
                update despesa
                set status = ?
                where id = ?
            `, [Number(abertas[0]?.total || 0) === 0 ? 'QUITADA' : 'PENDENTE', parcela.despesa_id]);

            await this.query(conn, "COMMIT");
            return true;
        } catch (error) {
            await this.query(conn, "ROLLBACK");
            throw error;
        } finally {
            conn.release();
        }
    }

    async listarParcelasPorDespesas(despesaIds) {
        if (!Array.isArray(despesaIds) || despesaIds.length === 0) return [];
        const placeholders = despesaIds.map(() => "?").join(",");
        const rows = await this.banco.ExecutaComando(`
            select
                id,
                despesa_id,
                numero_parcela,
                total_parcelas,
                valor,
                data_vencimento,
                data_pagamento,
                forma_pagamento,
                status
            from conta_pagar
            where despesa_id in (${placeholders})
            order by despesa_id asc, numero_parcela asc
        `, despesaIds);
        return rows.map((row) => this.mapParcela(row));
    }

    async garantirEstrutura() {
        await this.banco.ExecutaComando(`
            create table if not exists tipo_despesa (
                id int(11) not null auto_increment,
                nome varchar(150) not null,
                descricao varchar(255) default null,
                status varchar(50) default 'ATIVO',
                primary key (id),
                unique key uk_tipo_despesa_nome (nome)
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_general_ci
        `, []);

        await this.banco.ExecutaComando(`
            alter table tipo_despesa
              add column if not exists descricao varchar(255) null,
              add column if not exists status varchar(50) default 'ATIVO',
              add unique index if not exists uk_tipo_despesa_nome (nome)
        `, []);

        await this.banco.ExecutaComando(`
            create table if not exists despesa (
                id int(11) not null auto_increment,
                tipo_despesa_id int(11) not null,
                descricao varchar(255) not null,
                valor_total decimal(10,2) not null,
                data_despesa date not null,
                forma_pagamento_prevista varchar(50) default null,
                quantidade_parcelas int(11) not null default 1,
                data_primeiro_vencimento date not null,
                status varchar(50) default 'PENDENTE',
                primary key (id),
                key idx_despesa_tipo (tipo_despesa_id),
                key idx_despesa_status (status),
                constraint despesa_ibfk_1 foreign key (tipo_despesa_id) references tipo_despesa (id)
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_general_ci
        `, []);

        await this.banco.ExecutaComando(`
            alter table despesa
              add column if not exists conta_pagar_id int(11) null,
              add column if not exists valor decimal(10,2) null,
              add column if not exists data date null,
              add column if not exists valor_total decimal(10,2) null after descricao,
              add column if not exists data_despesa date null after valor_total,
              add column if not exists forma_pagamento_prevista varchar(50) null after data_despesa,
              add column if not exists quantidade_parcelas int(11) not null default 1 after forma_pagamento_prevista,
              add column if not exists data_primeiro_vencimento date null after quantidade_parcelas,
              add column if not exists status varchar(50) default 'PENDENTE' after data_primeiro_vencimento,
              add index if not exists idx_despesa_tipo (tipo_despesa_id),
              add index if not exists idx_despesa_status (status)
        `, []);

        await this.banco.ExecutaComando(`
            update despesa
            set valor_total = coalesce(valor_total, valor),
                data_despesa = coalesce(data_despesa, data),
                data_primeiro_vencimento = coalesce(data_primeiro_vencimento, data),
                status = coalesce(status, 'PENDENTE')
        `, []);

        await this.banco.ExecutaComando(`
            create table if not exists conta_pagar (
                id int(11) not null auto_increment,
                despesa_id int(11) not null,
                numero_parcela int(11) not null,
                total_parcelas int(11) not null,
                valor decimal(10,2) not null,
                data_vencimento date not null,
                data_pagamento date default null,
                forma_pagamento varchar(50) default null,
                status varchar(50) default 'PENDENTE',
                primary key (id),
                key idx_conta_pagar_despesa (despesa_id),
                key idx_conta_pagar_status (status),
                key idx_conta_pagar_vencimento (data_vencimento),
                constraint conta_pagar_ibfk_1 foreign key (despesa_id) references despesa (id)
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_general_ci
        `, []);

        await this.banco.ExecutaComando(`
            alter table conta_pagar
              add column if not exists despesa_id int(11) null after id,
              add column if not exists numero_parcela int(11) not null default 1 after despesa_id,
              add column if not exists total_parcelas int(11) not null default 1 after numero_parcela,
              add column if not exists valor_total decimal(10,2) null,
              add column if not exists valor decimal(10,2) null after total_parcelas,
              add column if not exists data_pagamento date null after data_vencimento,
              add column if not exists forma_pagamento varchar(50) null after data_pagamento,
              add index if not exists idx_conta_pagar_despesa (despesa_id),
              add index if not exists idx_conta_pagar_status (status),
              add index if not exists idx_conta_pagar_vencimento (data_vencimento)
        `, []);

        await this.banco.ExecutaComando(`
            update conta_pagar cp
            join despesa d on d.conta_pagar_id = cp.id
            set cp.despesa_id = coalesce(cp.despesa_id, d.id),
                cp.valor = coalesce(cp.valor, cp.valor_total, d.valor_total),
                cp.data_vencimento = coalesce(cp.data_vencimento, d.data_primeiro_vencimento),
                cp.status = coalesce(cp.status, 'PENDENTE')
        `, []);

        await this.banco.ExecutaComando(`
            create table if not exists pagamento_despesa (
                id int(11) not null auto_increment,
                conta_pagar_id int(11) not null,
                data_pagamento date not null,
                valor_pago decimal(10,2) not null,
                forma_pagamento varchar(50) not null,
                primary key (id),
                key idx_pagamento_despesa_conta (conta_pagar_id),
                constraint pagamento_despesa_ibfk_1 foreign key (conta_pagar_id) references conta_pagar (id)
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_general_ci
        `, []);

        await this.banco.ExecutaComando(`
            insert ignore into tipo_despesa (nome, descricao, status)
            values
                ('Aluguel', 'Despesa fixa de aluguel', 'ATIVO'),
                ('Salarios', 'Pagamentos da equipe', 'ATIVO'),
                ('Materiais', 'Materiais de aula e administrativos', 'ATIVO'),
                ('Servicos', 'Servicos recorrentes ou eventuais', 'ATIVO')
        `, []);
    }

    async atualizarParcelasAtrasadas(conn = null) {
        const sql = `
            update conta_pagar
            set status = 'ATRASADA'
            where status = 'PENDENTE'
              and data_vencimento < curdate()
        `;
        if (conn) return await this.query(conn, sql, []);
        return await this.banco.ExecutaComandoNonQuery(sql, []);
    }

    async obterTipoAtivo(conn, tipoDespesaId) {
        const rows = await this.query(conn, `
            select id
            from tipo_despesa
            where id = ?
              and status = 'ATIVO'
            limit 1
        `, [tipoDespesaId]);
        return rows.length > 0 ? rows[0] : null;
    }

    gerarParcelas(valorTotal, quantidadeParcelas, primeiraData) {
        const totalCentavos = Math.round(Number(valorTotal) * 100);
        const baseCentavos = Math.floor(totalCentavos / quantidadeParcelas);
        const resto = totalCentavos - (baseCentavos * quantidadeParcelas);
        const parcelas = [];

        for (let index = 0; index < quantidadeParcelas; index += 1) {
            const centavos = baseCentavos + (index < resto ? 1 : 0);
            parcelas.push({
                numero_parcela: index + 1,
                valor: centavos / 100,
                data_vencimento: this.addMonths(primeiraData, index),
            });
        }

        return parcelas;
    }

    addMonths(dateString, months) {
        const [year, month, day] = String(dateString).split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1 + months, day));
        const targetMonth = month - 1 + months;
        if (date.getUTCMonth() !== ((targetMonth % 12) + 12) % 12) {
            date.setUTCDate(0);
        }
        return date.toISOString().split("T")[0];
    }

    mapTipo(row) {
        return {
            id: row.id,
            nome: row.nome,
            descricao: row.descricao,
            status: row.status || 'ATIVO',
        };
    }

    mapDespesa(row) {
        return {
            id: row.id,
            tipo_despesa_id: row.tipo_despesa_id,
            tipo_despesa_nome: row.tipo_despesa_nome,
            descricao: row.descricao,
            valor_total: Number(row.valor_total || 0),
            data_despesa: this.formatDateValue(row.data_despesa),
            forma_pagamento_prevista: row.forma_pagamento_prevista,
            quantidade_parcelas: Number(row.quantidade_parcelas || 1),
            data_primeiro_vencimento: this.formatDateValue(row.data_primeiro_vencimento),
            status: row.status || 'PENDENTE',
            valor_pago: Number(row.valor_pago || 0),
            saldo: Number(row.saldo || 0),
            total_parcelas: Number(row.total_parcelas || 0),
            parcelas_abertas: Number(row.parcelas_abertas || 0),
            parcelas_pagas: Number(row.parcelas_pagas || 0),
        };
    }

    mapParcela(row) {
        return {
            id: row.id,
            despesa_id: row.despesa_id,
            numero_parcela: Number(row.numero_parcela || 0),
            total_parcelas: Number(row.total_parcelas || 0),
            valor: Number(row.valor || 0),
            data_vencimento: this.formatDateValue(row.data_vencimento),
            data_pagamento: this.formatDateValue(row.data_pagamento),
            forma_pagamento: row.forma_pagamento,
            status: row.status || 'PENDENTE',
        };
    }

    formatDateValue(value) {
        if (!value) return null;
        if (value instanceof Date) return value.toISOString().split("T")[0];
        const str = value.toString();
        if (str.includes("T")) return str.split("T")[0];
        if (str.includes(" ")) return str.split(" ")[0];
        return str;
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
