import RelatorioFinanceiroRepository from "../repositories/RelatorioFinanceiroRepository.js";

export default class RelatorioFinanceiroController {
    constructor() {
        this.relatorioFinanceiroRepository = new RelatorioFinanceiroRepository();
    }

    async receitasDespesas(req, res) {
        try {
            const filtros = this.parseFiltrosMovimentacao(req.query);
            const relatorio = await this.relatorioFinanceiroRepository.receitasDespesas(filtros);
            return res.json(relatorio);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async dre(req, res) {
        try {
            const filtros = this.parseFiltrosDre(req.query);
            const dre = await this.relatorioFinanceiroRepository.dre(filtros);
            return res.json(dre);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    parseFiltrosMovimentacao(query) {
        const hoje = new Date();
        const dataInicio = this.isValidDate(query.data_inicio)
            ? String(query.data_inicio)
            : this.formatDate(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
        const dataFim = this.isValidDate(query.data_fim)
            ? String(query.data_fim)
            : this.formatDate(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0));

        const tipo = query.tipo_movimentacao ? String(query.tipo_movimentacao).toUpperCase() : "";

        return {
            categoria: query.categoria ? String(query.categoria) : null,
            data_inicio: dataInicio,
            data_fim: dataFim,
            turma_id: this.parsePositiveInt(query.turma_id),
            tipo_movimentacao: ["RECEITA", "DESPESA"].includes(tipo) ? tipo : null,
        };
    }

    parseFiltrosDre(query) {
        const hoje = new Date();
        const ano = this.parsePositiveInt(query.ano) || hoje.getFullYear();
        const mes = this.parsePositiveInt(query.mes);
        const tipoPeriodo = String(query.tipo_periodo || (mes ? "MENSAL" : "ANUAL")).toUpperCase();

        if (tipoPeriodo === "MENSAL" && mes >= 1 && mes <= 12) {
            const inicio = new Date(ano, mes - 1, 1);
            const fim = new Date(ano, mes, 0);
            const inicioComparacao = new Date(ano, mes - 2, 1);
            const fimComparacao = new Date(ano, mes - 1, 0);
            return {
                data_inicio: this.formatDate(inicio),
                data_fim: this.formatDate(fim),
                periodo_label: `${String(mes).padStart(2, "0")}/${ano}`,
                data_inicio_comparacao: this.formatDate(inicioComparacao),
                data_fim_comparacao: this.formatDate(fimComparacao),
                periodo_comparacao_label: `${String(inicioComparacao.getMonth() + 1).padStart(2, "0")}/${inicioComparacao.getFullYear()}`,
            };
        }

        return {
            data_inicio: `${ano}-01-01`,
            data_fim: `${ano}-12-31`,
            periodo_label: `${ano}`,
            data_inicio_comparacao: `${ano - 1}-01-01`,
            data_fim_comparacao: `${ano - 1}-12-31`,
            periodo_comparacao_label: `${ano - 1}`,
        };
    }

    parsePositiveInt(value) {
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }

    isValidDate(value) {
        if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime());
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
}
