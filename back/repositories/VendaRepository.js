import Repository from "./repository.js";

export default class VendaRepository extends Repository {
    async listarProdutos({ incluirInativos = false } = {}) {
        await this.garantirEstrutura();
        let sql = `
            select id, nome, descricao, valor_unitario, status
            from produto`;
        const values = [];

        if (!incluirInativos) {
            sql += ` where status = 'ATIVO'`;
        }

        sql += ` order by nome asc`;
        const rows = await this.banco.ExecutaComando(sql, values);
        return rows.map((row) => this.mapProduto(row));
    }

    async obterProduto(id) {
        await this.garantirEstrutura();
        const rows = await this.banco.ExecutaComando(`
            select id, nome, descricao, valor_unitario, status
            from produto
            where id = ?
        `, [id]);
        return rows.length > 0 ? this.mapProduto(rows[0]) : null;
    }

    async cadastrarProduto(dados) {
        await this.garantirEstrutura();
        const id = await this.banco.ExecutaComandoLastInserted(`
            insert into produto (nome, descricao, valor_unitario, status)
            values (?, ?, ?, ?)
        `, [dados.nome, dados.descricao || null, dados.valor_unitario, dados.status || 'ATIVO']);
        return id;
    }

    async editarProduto(id, dados) {
        await this.garantirEstrutura();
        return await this.banco.ExecutaComandoNonQuery(`
            update produto
            set nome = ?,
                descricao = ?,
                valor_unitario = ?,
                status = ?
            where id = ?
        `, [dados.nome, dados.descricao || null, dados.valor_unitario, dados.status, id]);
    }

    async inativarProduto(id) {
        await this.garantirEstrutura();
        return await this.banco.ExecutaComandoNonQuery(`
            update produto
            set status = 'INATIVO'
            where id = ?
        `, [id]);
    }

    async listarVendas(filtros = {}) {
        await this.garantirEstrutura();
        const values = [];
        let sql = `
            select
                v.id,
                v.matricula_id,
                v.data,
                v.valor_total,
                v.status,
                m.aluno_id,
                pessoa.nome as aluno_nome,
                v.conta_receber_id,
                cr.status as conta_receber_status
            from venda v
            join matricula m on m.id = v.matricula_id
            join aluno a on a.id = m.aluno_id
            join pessoa pessoa on pessoa.id = m.aluno_id
            left join conta_receber cr on cr.id = v.conta_receber_id
            where 1 = 1`;

        if (filtros.aluno_id) {
            sql += ` and m.aluno_id = ?`;
            values.push(filtros.aluno_id);
        }

        if (filtros.responsavel_id) {
            sql += ` and a.responsavel_id = ?`;
            values.push(filtros.responsavel_id);
        }

        if (filtros.matricula_id) {
            sql += ` and v.matricula_id = ?`;
            values.push(filtros.matricula_id);
        }

        if (filtros.status) {
            if (filtros.status === 'PAGO') {
                sql += ` and v.status in ('PAGO', 'PAGA')`;
            } else if (filtros.status === 'CANCELADO') {
                sql += ` and v.status in ('CANCELADO', 'CANCELADA')`;
            } else if (filtros.status === 'PENDENTE') {
                sql += ` and v.status in ('PENDENTE', 'CONFIRMADA')`;
            } else {
                sql += ` and v.status = ?`;
                values.push(filtros.status);
            }
        }

        sql += ` order by v.data desc, v.id desc`;
        const rows = await this.banco.ExecutaComando(sql, values);
        const vendas = rows.map((row) => this.mapVenda(row));

        if (vendas.length === 0) return [];

        const itens = await this.listarItensPorVenda(vendas.map((venda) => venda.id));
        return vendas.map((venda) => ({
            ...venda,
            itens: itens.filter((item) => item.venda_id === venda.id),
        }));
    }

    async obterVenda(id) {
        await this.garantirEstrutura();
        const rows = await this.banco.ExecutaComando(`
            select
                v.id,
                v.matricula_id,
                v.data,
                v.valor_total,
                v.status,
                m.aluno_id,
                pessoa.nome as aluno_nome,
                v.conta_receber_id,
                cr.status as conta_receber_status
            from venda v
            join matricula m on m.id = v.matricula_id
            join pessoa pessoa on pessoa.id = m.aluno_id
            left join conta_receber cr on cr.id = v.conta_receber_id
            where v.id = ?
            limit 1
        `, [id]);

        if (rows.length === 0) return null;
        const venda = this.mapVenda(rows[0]);
        const itens = await this.listarItensPorVenda([venda.id]);
        return { ...venda, itens };
    }

    async registrarVenda(dados) {
        await this.garantirEstrutura();
        const conn = await this.getConnection();
        try {
            await this.query(conn, "START TRANSACTION");

            const matricula = await this.obterMatriculaAtiva(conn, dados.matricula_id);
            if (!matricula) throw new Error("Matricula ativa nao encontrada");

            const itensPreparados = [];
            for (const item of dados.itens) {
                const produto = await this.obterProdutoAtivo(conn, item.produto_id);
                if (!produto) throw new Error("Produto inativo ou nao encontrado");
                itensPreparados.push({
                    produto_id: produto.id,
                    quantidade: item.quantidade,
                    valor_unitario: Number(produto.valor_unitario || 0),
                });
            }

            const valorTotal = itensPreparados.reduce((total, item) => {
                return total + (Number(item.quantidade) * Number(item.valor_unitario));
            }, 0);

            const vendaResult = await this.query(conn, `
                insert into venda (matricula_id, data, valor_total, status)
                values (?, ?, ?, 'PENDENTE')
            `, [dados.matricula_id, dados.data, valorTotal]);

            const vendaId = vendaResult.insertId;
            for (const item of itensPreparados) {
                await this.query(conn, `
                    insert into venda_produto (venda_id, produto_id, quantidade, valor_unitario)
                    values (?, ?, ?, ?)
                `, [vendaId, item.produto_id, item.quantidade, item.valor_unitario]);
            }

            const contaResult = await this.query(conn, `
                insert into conta_receber
                    (grupo_financeiro_id, matricula_id, tipo_receita, mes_referencia, ano_referencia, valor_base, valor_final, multa, valor, status, data_vencimento)
                values (null, ?, 'VENDA', null, null, ?, ?, 0.00, ?, 'PENDENTE', ?)
            `, [dados.matricula_id, valorTotal, valorTotal, valorTotal, dados.data]);
            const contaReceberId = contaResult.insertId;
            await this.query(conn, `
                update venda
                set conta_receber_id = ?
                where id = ?
            `, [contaReceberId, vendaId]);

            await this.query(conn, "COMMIT");
            return { id: vendaId, valor_total: valorTotal, conta_receber_id: contaReceberId };
        } catch (error) {
            await this.query(conn, "ROLLBACK");
            throw error;
        } finally {
            conn.release();
        }
    }

    async cancelarVenda(id) {
        await this.garantirEstrutura();
        const conn = await this.getConnection();
        try {
            await this.query(conn, "START TRANSACTION");
            const vendas = await this.query(conn, `
                select id, matricula_id, data, valor_total, status, conta_receber_id
                from venda
                where id = ?
                limit 1
            `, [id]);

            if (vendas.length === 0) {
                await this.query(conn, "ROLLBACK");
                return false;
            }

            const statusVenda = this.normalizarStatusVenda(vendas[0].status);
            if (['PAGO', 'CANCELADO'].includes(statusVenda)) {
                await this.query(conn, "ROLLBACK");
                return false;
            }

            await this.query(conn, `update venda set status = 'CANCELADO' where id = ?`, [id]);
            await this.query(conn, `
                update conta_receber
                set status = 'CANCELADA'
                where id = ?
                  and status not in ('PAGA', 'CANCELADA')
            `, [vendas[0].conta_receber_id]);

            await this.query(conn, "COMMIT");
            return true;
        } catch (error) {
            await this.query(conn, "ROLLBACK");
            throw error;
        } finally {
            conn.release();
        }
    }

    async marcarVendaComoPaga(id, { valor_pago, forma_pagamento, data_pagamento }) {
        await this.garantirEstrutura();
        const conn = await this.getConnection();
        try {
            await this.query(conn, "START TRANSACTION");
            const vendas = await this.query(conn, `
                select id, matricula_id, data, valor_total, status, conta_receber_id
                from venda
                where id = ?
                limit 1
            `, [id]);

            const statusVenda = vendas.length > 0 ? this.normalizarStatusVenda(vendas[0].status) : null;
            if (vendas.length === 0 || ['PAGO', 'CANCELADO'].includes(statusVenda)) {
                await this.query(conn, "ROLLBACK");
                return false;
            }

            let contaReceberId = vendas[0].conta_receber_id;
            if (!contaReceberId) {
                const contaResult = await this.query(conn, `
                    insert into conta_receber
                        (grupo_financeiro_id, matricula_id, tipo_receita, mes_referencia, ano_referencia, valor_base, valor_final, multa, valor, status, data_vencimento)
                    values (null, ?, 'VENDA', null, null, ?, ?, 0.00, ?, 'PENDENTE', ?)
                `, [
                    vendas[0].matricula_id,
                    vendas[0].valor_total,
                    vendas[0].valor_total,
                    vendas[0].valor_total,
                    this.formatDateValue(vendas[0].data),
                ]);
                contaReceberId = contaResult.insertId;
                await this.query(conn, `update venda set conta_receber_id = ? where id = ?`, [contaReceberId, id]);
            }

            const valorPago = Number.isFinite(Number(valor_pago)) && Number(valor_pago) > 0
                ? Number(valor_pago)
                : Number(vendas[0].valor_total || 0);
            const dataPagamento = data_pagamento || this.formatDateValue(new Date());
            const formaPagamento = forma_pagamento || 'NAO_INFORMADO';

            await this.query(conn, `
                insert into pagamento (conta_receber_id, data_pagamento, valor_pago, forma_pagamento)
                values (?, ?, ?, ?)
            `, [contaReceberId, dataPagamento, valorPago, formaPagamento]);
            await this.query(conn, `update conta_receber set status = 'PAGA' where id = ?`, [contaReceberId]);
            await this.query(conn, `update venda set status = 'PAGO' where id = ?`, [id]);

            await this.query(conn, "COMMIT");
            return true;
        } catch (error) {
            await this.query(conn, "ROLLBACK");
            throw error;
        } finally {
            conn.release();
        }
    }


    async listarMatriculasAtivas() {
        await this.garantirEstrutura();
        const rows = await this.banco.ExecutaComando(`
            select
                m.id,
                m.aluno_id,
                m.data_matricula,
                m.status,
                pessoa.nome as aluno_nome
            from matricula m
            join pessoa pessoa on pessoa.id = m.aluno_id
            where m.status = 'ATIVA'
              and pessoa.status = 'ATIVO'
            order by pessoa.nome asc
        `, []);

        return rows.map((row) => ({
            id: row.id,
            aluno_id: row.aluno_id,
            aluno_nome: row.aluno_nome,
            data_matricula: this.formatDateValue(row.data_matricula),
            status: row.status,
        }));
    }

    async garantirEstrutura() {
        await this.banco.ExecutaComando(`
            create table if not exists produto (
                id int(11) not null auto_increment,
                nome varchar(150) default null,
                descricao varchar(255) default null,
                valor_unitario decimal(10,2) default null,
                estoque int(11) default null,
                status varchar(50) default 'ATIVO',
                primary key (id)
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_general_ci
        `, []);

        await this.banco.ExecutaComando(`
            create table if not exists venda (
                id int(11) not null auto_increment,
                matricula_id int(11) not null,
                conta_receber_id int(11) null,
                data date default null,
                valor_total decimal(10,2) default null,
                status varchar(50) default 'PENDENTE',
                primary key (id),
                key matricula_id (matricula_id),
                key idx_venda_conta_receber (conta_receber_id),
                constraint venda_ibfk_1 foreign key (matricula_id) references matricula (id)
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_general_ci
        `, []);

        await this.banco.ExecutaComando(`
            create table if not exists venda_produto (
                id int(11) not null auto_increment,
                venda_id int(11) default null,
                produto_id int(11) default null,
                quantidade int(11) default null,
                valor_unitario decimal(10,2) default null,
                primary key (id),
                key venda_id (venda_id),
                key produto_id (produto_id),
                constraint venda_produto_ibfk_1 foreign key (venda_id) references venda (id),
                constraint venda_produto_ibfk_2 foreign key (produto_id) references produto (id)
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_general_ci
        `, []);

        await this.banco.ExecutaComando(`
            alter table venda
              add column if not exists conta_receber_id int(11) null after matricula_id,
              add index if not exists idx_venda_conta_receber (conta_receber_id)
        `, []);
    }

    async listarItensPorVenda(vendaIds) {
        if (!Array.isArray(vendaIds) || vendaIds.length === 0) return [];
        const placeholders = vendaIds.map(() => "?").join(",");
        const rows = await this.banco.ExecutaComando(`
            select
                vp.id,
                vp.venda_id,
                vp.produto_id,
                p.nome as produto_nome,
                vp.quantidade,
                vp.valor_unitario
            from venda_produto vp
            join produto p on p.id = vp.produto_id
            where vp.venda_id in (${placeholders})
            order by vp.id asc
        `, vendaIds);

        return rows.map((row) => ({
            id: row.id,
            venda_id: row.venda_id,
            produto_id: row.produto_id,
            produto_nome: row.produto_nome,
            quantidade: Number(row.quantidade || 0),
            valor_unitario: Number(row.valor_unitario || 0),
            subtotal: Number(row.quantidade || 0) * Number(row.valor_unitario || 0),
        }));
    }

    async obterMatriculaAtiva(conn, matriculaId) {
        const rows = await this.query(conn, `
            select id, aluno_id
            from matricula
            where id = ?
              and status = 'ATIVA'
            limit 1
        `, [matriculaId]);
        return rows.length > 0 ? rows[0] : null;
    }

    async obterProdutoAtivo(conn, produtoId) {
        const rows = await this.query(conn, `
            select id, nome, valor_unitario
            from produto
            where id = ?
              and status = 'ATIVO'
            limit 1
        `, [produtoId]);
        return rows.length > 0 ? rows[0] : null;
    }

    mapProduto(row) {
        return {
            id: row.id,
            nome: row.nome,
            descricao: row.descricao,
            valor_unitario: Number(row.valor_unitario || 0),
            status: row.status || 'ATIVO',
        };
    }

    mapVenda(row) {
        return {
            id: row.id,
            matricula_id: row.matricula_id,
            aluno_id: row.aluno_id,
            aluno_nome: row.aluno_nome,
            data: this.formatDateValue(row.data),
            valor_total: Number(row.valor_total || 0),
            status: this.normalizarStatusVenda(row.status),
            conta_receber_id: row.conta_receber_id || null,
            conta_receber_status: row.conta_receber_status || null,
        };
    }

    normalizarStatusVenda(status) {
        const value = String(status || '').toUpperCase();
        if (value === 'PAGA') return 'PAGO';
        if (value === 'CANCELADA') return 'CANCELADO';
        if (value === 'CONFIRMADA') return 'PENDENTE';
        return value || 'PENDENTE';
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
