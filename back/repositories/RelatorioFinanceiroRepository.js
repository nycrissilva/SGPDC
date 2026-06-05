import Repository from "./repository.js";

export default class RelatorioFinanceiroRepository extends Repository {
    async receitasDespesas(filtros) {
        const receitas = filtros.tipo_movimentacao !== "DESPESA"
            ? await this.listarReceitas(filtros)
            : [];
        const despesas = filtros.tipo_movimentacao !== "RECEITA"
            ? await this.listarDespesas(filtros)
            : [];

        const movimentacoes = [...receitas, ...despesas].sort((a, b) => {
            const dataDiff = String(b.data_movimentacao || "").localeCompare(String(a.data_movimentacao || ""));
            if (dataDiff !== 0) return dataDiff;
            return a.tipo_movimentacao.localeCompare(b.tipo_movimentacao);
        });

        const totalReceitas = receitas.reduce((total, item) => total + Number(item.valor || 0), 0);
        const totalDespesas = despesas.reduce((total, item) => total + Number(item.valor || 0), 0);

        return {
            filtros,
            movimentacoes,
            total_receitas: totalReceitas,
            total_despesas: totalDespesas,
            saldo_periodo: totalReceitas - totalDespesas,
        };
    }

    async dre(filtros) {
        const [periodoAtual, periodoComparacao] = await Promise.all([
            this.apurarDreCompetencia(filtros),
            this.apurarDreCompetencia({
                ...filtros,
                data_inicio: filtros.data_inicio_comparacao,
                data_fim: filtros.data_fim_comparacao,
            }),
        ]);

        const linhas = this.montarLinhasDre(periodoAtual, periodoComparacao);
        const totalReceitas = this.valorLinha(linhas, "receita_bruta");
        const totalDespesas = Math.abs(this.valorLinha(linhas, "total_despesas_operacionais"))
            + Math.abs(this.valorLinha(linhas, "custos"))
            + Math.abs(this.valorLinha(linhas, "despesas_extra_operacionais"))
            + Math.abs(this.valorLinha(linhas, "provisoes_ir_cs"))
            + Math.abs(this.valorLinha(linhas, "participacoes"));
        const resultado = this.valorLinha(linhas, "resultado_liquido");

        return {
            periodo: filtros.periodo_label,
            periodo_comparacao: filtros.periodo_comparacao_label,
            regime: "COMPETENCIA",
            linhas,
            receitas: periodoAtual.receitasPorTipo,
            despesas: periodoAtual.despesasPorCategoria,
            total_receitas: totalReceitas,
            total_despesas: totalDespesas,
            resultado_periodo: resultado,
            situacao: resultado >= 0 ? "SUPERAVIT" : "DEFICIT",
        };
    }

    async listarReceitas(filtros) {
        const values = [filtros.data_inicio, filtros.data_fim];
        let sql = `
            select
                'RECEITA' as tipo_movimentacao,
                cr.tipo_receita as categoria,
                case
                    when cr.tipo_receita = 'MENSALIDADE' then concat('Mensalidade ', coalesce(cr.mes_referencia, ''), '/', coalesce(cr.ano_referencia, ''))
                    when cr.tipo_receita = 'VENDA' then 'Venda'
                    else coalesce(cr.tipo_receita, 'Receita')
                end as descricao,
                coalesce(responsavel.nome, group_concat(distinct aluno_pessoa.nome order by aluno_pessoa.nome separator ', '), direto_pessoa.nome) as pessoa,
                group_concat(distinct coalesce(turma_direta.turma_nome, turma_grupo.turma_nome) order by coalesce(turma_direta.turma_nome, turma_grupo.turma_nome) separator ', ') as turma,
                pg.data_pagamento as data_movimentacao,
                pg.valor_pago as valor,
                pg.forma_pagamento,
                cr.status
            from pagamento pg
            join conta_receber cr on cr.id = pg.conta_receber_id
            left join grupo_financeiro gf on gf.id = cr.grupo_financeiro_id
            left join pessoa responsavel on responsavel.id = gf.responsavel_id
            left join matricula direto_matricula on direto_matricula.id = cr.matricula_id
            left join pessoa direto_pessoa on direto_pessoa.id = direto_matricula.aluno_id
            left join grupo_financeiro_aluno gfa on gfa.grupo_financeiro_id = gf.id
            left join pessoa aluno_pessoa on aluno_pessoa.id = gfa.aluno_id
            left join (
                select mt.matricula_id, t.id as turma_id, t.nome as turma_nome
                from matricula_turma mt
                join turma t on t.id = mt.turma_id
            ) turma_direta on turma_direta.matricula_id = direto_matricula.id
            left join matricula matricula_grupo on matricula_grupo.aluno_id = gfa.aluno_id and matricula_grupo.status = 'ATIVA'
            left join (
                select mt.matricula_id, t.id as turma_id, t.nome as turma_nome
                from matricula_turma mt
                join turma t on t.id = mt.turma_id
            ) turma_grupo on turma_grupo.matricula_id = matricula_grupo.id
            where cr.status = 'PAGA'
              and pg.data_pagamento between ? and ?`;

        if (filtros.categoria) {
            sql += ` and cr.tipo_receita = ?`;
            values.push(filtros.categoria);
        }

        if (filtros.turma_id) {
            sql += ` and (
                turma_direta.turma_id = ?
                or turma_grupo.turma_id = ?
            )`;
            values.push(filtros.turma_id, filtros.turma_id);
        }

        sql += `
            group by
                pg.id,
                cr.id,
                cr.tipo_receita,
                cr.mes_referencia,
                cr.ano_referencia,
                responsavel.nome,
                direto_pessoa.nome,
                pg.data_pagamento,
                pg.valor_pago,
                pg.forma_pagamento,
                cr.status
            order by pg.data_pagamento desc, pg.id desc`;

        const rows = await this.banco.ExecutaComando(sql, values);
        return rows.map((row) => this.mapMovimentacao(row));
    }

    async listarDespesas(filtros) {
        const values = [filtros.data_inicio, filtros.data_fim, filtros.data_inicio, filtros.data_fim];
        let sql = `
            select
                'DESPESA' as tipo_movimentacao,
                td.nome as categoria,
                d.descricao,
                null as pessoa,
                null as turma,
                case when cp.status = 'PAGA' then cp.data_pagamento else d.data_despesa end as data_movimentacao,
                cp.valor as valor,
                coalesce(cp.forma_pagamento, d.forma_pagamento_prevista) as forma_pagamento,
                cp.status
            from despesa d
            join tipo_despesa td on td.id = d.tipo_despesa_id
            join conta_pagar cp on cp.despesa_id = d.id
            where d.status <> 'CANCELADA'
              and (
                (cp.status = 'PAGA' and cp.data_pagamento between ? and ?)
                or (cp.status <> 'PAGA' and d.data_despesa between ? and ?)
              )`;

        if (filtros.categoria) {
            sql += ` and (td.nome = ? or cast(td.id as char) = ?)`;
            values.push(filtros.categoria, filtros.categoria);
        }

        sql += ` order by data_movimentacao desc, d.id desc, cp.numero_parcela asc`;
        const rows = await this.banco.ExecutaComando(sql, values);
        return rows.map((row) => this.mapMovimentacao(row));
    }

    async agruparReceitas(filtros) {
        const rows = await this.listarReceitas({ ...filtros, tipo_movimentacao: "RECEITA" });
        return this.agruparPorCategoria(rows);
    }

    async agruparDespesas(filtros) {
        const rows = await this.listarDespesas({ ...filtros, tipo_movimentacao: "DESPESA" });
        return this.agruparPorCategoria(rows);
    }

    async apurarDreCompetencia(filtros) {
        const [receitas, despesas] = await Promise.all([
            this.listarReceitasCompetencia(filtros),
            this.listarDespesasCompetencia(filtros),
        ]);

        const receitasPorTipo = this.agruparPorCategoria(receitas);
        const despesasPorCategoria = this.agruparPorCategoria(despesas);

        const receitaBruta = receitas.reduce((total, item) => total + Number(item.valor || 0), 0);
        const deducoes = despesas
            .filter((item) => this.ehCategoria(item.categoria, ["deducao", "devolucao", "desconto", "abatimento", "imposto sobre venda"]))
            .reduce((total, item) => total + Number(item.valor || 0), 0);
        const custos = despesas
            .filter((item) => this.ehCategoria(item.categoria, ["custo", "cmv", "mercadoria vendida", "servico prestado", "produto vendido"]))
            .reduce((total, item) => total + Number(item.valor || 0), 0);
        const despesasVendas = despesas
            .filter((item) => this.ehCategoria(item.categoria, ["venda", "comercial", "marketing"]))
            .reduce((total, item) => total + Number(item.valor || 0), 0);
        const despesasAdministrativas = despesas
            .filter((item) => this.ehCategoria(item.categoria, ["administr", "salario", "aluguel", "material", "servico", "manutencao"]))
            .reduce((total, item) => total + Number(item.valor || 0), 0);
        const despesasFinanceiras = despesas
            .filter((item) => this.ehCategoria(item.categoria, ["financeir", "juros", "tarifa", "banco"]))
            .reduce((total, item) => total + Number(item.valor || 0), 0);
        const despesasExtraOperacionais = despesas
            .filter((item) => this.ehCategoria(item.categoria, ["extra", "nao operacional", "não operacional", "perda"]))
            .reduce((total, item) => total + Number(item.valor || 0), 0);
        const provisoesIrCs = despesas
            .filter((item) => this.ehCategoria(item.categoria, ["imposto de renda", "ir", "csll", "contribuicao social", "contribuição social"]))
            .reduce((total, item) => total + Number(item.valor || 0), 0);
        const participacoes = despesas
            .filter((item) => this.ehCategoria(item.categoria, ["participacao", "participação", "lucros"]))
            .reduce((total, item) => total + Number(item.valor || 0), 0);
        const despesasClassificadas = deducoes + custos + despesasVendas + despesasAdministrativas + despesasFinanceiras
            + despesasExtraOperacionais + provisoesIrCs + participacoes;
        const outrasDespesasOperacionais = Math.max(0, despesas.reduce((total, item) => total + Number(item.valor || 0), 0) - despesasClassificadas);
        const outrasReceitasOperacionais = receitas
            .filter((item) => !this.ehCategoria(item.categoria, ["mensalidade", "venda", "fantasia"]))
            .reduce((total, item) => total + Number(item.valor || 0), 0);

        return {
            receitaBruta,
            deducoes,
            custos,
            despesasVendas,
            despesasAdministrativas,
            despesasFinanceiras,
            outrasDespesasOperacionais,
            outrasReceitasOperacionais,
            despesasExtraOperacionais,
            provisoesIrCs,
            participacoes,
            receitasPorTipo,
            despesasPorCategoria,
        };
    }

    async listarReceitasCompetencia(filtros) {
        const values = [filtros.data_inicio, filtros.data_fim, filtros.data_inicio, filtros.data_fim];
        const sql = `
            select
                cr.tipo_receita as categoria,
                coalesce(cr.valor_final, cr.valor_base, cr.valor, 0) as valor
            from conta_receber cr
            left join venda v on v.conta_receber_id = cr.id
            where cr.status <> 'CANCELADA'
              and (
                (cr.tipo_receita = 'MENSALIDADE'
                  and str_to_date(concat(cr.ano_referencia, '-', lpad(cr.mes_referencia, 2, '0'), '-01'), '%Y-%m-%d') between ? and ?)
                or (cr.tipo_receita <> 'MENSALIDADE'
                  and coalesce(v.data, cr.data_vencimento) between ? and ?)
              )`;

        const rows = await this.banco.ExecutaComando(sql, values);
        return rows.map((row) => ({
            categoria: row.categoria || "Receita",
            valor: Number(row.valor || 0),
        }));
    }

    async listarDespesasCompetencia(filtros) {
        const rows = await this.banco.ExecutaComando(`
            select
                td.nome as categoria,
                d.valor_total as valor
            from despesa d
            join tipo_despesa td on td.id = d.tipo_despesa_id
            where d.status <> 'CANCELADA'
              and d.data_despesa between ? and ?
        `, [filtros.data_inicio, filtros.data_fim]);

        return rows.map((row) => ({
            categoria: row.categoria || "Despesa",
            valor: Number(row.valor || 0),
        }));
    }

    montarLinhasDre(atual, comparacao) {
        const receitaLiquida = atual.receitaBruta - atual.deducoes;
        const receitaLiquidaComparacao = comparacao.receitaBruta - comparacao.deducoes;
        const lucroBruto = receitaLiquida - atual.custos;
        const lucroBrutoComparacao = receitaLiquidaComparacao - comparacao.custos;
        const despesasOperacionais = atual.despesasVendas + atual.despesasAdministrativas + atual.despesasFinanceiras + atual.outrasDespesasOperacionais;
        const despesasOperacionaisComparacao = comparacao.despesasVendas + comparacao.despesasAdministrativas + comparacao.despesasFinanceiras + comparacao.outrasDespesasOperacionais;
        const resultadoOperacional = lucroBruto - despesasOperacionais + atual.outrasReceitasOperacionais;
        const resultadoOperacionalComparacao = lucroBrutoComparacao - despesasOperacionaisComparacao + comparacao.outrasReceitasOperacionais;
        const resultadoAntesIrCs = resultadoOperacional - atual.despesasExtraOperacionais;
        const resultadoAntesIrCsComparacao = resultadoOperacionalComparacao - comparacao.despesasExtraOperacionais;
        const resultadoLiquido = resultadoAntesIrCs - atual.provisoesIrCs - atual.participacoes;
        const resultadoLiquidoComparacao = resultadoAntesIrCsComparacao - comparacao.provisoesIrCs - comparacao.participacoes;

        return [
            this.linhaDre("receita_bruta", "RECEITA BRUTA", "Receitas brutas de vendas e servicos", atual.receitaBruta, comparacao.receitaBruta, "subtotal"),
            this.linhaDre("deducoes", "(-) DEDUCOES", "Devolucoes, descontos, abatimentos e impostos sobre vendas", -atual.deducoes, -comparacao.deducoes, "detail"),
            this.linhaDre("receita_liquida", "RECEITA LIQUIDA", "Receita liquida", receitaLiquida, receitaLiquidaComparacao, "subtotal"),
            this.linhaDre("custos", "(-) CUSTOS", "Custos dos produtos vendidos e servicos prestados", -atual.custos, -comparacao.custos, "detail"),
            this.linhaDre("lucro_bruto", "LUCRO BRUTO", "Resultado operacional bruto", lucroBruto, lucroBrutoComparacao, "subtotal"),
            this.linhaDre("despesas_vendas", "(-) DESPESAS COM VENDAS", "Despesas comerciais e de vendas", -atual.despesasVendas, -comparacao.despesasVendas, "detail"),
            this.linhaDre("despesas_administrativas", "(-) DESPESAS ADMINISTRATIVAS", "Despesas administrativas", -atual.despesasAdministrativas, -comparacao.despesasAdministrativas, "detail"),
            this.linhaDre("despesas_financeiras", "(-) DESPESAS FINANCEIRAS", "Despesas financeiras", -atual.despesasFinanceiras, -comparacao.despesasFinanceiras, "detail"),
            this.linhaDre("outras_despesas_operacionais", "(-) OUTRAS DESPESAS OPERACIONAIS", "Demais despesas operacionais", -atual.outrasDespesasOperacionais, -comparacao.outrasDespesasOperacionais, "detail"),
            this.linhaDre("outras_receitas_operacionais", "(+) OUTRAS RECEITAS OPERACIONAIS", "Receitas financeiras, aluguel e outras receitas", atual.outrasReceitasOperacionais, comparacao.outrasReceitasOperacionais, "detail"),
            this.linhaDre("total_despesas_operacionais", "TOTAL DESPESAS OPERACIONAIS", "Despesas operacionais liquidas", -despesasOperacionais + atual.outrasReceitasOperacionais, -despesasOperacionaisComparacao + comparacao.outrasReceitasOperacionais, "detail"),
            this.linhaDre("resultado_operacional_liquido", "RESULTADO OPERACIONAL LIQUIDO", "Resultado operacional liquido", resultadoOperacional, resultadoOperacionalComparacao, "subtotal"),
            this.linhaDre("despesas_extra_operacionais", "(-) DESPESAS EXTRA OPERACIONAIS", "Perdas e despesas nao operacionais", -atual.despesasExtraOperacionais, -comparacao.despesasExtraOperacionais, "detail"),
            this.linhaDre("resultado_antes_ir_cs", "RESULTADO ANTES DO IR E CS", "Resultado antes do IR e Contribuicao Social", resultadoAntesIrCs, resultadoAntesIrCsComparacao, "subtotal"),
            this.linhaDre("provisoes_ir_cs", "(-) PROVISOES IR E CS", "Provisoes de Imposto de Renda e Contribuicao Social", -atual.provisoesIrCs, -comparacao.provisoesIrCs, "detail"),
            this.linhaDre("participacoes", "(-) PARTICIPACOES", "Participacoes de empregados e administradores", -atual.participacoes, -comparacao.participacoes, "detail"),
            this.linhaDre("resultado_liquido", "RESULTADO LIQUIDO", "Resultado liquido do exercicio", resultadoLiquido, resultadoLiquidoComparacao, "total"),
        ];
    }

    linhaDre(id, grupo, descricao, valor, valorComparacao, nivel) {
        const variacao = valor - valorComparacao;
        const variacaoPercentual = valorComparacao !== 0 ? (variacao / Math.abs(valorComparacao)) * 100 : null;
        return {
            id,
            grupo,
            descricao,
            valor: Number(valor || 0),
            valor_comparacao: Number(valorComparacao || 0),
            variacao,
            variacao_percentual: variacaoPercentual,
            nivel,
        };
    }

    valorLinha(linhas, id) {
        return Number(linhas.find((linha) => linha.id === id)?.valor || 0);
    }

    ehCategoria(categoria, termos) {
        const normalizada = this.normalizarTexto(categoria);
        return termos.some((termo) => normalizada.includes(this.normalizarTexto(termo)));
    }

    normalizarTexto(value) {
        return String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    agruparPorCategoria(rows) {
        const grupos = new Map();
        rows.forEach((row) => {
            const categoria = row.categoria || "Sem categoria";
            grupos.set(categoria, (grupos.get(categoria) || 0) + Number(row.valor || 0));
        });
        return Array.from(grupos.entries())
            .map(([categoria, valor]) => ({ categoria, valor }))
            .sort((a, b) => b.valor - a.valor);
    }

    mapMovimentacao(row) {
        return {
            tipo_movimentacao: row.tipo_movimentacao,
            categoria: row.categoria || "Sem categoria",
            descricao: row.descricao || "-",
            pessoa: row.pessoa || null,
            turma: row.turma || null,
            data_movimentacao: this.formatDateValue(row.data_movimentacao),
            valor: Number(row.valor || 0),
            forma_pagamento: row.forma_pagamento || null,
            status: row.status || null,
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
}
