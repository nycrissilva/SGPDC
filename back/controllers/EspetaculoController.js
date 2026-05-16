import EspetaculoRepository from "../repositories/EspetaculoRepository.js";

export default class EspetaculoController {
    constructor() {
        this.repository = new EspetaculoRepository();
    }

    async listarEspetaculos(req, res) {
        try {
            const incluirInativos = String(req.query.incluir_inativos || 'true').toLowerCase() === 'true';
            const espetaculos = await this.repository.listarEspetaculos({ incluirInativos });
            return res.json(espetaculos);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async obterEspetaculo(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: "Espetaculo invalido" });
            const espetaculo = await this.repository.obterEspetaculo(id);
            if (!espetaculo) return res.status(404).json({ error: "Espetaculo nao encontrado" });
            return res.json(espetaculo);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrarEspetaculo(req, res) {
        try {
            const dados = this.parseEspetaculo(req.body);
            dados.status = 'ATIVO';
            const erro = this.validarEspetaculo(dados);
            if (erro) return res.status(400).json({ error: erro });
            const id = await this.repository.cadastrarEspetaculo(dados);
            return res.status(201).json({ id });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async editarEspetaculo(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: "Espetaculo invalido" });
            const dados = this.parseEspetaculo(req.body);
            const erro = this.validarEspetaculo(dados);
            if (erro) return res.status(400).json({ error: erro });
            const atualizado = await this.repository.editarEspetaculo(id, dados);
            if (!atualizado) return res.status(404).json({ error: "Espetaculo nao encontrado" });
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async inativarEspetaculo(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: "Espetaculo invalido" });

            const confirmar = String(req.body?.confirmar_cobrancas_pendentes || req.query.confirmar_cobrancas_pendentes || '').toLowerCase() === 'true';
            const possuiPendencia = await this.repository.possuiFantasiaPendenteEspetaculo(id);
            if (possuiPendencia && !confirmar) {
                return res.status(409).json({ error: "Existem cobrancas de fantasia pendentes. Confirme explicitamente para inativar.", requer_confirmacao: true });
            }

            const inativado = await this.repository.inativarEspetaculo(id);
            if (!inativado) return res.status(404).json({ error: "Espetaculo nao encontrado" });
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async listarCoreografias(req, res) {
        try {
            const filtros = {
                espetaculo_id: this.parsePositiveInt(req.query.espetaculo_id || req.params.id),
                incluirInativas: String(req.query.incluir_inativas || 'true').toLowerCase() === 'true',
            };
            const coreografias = await this.repository.listarCoreografias(filtros);
            return res.json(coreografias);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async obterCoreografia(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: "Coreografia invalida" });
            const coreografia = await this.repository.obterCoreografia(id, {
                espetaculo_id: this.parsePositiveInt(req.query.espetaculo_id),
                espetaculo_coreografia_id: this.parsePositiveInt(req.query.espetaculo_coreografia_id),
            });
            if (!coreografia) return res.status(404).json({ error: "Coreografia nao encontrada" });
            return res.json(coreografia);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrarCoreografia(req, res) {
        try {
            const dados = this.parseCoreografia(req.body);
            dados.status = 'ATIVO';
            const erro = this.validarCoreografia(dados);
            if (erro) return res.status(400).json({ error: erro });
            const id = await this.repository.cadastrarCoreografia(dados);
            return res.status(201).json({ id });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async editarCoreografia(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: "Coreografia invalida" });
            const dados = this.parseCoreografia(req.body);
            const erro = this.validarCoreografia(dados);
            if (erro) return res.status(400).json({ error: erro });
            const atualizado = await this.repository.editarCoreografia(id, dados);
            if (!atualizado) return res.status(404).json({ error: "Coreografia nao encontrada" });
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async inativarCoreografia(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.id);
            if (!id) return res.status(400).json({ error: "Coreografia invalida" });
            const inativada = await this.repository.inativarCoreografia(id);
            if (!inativada) return res.status(404).json({ error: "Coreografia nao encontrada" });
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async salvarPapel(req, res) {
        try {
            const coreografiaId = this.parsePositiveInt(req.params.id);
            if (!coreografiaId) return res.status(400).json({ error: "Coreografia invalida" });
            const dados = this.parsePapel(req.body);
            const erro = this.validarPapel(dados);
            if (erro) return res.status(400).json({ error: erro });
            const id = await this.repository.salvarPapel(coreografiaId, dados);
            return res.status(dados.id ? 200 : 201).json({ id });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async inativarPapel(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.papelId);
            if (!id) return res.status(400).json({ error: "Papel invalido" });
            const inativado = await this.repository.inativarPapel(id);
            if (!inativado) return res.status(404).json({ error: "Papel nao encontrado" });
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async salvarParticipante(req, res) {
        try {
            const coreografiaId = this.parsePositiveInt(req.params.id);
            if (!coreografiaId) return res.status(400).json({ error: "Coreografia invalida" });
            const dados = this.parseParticipante(req.body);
            const erro = this.validarParticipante(dados);
            if (erro) return res.status(400).json({ error: erro });
            const id = await this.repository.salvarParticipante(coreografiaId, dados);
            return res.status(dados.id ? 200 : 201).json({ id });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async inativarParticipante(req, res) {
        try {
            const id = this.parsePositiveInt(req.params.participanteId);
            if (!id) return res.status(400).json({ error: "Participante invalido" });
            const inativado = await this.repository.inativarParticipante(id);
            if (!inativado) return res.status(404).json({ error: "Participante nao encontrado" });
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async gerarCobrancasFantasia(req, res) {
        try {
            const coreografiaId = this.parsePositiveInt(req.params.id);
            if (!coreografiaId) return res.status(400).json({ error: "Coreografia invalida" });
            const dataVencimento = req.body.data_vencimento;
            if (!dataVencimento || !/^\d{4}-\d{2}-\d{2}$/.test(String(dataVencimento))) {
                return res.status(400).json({ error: "Data de vencimento invalida" });
            }
            const quantidadeParcelas = Number(req.body.quantidade_parcelas || 1);
            if (!Number.isInteger(quantidadeParcelas) || quantidadeParcelas < 1 || quantidadeParcelas > 24) {
                return res.status(400).json({ error: "Quantidade de parcelas invalida" });
            }
            const participacaoIds = Array.isArray(req.body.participacao_ids)
                ? req.body.participacao_ids.map((id) => this.parsePositiveInt(id)).filter(Boolean)
                : [];
            const resultado = await this.repository.gerarCobrancasFantasia(coreografiaId, {
                data_vencimento: dataVencimento,
                participacao_ids: participacaoIds,
                espetaculo_id: this.parsePositiveInt(req.body.espetaculo_id),
                espetaculo_coreografia_id: this.parsePositiveInt(req.body.espetaculo_coreografia_id),
                quantidade_parcelas: quantidadeParcelas,
            });
            return res.status(201).json(resultado);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    parseEspetaculo(body) {
        return {
            nome: String(body.nome || '').trim(),
            data: body.data || null,
            descricao: body.descricao ? String(body.descricao).trim() : null,
            status: body.status ? String(body.status).toUpperCase() : 'ATIVO',
        };
    }

    validarEspetaculo(dados) {
        if (!dados.nome) return "Nome do espetaculo e obrigatorio";
        if (!['ATIVO', 'INATIVO'].includes(dados.status)) return "Status invalido";
        return null;
    }

    parseCoreografia(body) {
        const valorGeral = body.valor_fantasia_geral === '' || body.valor_fantasia_geral === undefined || body.valor_fantasia_geral === null
            ? null
            : Number(body.valor_fantasia_geral);
        return {
            espetaculo_id: this.parsePositiveInt(body.espetaculo_id || body.evento_id),
            espetaculo_ids: Array.isArray(body.espetaculo_ids)
                ? body.espetaculo_ids.map((id) => this.parsePositiveInt(id)).filter(Boolean)
                : [],
            nome: String(body.nome || '').trim(),
            tipo: body.tipo ? String(body.tipo).trim() : null,
            descricao: body.descricao ? String(body.descricao).trim() : null,
            status: body.status ? String(body.status).toUpperCase() : 'ATIVO',
            valor_fantasia_geral: valorGeral,
        };
    }

    validarCoreografia(dados) {
        if (!dados.espetaculo_id && (!Array.isArray(dados.espetaculo_ids) || dados.espetaculo_ids.length === 0)) return "Ao menos um espetaculo vinculado e obrigatorio";
        if (!dados.nome) return "Nome da coreografia e obrigatorio";
        if (!['ATIVO', 'INATIVO'].includes(dados.status)) return "Status invalido";
        if (dados.valor_fantasia_geral !== null && (!Number.isFinite(dados.valor_fantasia_geral) || dados.valor_fantasia_geral < 0)) return "Valor geral invalido";
        return null;
    }

    parsePapel(body) {
        return {
            id: this.parsePositiveInt(body.id),
            nome: String(body.nome || '').trim(),
            valor_fantasia: Number(body.valor_fantasia),
            status: body.status ? String(body.status).toUpperCase() : 'ATIVO',
        };
    }

    validarPapel(dados) {
        if (!dados.nome) return "Nome do papel e obrigatorio";
        if (!Number.isFinite(dados.valor_fantasia) || dados.valor_fantasia < 0) return "Valor da fantasia invalido";
        if (!['ATIVO', 'INATIVO'].includes(dados.status)) return "Status invalido";
        return null;
    }

    parseParticipante(body) {
        const valor = body.valor_fantasia === '' || body.valor_fantasia === undefined || body.valor_fantasia === null
            ? null
            : Number(body.valor_fantasia);
        return {
            id: this.parsePositiveInt(body.id),
            aluno_id: this.parsePositiveInt(body.aluno_id),
            papel_id: this.parsePositiveInt(body.papel_id),
            valor_fantasia: valor,
            status: body.status ? String(body.status).toUpperCase() : 'ATIVO',
        };
    }

    validarParticipante(dados) {
        if (!dados.aluno_id) return "Aluno obrigatorio";
        if (!dados.papel_id) return "Papel obrigatorio";
        if (dados.valor_fantasia !== null && (!Number.isFinite(dados.valor_fantasia) || dados.valor_fantasia < 0)) return "Valor individual invalido";
        if (!['ATIVO', 'INATIVO'].includes(dados.status)) return "Status invalido";
        return null;
    }

    parsePositiveInt(value) {
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }
}
