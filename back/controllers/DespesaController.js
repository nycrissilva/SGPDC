import DespesaRepository from "../repositories/DespesaRepository.js";

export default class DespesaController {
    constructor() {
        this.despesaRepository = new DespesaRepository();
    }

    async listarTipos(req, res) {
        try {
            const incluirInativos = String(req.query.incluir_inativos || '').toLowerCase() === 'true';
            const tipos = await this.despesaRepository.listarTipos({ incluirInativos });
            return res.json(tipos);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrarTipo(req, res) {
        try {
            const dados = {
                nome: String(req.body.nome || '').trim(),
                descricao: req.body.descricao ? String(req.body.descricao).trim() : null,
            };
            if (!dados.nome) return res.status(400).json({ error: "Nome do tipo de despesa e obrigatorio" });
            const id = await this.despesaRepository.cadastrarTipo(dados);
            return res.status(201).json({ id });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async listar(req, res) {
        try {
            const filtros = {
                status: req.query.status ? String(req.query.status).toUpperCase() : null,
                tipo_despesa_id: this.parsePositiveInt(req.query.tipo_despesa_id),
                em_aberto: String(req.query.em_aberto || '').toLowerCase() === 'true',
            };
            const despesas = await this.despesaRepository.listarDespesas(filtros);
            return res.json(despesas);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async obter(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: "Despesa invalida" });
            const despesa = await this.despesaRepository.obterDespesa(id);
            if (!despesa) return res.status(404).json({ error: "Despesa nao encontrada" });
            return res.json(despesa);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrar(req, res) {
        try {
            const dados = this.parseDespesa(req.body);
            const erro = this.validarDespesa(dados);
            if (erro) return res.status(400).json({ error: erro });

            const resultado = await this.despesaRepository.lancarDespesa(dados);
            return res.status(201).json(resultado);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async editar(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: "Despesa invalida" });

            const dados = this.parseDespesa(req.body);
            const erro = this.validarDespesa(dados);
            if (erro) return res.status(400).json({ error: erro });

            const atualizado = await this.despesaRepository.editarDespesa(id, dados);
            if (!atualizado) return res.status(404).json({ error: "Despesa nao encontrada" });
            return res.json({ success: true });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async quitarParcela(req, res) {
        try {
            const parcelaId = this.parsePositiveInt(req.params.parcelaId);
            if (!parcelaId) return res.status(400).json({ error: "Parcela invalida" });

            const dados = {
                data_pagamento: req.body.data_pagamento,
                forma_pagamento: req.body.forma_pagamento ? String(req.body.forma_pagamento).toUpperCase() : '',
                valor_pago: Number(req.body.valor_pago),
            };

            if (!this.isValidDate(dados.data_pagamento)) return res.status(400).json({ error: "Data de pagamento invalida" });
            if (!dados.forma_pagamento) return res.status(400).json({ error: "Forma de pagamento obrigatoria" });
            if (!Number.isFinite(dados.valor_pago) || dados.valor_pago <= 0) return res.status(400).json({ error: "Valor pago invalido" });

            const quitada = await this.despesaRepository.quitarParcela(parcelaId, dados);
            if (!quitada) return res.status(404).json({ error: "Parcela nao encontrada" });
            return res.json({ success: true });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    parseDespesa(body) {
        const pagamentoParcelado = String(body.pagamento || body.tipo_pagamento || '').toUpperCase() === 'PARCELADO';

        return {
            descricao: String(body.descricao || '').trim(),
            tipo_despesa_id: this.parsePositiveInt(body.tipo_despesa_id),
            valor_total: Number(body.valor_total),
            data_despesa: body.data_despesa,
            forma_pagamento_prevista: body.forma_pagamento_prevista ? String(body.forma_pagamento_prevista).toUpperCase() : null,
            quantidade_parcelas: pagamentoParcelado ? Number(body.quantidade_parcelas) : 1,
            data_primeiro_vencimento: body.data_primeiro_vencimento || body.data_despesa,
        };
    }

    validarDespesa(dados) {
        if (!dados.descricao) return "Descricao da despesa e obrigatoria";
        if (!dados.tipo_despesa_id) return "Categoria da despesa e obrigatoria";
        if (!Number.isFinite(dados.valor_total) || dados.valor_total <= 0) return "Valor da despesa invalido";
        if (!this.isValidDate(dados.data_despesa)) return "Data da despesa invalida";
        if (!dados.forma_pagamento_prevista) return "Forma de pagamento prevista obrigatoria";
        if (!Number.isInteger(dados.quantidade_parcelas) || dados.quantidade_parcelas <= 0) return "Quantidade de parcelas invalida";
        if (!this.isValidDate(dados.data_primeiro_vencimento)) return "Data de vencimento da primeira parcela invalida";
        return null;
    }

    isValidDate(value) {
        if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime());
    }

    parsePositiveInt(value) {
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }
}
