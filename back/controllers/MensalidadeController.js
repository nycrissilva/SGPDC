import MensalidadeRepository from "../repositories/MensalidadeRepository.js";

export default class MensalidadeController {
    constructor() {
        this.mensalidadeRepository = new MensalidadeRepository();
    }

    async listar(req, res) {
        try {
            const filtros = {
                responsavel_id: this.parsePositiveInt(req.query.responsavel_id),
                aluno_id: this.parsePositiveInt(req.query.aluno_id),
                mes_referencia: this.parsePositiveInt(req.query.mes_referencia),
                ano_referencia: this.parsePositiveInt(req.query.ano_referencia),
                status: req.query.status ? String(req.query.status).toUpperCase() : null,
            };

            const mensalidades = await this.mensalidadeRepository.listar(filtros);
            return res.json(mensalidades);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async listarFantasias(req, res) {
        try {
            const filtros = {
                aluno_id: this.parsePositiveInt(req.query.aluno_id),
                responsavel_id: this.parsePositiveInt(req.query.responsavel_id),
                turma_id: this.parsePositiveInt(req.query.turma_id),
                status: req.query.status ? String(req.query.status).toUpperCase() : null,
            };

            const fantasias = await this.mensalidadeRepository.listarFantasias(filtros);
            return res.json(fantasias);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async gerar(req, res) {
        try {
            const mesReferencia = this.parsePositiveInt(req.body.mes_referencia);
            const anoReferencia = this.parsePositiveInt(req.body.ano_referencia);

            const erro = this.validarMesAno(mesReferencia, anoReferencia);
            if (erro) return res.status(400).json({ error: erro });

            const resultado = await this.mensalidadeRepository.gerarMensalidades(mesReferencia, anoReferencia);
            return res.status(201).json(resultado);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async gerarGrupo(req, res) {
        try {
            const grupoId = this.parsePositiveInt(req.body.grupo_financeiro_id);
            const mesReferencia = this.parsePositiveInt(req.body.mes_referencia);
            const anoReferencia = this.parsePositiveInt(req.body.ano_referencia);
            const erro = this.validarMesAno(mesReferencia, anoReferencia);
            if (!grupoId) return res.status(400).json({ error: 'Plano financeiro invalido' });
            if (erro) return res.status(400).json({ error: erro });

            const id = await this.mensalidadeRepository.gerarMensalidadeGrupo(grupoId, mesReferencia, anoReferencia);
            if (!id) return res.status(400).json({ error: 'Plano financeiro inativo ou plano de mensalidade inativo' });
            return res.status(201).json({ id });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async editar(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: 'Mensalidade invalida' });

            const dados = {
                mes_referencia: this.parsePositiveInt(req.body.mes_referencia),
                ano_referencia: this.parsePositiveInt(req.body.ano_referencia),
                valor_base: Number(req.body.valor_base),
                valor_final: Number(req.body.valor_final),
                multa: Number(req.body.multa || 0),
                status: req.body.status ? String(req.body.status).toUpperCase() : '',
                data_vencimento: req.body.data_vencimento,
            };

            const erroMesAno = this.validarMesAno(dados.mes_referencia, dados.ano_referencia);
            if (erroMesAno) return res.status(400).json({ error: erroMesAno });
            if (!Number.isFinite(dados.valor_base) || dados.valor_base < 0) return res.status(400).json({ error: 'Valor base invalido' });
            if (!Number.isFinite(dados.valor_final) || dados.valor_final < 0) return res.status(400).json({ error: 'Valor final invalido' });
            if (!Number.isFinite(dados.multa) || dados.multa < 0) return res.status(400).json({ error: 'Multa invalida' });
            if (!['PENDENTE', 'ATRASADA', 'ATRASADA_COM_MULTA', 'PAGA', 'CANCELADA'].includes(dados.status)) return res.status(400).json({ error: 'Status invalido' });
            if (!dados.data_vencimento) return res.status(400).json({ error: 'Data de vencimento obrigatoria' });

            const atualizado = await this.mensalidadeRepository.editarMensalidade(id, dados);
            if (!atualizado) return res.status(404).json({ error: 'Mensalidade nao encontrada' });
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async marcarComoPaga(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: 'Mensalidade invalida' });

            const valorPago = Number(req.body.valor_pago);
            if (!Number.isFinite(valorPago) || valorPago < 0) return res.status(400).json({ error: 'Valor pago invalido' });

            const pago = await this.mensalidadeRepository.marcarComoPaga(id, {
                valor_pago: valorPago,
                forma_pagamento: req.body.forma_pagamento,
                data_pagamento: req.body.data_pagamento,
            });
            if (!pago) return res.status(404).json({ error: 'Mensalidade nao encontrada ou ja encerrada' });
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async atualizarAtrasos(req, res) {
        try {
            const atualizado = await this.mensalidadeRepository.atualizarAtrasos();
            return res.json({ success: true, atualizado });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async aplicarMultas(req, res) {
        try {
            const atualizado = await this.mensalidadeRepository.aplicarMultas();
            return res.json({ success: true, atualizado });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async obterConfiguracaoMulta(req, res) {
        try {
            const config = await this.mensalidadeRepository.obterConfiguracaoMulta();
            return res.json(config);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async alterarConfiguracaoMulta(req, res) {
        try {
            const valorMulta = Number(req.body.valor_multa_mensalidade);
            if (!Number.isFinite(valorMulta) || valorMulta < 0) {
                return res.status(400).json({ error: 'Valor da multa nao pode ser negativo' });
            }

            const config = await this.mensalidadeRepository.alterarConfiguracaoMulta(valorMulta);
            return res.json(config);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    parsePositiveInt(value) {
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }

    validarMesAno(mesReferencia, anoReferencia) {
        if (!Number.isInteger(mesReferencia) || mesReferencia < 1 || mesReferencia > 12) {
            return 'Mes de referencia invalido';
        }
        if (!Number.isInteger(anoReferencia) || anoReferencia < 2000 || anoReferencia > 2100) {
            return 'Ano de referencia invalido';
        }
        return null;
    }
}
