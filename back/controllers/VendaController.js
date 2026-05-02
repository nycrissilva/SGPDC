import VendaRepository from "../repositories/VendaRepository.js";

export default class VendaController {
    constructor() {
        this.vendaRepository = new VendaRepository();
    }

    async listarProdutos(req, res) {
        try {
            const incluirInativos = String(req.query.incluir_inativos || '').toLowerCase() === 'true';
            const produtos = await this.vendaRepository.listarProdutos({ incluirInativos });
            return res.json(produtos);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrarProduto(req, res) {
        try {
            const dados = this.parseProduto(req.body);
            dados.status = 'ATIVO';
            const erro = this.validarProduto(dados);
            if (erro) return res.status(400).json({ error: erro });

            const id = await this.vendaRepository.cadastrarProduto(dados);
            return res.status(201).json({ id });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async editarProduto(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: "Produto invalido" });

            const produtoExistente = await this.vendaRepository.obterProduto(id);
            if (!produtoExistente) return res.status(404).json({ error: "Produto nao encontrado" });

            const dados = this.parseProduto(req.body);
            const erro = this.validarProduto(dados);
            if (erro) return res.status(400).json({ error: erro });

            const atualizado = await this.vendaRepository.editarProduto(id, dados);
            if (!atualizado) return res.status(404).json({ error: "Produto nao encontrado" });
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async inativarProduto(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: "Produto invalido" });

            const inativado = await this.vendaRepository.inativarProduto(id);
            if (!inativado) return res.status(404).json({ error: "Produto nao encontrado" });
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async listarVendas(req, res) {
        try {
            const filtros = {
                aluno_id: this.parsePositiveInt(req.query.aluno_id),
                matricula_id: this.parsePositiveInt(req.query.matricula_id),
                status: req.query.status ? String(req.query.status).toUpperCase() : null,
            };
            const vendas = await this.vendaRepository.listarVendas(filtros);
            return res.json(vendas);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async obterVenda(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: "Venda invalida" });

            const venda = await this.vendaRepository.obterVenda(id);
            if (!venda) return res.status(404).json({ error: "Venda nao encontrada" });
            return res.json(venda);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async registrarVenda(req, res) {
        try {
            const dados = {
                matricula_id: this.parsePositiveInt(req.body.matricula_id),
                data: req.body.data,
                itens: Array.isArray(req.body.itens) ? req.body.itens.map((item) => ({
                    produto_id: this.parsePositiveInt(item.produto_id),
                    quantidade: Number(item.quantidade),
                })) : [],
            };

            const erro = this.validarVenda(dados);
            if (erro) return res.status(400).json({ error: erro });

            const resultado = await this.vendaRepository.registrarVenda(dados);
            return res.status(201).json(resultado);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async cancelarVenda(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: "Venda invalida" });

            const cancelada = await this.vendaRepository.cancelarVenda(id);
            if (!cancelada) return res.status(404).json({ error: "Venda nao encontrada ou ja cancelada" });
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async marcarVendaComoPaga(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: "Venda invalida" });

            const dados = {
                valor_pago: Number(req.body.valor_pago),
                forma_pagamento: req.body.forma_pagamento,
                data_pagamento: req.body.data_pagamento,
            };

            if (req.body.valor_pago !== undefined && (!Number.isFinite(dados.valor_pago) || dados.valor_pago < 0)) {
                return res.status(400).json({ error: "Valor pago invalido" });
            }

            const pago = await this.vendaRepository.marcarVendaComoPaga(id, dados);
            if (!pago) return res.status(404).json({ error: "Venda nao encontrada ou ja encerrada" });
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async listarMatriculas(req, res) {
        try {
            const matriculas = await this.vendaRepository.listarMatriculasAtivas();
            return res.json(matriculas);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    parseProduto(body) {
        return {
            nome: String(body.nome || '').trim(),
            descricao: body.descricao ? String(body.descricao).trim() : null,
            valor_unitario: Number(body.valor_unitario),
            status: body.status ? String(body.status).toUpperCase() : 'ATIVO',
        };
    }

    validarProduto(dados) {
        if (!dados.nome) return "Nome do produto e obrigatorio";
        if (!Number.isFinite(dados.valor_unitario) || dados.valor_unitario < 0) return "Valor unitario invalido";
        if (!['ATIVO', 'INATIVO'].includes(dados.status)) return "Status invalido";
        return null;
    }

    validarVenda(dados) {
        if (!dados.matricula_id) return "Matricula obrigatoria";
        if (!dados.data || !/^\d{4}-\d{2}-\d{2}$/.test(String(dados.data))) return "Data da venda invalida";
        if (!Array.isArray(dados.itens) || dados.itens.length === 0) return "Informe ao menos um produto";
        for (const item of dados.itens) {
            if (!item.produto_id) return "Produto invalido";
            if (!Number.isInteger(item.quantidade) || item.quantidade <= 0) return "Quantidade invalida";
        }
        return null;
    }

    parsePositiveInt(value) {
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }
}
