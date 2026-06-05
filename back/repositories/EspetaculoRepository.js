import Repository from "./repository.js";

export default class EspetaculoRepository extends Repository {
    async garantirEstrutura() {
        await this.banco.ExecutaComando(`
            create table if not exists evento (
                id int(11) not null auto_increment,
                nome varchar(150) not null,
                data date default null,
                descricao varchar(255) default null,
                status varchar(50) not null default 'ATIVO',
                primary key (id)
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_general_ci
        `, []);

        await this.banco.ExecutaComando(`
            alter table evento
              add column if not exists status varchar(50) not null default 'ATIVO'
        `, []);

        await this.banco.ExecutaComando(`
            create table if not exists coreografia (
                id int(11) not null auto_increment,
                evento_id int(11) not null,
                nome varchar(100) not null,
                tipo varchar(50) default null,
                descricao varchar(255) default null,
                status varchar(50) not null default 'ATIVO',
                valor_fantasia_geral decimal(10,2) default null,
                primary key (id),
                key evento_id (evento_id),
                constraint coreografia_ibfk_1 foreign key (evento_id) references evento (id)
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_general_ci
        `, []);

        await this.banco.ExecutaComando(`
            alter table coreografia
              modify column evento_id int(11) null,
              add column if not exists descricao varchar(255) default null,
              add column if not exists status varchar(50) not null default 'ATIVO',
              add column if not exists valor_fantasia_geral decimal(10,2) default null
        `, []);

        await this.banco.ExecutaComando(`
            create table if not exists espetaculo_coreografia (
                id int(11) not null auto_increment,
                espetaculo_id int(11) not null,
                coreografia_id int(11) not null,
                status varchar(50) not null default 'ATIVO',
                primary key (id),
                unique key uk_espetaculo_coreografia (espetaculo_id, coreografia_id),
                key idx_espetaculo_coreografia_espetaculo (espetaculo_id),
                key idx_espetaculo_coreografia_coreografia (coreografia_id),
                constraint fk_espetaculo_coreografia_espetaculo foreign key (espetaculo_id) references evento (id),
                constraint fk_espetaculo_coreografia_coreografia foreign key (coreografia_id) references coreografia (id)
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_general_ci
        `, []);

        await this.banco.ExecutaComando(`
            insert ignore into espetaculo_coreografia (espetaculo_id, coreografia_id, status)
            select evento_id, id, 'ATIVO'
            from coreografia
            where evento_id is not null
        `, []);

        await this.banco.ExecutaComando(`
            create table if not exists coreografia_papel (
                id int(11) not null auto_increment,
                coreografia_id int(11) not null,
                nome varchar(100) not null,
                valor_fantasia decimal(10,2) not null default 0.00,
                status varchar(50) not null default 'ATIVO',
                primary key (id),
                key idx_coreografia_papel_coreografia (coreografia_id),
                constraint fk_coreografia_papel_coreografia foreign key (coreografia_id) references coreografia (id)
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_general_ci
        `, []);

        await this.banco.ExecutaComando(`
            alter table participacao_coreografia
              add column if not exists papel_id int(11) null after coreografia_id,
              add column if not exists status varchar(50) not null default 'ATIVO',
              add index if not exists idx_participacao_papel (papel_id),
              add unique index if not exists uk_participacao_coreografia_aluno_papel (coreografia_id, aluno_id, papel_id)
        `, []);

        await this.banco.ExecutaComando(`
            alter table conta_receber
              add column if not exists coreografia_id int(11) null after matricula_id,
              add column if not exists espetaculo_id int(11) null after coreografia_id,
              add column if not exists espetaculo_coreografia_id int(11) null after espetaculo_id,
              add column if not exists fantasia_id int(11) null after coreografia_id,
              add column if not exists participacao_coreografia_id int(11) null after fantasia_id,
              add column if not exists numero_parcela int(11) not null default 1 after participacao_coreografia_id,
              add column if not exists total_parcelas int(11) not null default 1 after numero_parcela,
              add index if not exists idx_conta_receber_fantasia_origem (espetaculo_coreografia_id, coreografia_id, fantasia_id, participacao_coreografia_id)
        `, []);

        await this.banco.ExecutaComando(`
            update conta_receber cr
            join coreografia c on c.id = cr.coreografia_id
            join espetaculo_coreografia ec on ec.coreografia_id = c.id and ec.espetaculo_id = c.evento_id
            set cr.espetaculo_id = coalesce(cr.espetaculo_id, ec.espetaculo_id),
                cr.espetaculo_coreografia_id = coalesce(cr.espetaculo_coreografia_id, ec.id)
            where cr.tipo_receita = 'FANTASIA'
              and cr.coreografia_id is not null
              and cr.espetaculo_coreografia_id is null
        `, []);
    }

    async listarEspetaculos({ incluirInativos = true } = {}) {
        await this.garantirEstrutura();
        let sql = `
            select e.id, e.nome, e.data, e.descricao, e.status,
                   count(distinct ec.coreografia_id) as total_coreografias
            from evento e
            left join espetaculo_coreografia ec on ec.espetaculo_id = e.id and ec.status = 'ATIVO'`;
        const values = [];
        if (!incluirInativos) {
            sql += ` where e.status = 'ATIVO'`;
        }
        sql += `
            group by
                e.id,
                e.nome,
                e.data,
                e.descricao,
                e.status
            order by e.data desc, e.nome asc`;

        const rows = await this.banco.ExecutaComando(sql, values);
        return rows.map((row) => ({
            id: row.id,
            nome: row.nome,
            data: this.formatDateValue(row.data),
            descricao: row.descricao,
            status: row.status || 'ATIVO',
            total_coreografias: Number(row.total_coreografias || 0),
        }));
    }

    async obterEspetaculo(id) {
        await this.garantirEstrutura();
        const rows = await this.banco.ExecutaComando(`
            select id, nome, data, descricao, status
            from evento
            where id = ?
            limit 1
        `, [id]);
        if (rows.length === 0) return null;
        const espetaculo = {
            id: rows[0].id,
            nome: rows[0].nome,
            data: this.formatDateValue(rows[0].data),
            descricao: rows[0].descricao,
            status: rows[0].status || 'ATIVO',
        };
        espetaculo.coreografias = await this.listarCoreografias({ espetaculo_id: id, incluirInativas: true });
        return espetaculo;
    }

    async cadastrarEspetaculo(dados) {
        await this.garantirEstrutura();
        return await this.banco.ExecutaComandoLastInserted(`
            insert into evento (nome, data, descricao, status)
            values (?, ?, ?, ?)
        `, [dados.nome, dados.data || null, dados.descricao || null, dados.status || 'ATIVO']);
    }

    async editarEspetaculo(id, dados) {
        await this.garantirEstrutura();
        return await this.banco.ExecutaComandoNonQuery(`
            update evento
            set nome = ?, data = ?, descricao = ?, status = ?
            where id = ?
        `, [dados.nome, dados.data || null, dados.descricao || null, dados.status, id]);
    }

    async possuiFantasiaPendenteEspetaculo(id) {
        await this.garantirEstrutura();
        const rows = await this.banco.ExecutaComando(`
            select cr.id
            from conta_receber cr
            where coalesce(cr.espetaculo_id, 0) = ?
              and cr.tipo_receita = 'FANTASIA'
              and cr.status in ('PENDENTE', 'ATRASADA', 'ATRASADA_COM_MULTA')
            limit 1
        `, [id]);
        return rows.length > 0;
    }

    async inativarEspetaculo(id) {
        await this.garantirEstrutura();
        return await this.banco.ExecutaComandoNonQuery(`update evento set status = 'INATIVO' where id = ?`, [id]);
    }

    async listarCoreografias({ espetaculo_id, incluirInativas = true } = {}) {
        await this.garantirEstrutura();
        const values = [];
        let sql = `
            select c.id, ec.id as espetaculo_coreografia_id,
                   ec.espetaculo_id, e.nome as espetaculo_nome,
                   c.nome, c.tipo, c.descricao, c.status, c.valor_fantasia_geral,
                   count(distinct p.id) as total_papeis,
                   count(distinct pc.id) as total_participantes
            from espetaculo_coreografia ec
            join coreografia c on c.id = ec.coreografia_id
            join evento e on e.id = ec.espetaculo_id
            left join coreografia_papel p on p.coreografia_id = c.id and p.status = 'ATIVO'
            left join participacao_coreografia pc on pc.coreografia_id = c.id and pc.status = 'ATIVO'
            where ec.status = 'ATIVO'`;

        if (espetaculo_id) {
            sql += ` and ec.espetaculo_id = ?`;
            values.push(espetaculo_id);
        }
        if (!incluirInativas) {
            sql += ` and c.status = 'ATIVO'`;
        }
        sql += `
            group by
                c.id,
                ec.id,
                ec.espetaculo_id,
                e.nome,
                e.data,
                c.nome,
                c.tipo,
                c.descricao,
                c.status,
                c.valor_fantasia_geral
            order by e.data desc, c.nome asc`;

        const rows = await this.banco.ExecutaComando(sql, values);
        return rows.map((row) => this.mapCoreografiaResumo(row));
    }

    async obterCoreografia(id, filtros = {}) {
        await this.garantirEstrutura();
        const values = [id];
        const rows = await this.banco.ExecutaComando(`
            select c.id, ec.id as espetaculo_coreografia_id,
                   ec.espetaculo_id, e.nome as espetaculo_nome,
                   c.nome, c.tipo, c.descricao, c.status, c.valor_fantasia_geral
            from coreografia c
            left join espetaculo_coreografia ec on ec.coreografia_id = c.id and ec.status = 'ATIVO'
            left join evento e on e.id = ec.espetaculo_id
            where c.id = ?
              ${filtros.espetaculo_coreografia_id ? 'and ec.id = ?' : ''}
              ${filtros.espetaculo_id ? 'and ec.espetaculo_id = ?' : ''}
            order by ec.id asc
            limit 1
        `, [
            ...values,
            ...(filtros.espetaculo_coreografia_id ? [filtros.espetaculo_coreografia_id] : []),
            ...(filtros.espetaculo_id ? [filtros.espetaculo_id] : []),
        ]);
        if (rows.length === 0) return null;

        const coreografia = this.mapCoreografiaResumo(rows[0]);
        coreografia.espetaculos = await this.listarEspetaculosDaCoreografia(id);
        coreografia.espetaculo_ids = coreografia.espetaculos.map((item) => item.id);
        coreografia.papeis = await this.listarPapeis(id, true);
        coreografia.participantes = await this.listarParticipantes(id);
        return coreografia;
    }

    async cadastrarCoreografia(dados) {
        await this.garantirEstrutura();
        const espetaculoIds = this.normalizarEspetaculoIds(dados);
        const coreografiaId = await this.banco.ExecutaComandoLastInserted(`
            insert into coreografia (evento_id, nome, tipo, descricao, status, valor_fantasia_geral)
            values (?, ?, ?, ?, ?, ?)
        `, [espetaculoIds[0], dados.nome, dados.tipo || null, dados.descricao || null, dados.status || 'ATIVO', dados.valor_fantasia_geral ?? null]);
        await this.sincronizarEspetaculosCoreografia(coreografiaId, espetaculoIds);
        return coreografiaId;
    }

    async editarCoreografia(id, dados) {
        await this.garantirEstrutura();
        const espetaculoIds = this.normalizarEspetaculoIds(dados);
        const atualizado = await this.banco.ExecutaComandoNonQuery(`
            update coreografia
            set evento_id = ?, nome = ?, tipo = ?, descricao = ?, status = ?, valor_fantasia_geral = ?
            where id = ?
        `, [espetaculoIds[0], dados.nome, dados.tipo || null, dados.descricao || null, dados.status, dados.valor_fantasia_geral ?? null, id]);
        if (atualizado) await this.sincronizarEspetaculosCoreografia(id, espetaculoIds);
        return atualizado;
    }

    async inativarCoreografia(id) {
        await this.garantirEstrutura();
        return await this.banco.ExecutaComandoNonQuery(`update coreografia set status = 'INATIVO' where id = ?`, [id]);
    }

    async listarPapeis(coreografiaId, incluirInativos = false) {
        await this.garantirEstrutura();
        let sql = `
            select id, coreografia_id, nome, valor_fantasia, status
            from coreografia_papel
            where coreografia_id = ?`;
        if (!incluirInativos) sql += ` and status = 'ATIVO'`;
        sql += ` order by nome asc`;
        const rows = await this.banco.ExecutaComando(sql, [coreografiaId]);
        return rows.map((row) => ({
            id: row.id,
            coreografia_id: row.coreografia_id,
            nome: row.nome,
            valor_fantasia: Number(row.valor_fantasia || 0),
            status: row.status || 'ATIVO',
        }));
    }

    async salvarPapel(coreografiaId, dados) {
        await this.garantirEstrutura();
        if (dados.id) {
            await this.banco.ExecutaComandoNonQuery(`
                update coreografia_papel
                set nome = ?, valor_fantasia = ?, status = ?
                where id = ? and coreografia_id = ?
            `, [dados.nome, dados.valor_fantasia, dados.status, dados.id, coreografiaId]);
            return dados.id;
        }
        return await this.banco.ExecutaComandoLastInserted(`
            insert into coreografia_papel (coreografia_id, nome, valor_fantasia, status)
            values (?, ?, ?, 'ATIVO')
        `, [coreografiaId, dados.nome, dados.valor_fantasia]);
    }

    async inativarPapel(id) {
        await this.garantirEstrutura();
        return await this.banco.ExecutaComandoNonQuery(`update coreografia_papel set status = 'INATIVO' where id = ?`, [id]);
    }

    async listarParticipantes(coreografiaId) {
        await this.garantirEstrutura();
        const rows = await this.banco.ExecutaComando(`
            select pc.id, pc.aluno_id, pessoa.nome as aluno_nome, pc.coreografia_id,
                   pc.papel_id, pc.papel, cp.nome as papel_nome, cp.valor_fantasia as valor_papel,
                   pc.valor_fantasia, pc.status
            from participacao_coreografia pc
            join pessoa pessoa on pessoa.id = pc.aluno_id
            left join coreografia_papel cp on cp.id = pc.papel_id
            where pc.coreografia_id = ?
              and pc.status = 'ATIVO'
            order by pessoa.nome asc, cp.nome asc
        `, [coreografiaId]);
        return rows.map((row) => ({
            id: row.id,
            aluno_id: row.aluno_id,
            aluno_nome: row.aluno_nome,
            coreografia_id: row.coreografia_id,
            papel_id: row.papel_id,
            papel_nome: row.papel_nome || row.papel,
            valor_papel: Number(row.valor_papel || 0),
            valor_fantasia: row.valor_fantasia === null ? null : Number(row.valor_fantasia || 0),
            valor_cobranca: row.valor_fantasia === null ? Number(row.valor_papel || 0) : Number(row.valor_fantasia || 0),
            status: row.status || 'ATIVO',
        }));
    }

    async salvarParticipante(coreografiaId, dados) {
        await this.garantirEstrutura();
        const papel = await this.obterPapelDaCoreografia(coreografiaId, dados.papel_id);
        if (!papel) throw new Error("Papel nao encontrado para esta coreografia");

        if (dados.id) {
            await this.banco.ExecutaComandoNonQuery(`
                update participacao_coreografia
                set aluno_id = ?, papel_id = ?, papel = ?, valor_fantasia = ?, status = ?
                where id = ? and coreografia_id = ?
            `, [dados.aluno_id, dados.papel_id, papel.nome, dados.valor_fantasia ?? null, dados.status, dados.id, coreografiaId]);
            return dados.id;
        }

        const existenteAluno = await this.banco.ExecutaComando(`
            select id
            from participacao_coreografia
            where coreografia_id = ?
              and aluno_id = ?
              and status = 'ATIVO'
            limit 1
        `, [coreografiaId, dados.aluno_id]);

        if (existenteAluno.length > 0) {
            await this.banco.ExecutaComandoNonQuery(`
                update participacao_coreografia
                set papel_id = ?, papel = ?, valor_fantasia = ?, status = 'ATIVO'
                where id = ?
            `, [dados.papel_id, papel.nome, dados.valor_fantasia ?? null, existenteAluno[0].id]);
            return existenteAluno[0].id;
        }

        const existentes = await this.banco.ExecutaComando(`
            select id
            from participacao_coreografia
            where coreografia_id = ?
              and aluno_id = ?
              and papel_id = ?
            limit 1
        `, [coreografiaId, dados.aluno_id, dados.papel_id]);

        if (existentes.length > 0) {
            await this.banco.ExecutaComandoNonQuery(`
                update participacao_coreografia
                set papel = ?, valor_fantasia = ?, status = 'ATIVO'
                where id = ?
            `, [papel.nome, dados.valor_fantasia ?? null, existentes[0].id]);
            return existentes[0].id;
        }

        return await this.banco.ExecutaComandoLastInserted(`
            insert into participacao_coreografia (aluno_id, coreografia_id, papel_id, papel, valor_fantasia, status)
            values (?, ?, ?, ?, ?, 'ATIVO')
        `, [dados.aluno_id, coreografiaId, dados.papel_id, papel.nome, dados.valor_fantasia ?? null]);
    }

    async inativarParticipante(id) {
        await this.garantirEstrutura();
        return await this.banco.ExecutaComandoNonQuery(`update participacao_coreografia set status = 'INATIVO' where id = ?`, [id]);
    }

    async gerarCobrancasFantasia(coreografiaId, { data_vencimento, participacao_ids = [], espetaculo_coreografia_id = null, espetaculo_id = null, quantidade_parcelas = 1 }) {
        await this.garantirEstrutura();
        const conn = await this.getConnection();
        const geradas = [];
        const ignoradas = [];
        const totalParcelas = Number.isInteger(Number(quantidade_parcelas)) && Number(quantidade_parcelas) > 0
            ? Number(quantidade_parcelas)
            : 1;

        try {
            await this.query(conn, "START TRANSACTION");
            const vinculo = await this.obterVinculoCoreografia(conn, coreografiaId, { espetaculo_coreografia_id, espetaculo_id });
            if (!vinculo) throw new Error("Coreografia nao vinculada ao espetaculo informado");

            const participantes = await this.listarParticipantesParaCobranca(conn, coreografiaId, participacao_ids);

            for (const participante of participantes) {
                if (!participante.papel_id) {
                    ignoradas.push({ participacao_coreografia_id: participante.id, motivo: "Sem papel vinculado" });
                    continue;
                }

                const existente = await this.query(conn, `
                    select id
                    from conta_receber
                    where tipo_receita = 'FANTASIA'
                      and participacao_coreografia_id = ?
                      and espetaculo_coreografia_id = ?
                    limit 1
                `, [participante.id, vinculo.id]);
                if (existente.length > 0) {
                    ignoradas.push({ participacao_coreografia_id: participante.id, conta_receber_id: existente[0].id, motivo: "Ja existe cobranca" });
                    continue;
                }

                const matricula = await this.query(conn, `
                    select id
                    from matricula
                    where aluno_id = ?
                      and status = 'ATIVA'
                    order by id desc
                    limit 1
                `, [participante.aluno_id]);

                if (matricula.length === 0) {
                    ignoradas.push({ participacao_coreografia_id: participante.id, motivo: "Aluno sem matricula ativa" });
                    continue;
                }

                const valor = participante.valor_fantasia === null
                    ? Number(participante.valor_papel || 0)
                    : Number(participante.valor_fantasia || 0);
                const parcelas = this.calcularParcelas(valor, totalParcelas, data_vencimento);
                const status = valor <= 0 ? 'PAGA' : 'PENDENTE';

                for (const parcela of parcelas) {
                    const result = await this.query(conn, `
                        insert into conta_receber
                            (grupo_financeiro_id, matricula_id, coreografia_id, fantasia_id, participacao_coreografia_id,
                             espetaculo_id, espetaculo_coreografia_id, numero_parcela, total_parcelas, tipo_receita,
                             mes_referencia, ano_referencia, valor_base, valor_final, multa, valor, status, data_vencimento)
                        values (null, ?, ?, ?, ?, ?, ?, ?, ?, 'FANTASIA', null, null, ?, ?, 0.00, ?, ?, ?)
                    `, [
                        matricula[0].id,
                        coreografiaId,
                        participante.papel_id,
                        participante.id,
                        vinculo.espetaculo_id,
                        vinculo.id,
                        parcela.numero,
                        totalParcelas,
                        parcela.valor,
                        parcela.valor,
                        parcela.valor,
                        status,
                        parcela.vencimento,
                    ]);
                    geradas.push({ participacao_coreografia_id: participante.id, conta_receber_id: result.insertId, parcela: parcela.numero });
                }
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

    calcularParcelas(valorTotal, totalParcelas, primeiroVencimento) {
        const totalCentavos = Math.round(Number(valorTotal || 0) * 100);
        const baseCentavos = Math.floor(totalCentavos / totalParcelas);
        const resto = totalCentavos % totalParcelas;
        return Array.from({ length: totalParcelas }, (_, index) => {
            const centavos = baseCentavos + (index < resto ? 1 : 0);
            return {
                numero: index + 1,
                valor: centavos / 100,
                vencimento: this.addMeses(primeiroVencimento, index),
            };
        });
    }

    addMeses(data, meses) {
        const [ano, mes, dia] = String(data).split("-").map(Number);
        const target = new Date(ano, mes - 1 + meses, 1);
        const ultimoDia = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        target.setDate(Math.min(dia, ultimoDia));
        return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
    }

    async listarEspetaculosDaCoreografia(coreografiaId) {
        const rows = await this.banco.ExecutaComando(`
            select e.id, e.nome, e.data, e.descricao, e.status, ec.id as espetaculo_coreografia_id
            from espetaculo_coreografia ec
            join evento e on e.id = ec.espetaculo_id
            where ec.coreografia_id = ?
              and ec.status = 'ATIVO'
            order by e.data desc, e.nome asc
        `, [coreografiaId]);

        return rows.map((row) => ({
            id: row.id,
            nome: row.nome,
            data: this.formatDateValue(row.data),
            descricao: row.descricao,
            status: row.status,
            espetaculo_coreografia_id: row.espetaculo_coreografia_id,
        }));
    }

    async sincronizarEspetaculosCoreografia(coreografiaId, espetaculoIds) {
        await this.banco.ExecutaComando(`
            update espetaculo_coreografia
            set status = 'INATIVO'
            where coreografia_id = ?
        `, [coreografiaId]);

        for (const espetaculoId of espetaculoIds) {
            await this.banco.ExecutaComando(`
                insert into espetaculo_coreografia (espetaculo_id, coreografia_id, status)
                values (?, ?, 'ATIVO')
                on duplicate key update status = 'ATIVO'
            `, [espetaculoId, coreografiaId]);
        }
    }

    normalizarEspetaculoIds(dados) {
        const ids = Array.isArray(dados.espetaculo_ids) && dados.espetaculo_ids.length > 0 ? dados.espetaculo_ids : [dados.espetaculo_id];
        return Array.from(new Set(ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)));
    }

    async obterVinculoCoreografia(conn, coreografiaId, filtros = {}) {
        const values = [coreografiaId];
        let sql = `
            select id, espetaculo_id, coreografia_id
            from espetaculo_coreografia
            where coreografia_id = ?
              and status = 'ATIVO'`;

        if (filtros.espetaculo_coreografia_id) {
            sql += ` and id = ?`;
            values.push(filtros.espetaculo_coreografia_id);
        } else if (filtros.espetaculo_id) {
            sql += ` and espetaculo_id = ?`;
            values.push(filtros.espetaculo_id);
        }

        sql += ` order by id asc limit 1`;
        const rows = await this.query(conn, sql, values);
        return rows.length > 0 ? rows[0] : null;
    }

    async obterPapelDaCoreografia(coreografiaId, papelId) {
        const rows = await this.banco.ExecutaComando(`
            select id, nome, valor_fantasia, status
            from coreografia_papel
            where id = ? and coreografia_id = ? and status = 'ATIVO'
            limit 1
        `, [papelId, coreografiaId]);
        return rows.length > 0 ? rows[0] : null;
    }

    async listarParticipantesParaCobranca(conn, coreografiaId, participacaoIds) {
        const values = [coreografiaId];
        let sql = `
            select pc.id, pc.aluno_id, pc.coreografia_id, pc.papel_id,
                   pc.valor_fantasia, cp.valor_fantasia as valor_papel
            from participacao_coreografia pc
            join coreografia_papel cp on cp.id = pc.papel_id and cp.status = 'ATIVO'
            where pc.coreografia_id = ?
              and pc.status = 'ATIVO'`;

        if (Array.isArray(participacaoIds) && participacaoIds.length > 0) {
            sql += ` and pc.id in (${participacaoIds.map(() => "?").join(",")})`;
            values.push(...participacaoIds);
        }

        return await this.query(conn, sql, values);
    }

    mapCoreografiaResumo(row) {
        return {
            id: row.id,
            espetaculo_coreografia_id: row.espetaculo_coreografia_id || null,
            espetaculo_id: row.espetaculo_id,
            espetaculo_nome: row.espetaculo_nome,
            nome: row.nome,
            tipo: row.tipo,
            descricao: row.descricao,
            status: row.status || 'ATIVO',
            valor_fantasia_geral: row.valor_fantasia_geral === null ? null : Number(row.valor_fantasia_geral || 0),
            total_papeis: Number(row.total_papeis || 0),
            total_participantes: Number(row.total_participantes || 0),
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
