import TurmaRepository from "../repositories/TurmaRepository.js";
import TurmaEntity from "../entities/turmaEntity.js";
import ModalidadeRepository from "../repositories/ModalidadeRepository.js";
import LocalRepository from "../repositories/LocalRepository.js";

export default class TurmaController {
    constructor() {
        this.turmaRepository = new TurmaRepository();
        this.modalidadeRepository = new ModalidadeRepository();
        this.localRepository = new LocalRepository();
    }

    async listar(req, res) {
        try {
            const { nivel, modalidade, professorId, sort } = req.query;
            const filters = {
                nivel: nivel ? String(nivel) : undefined,
                modalidade: modalidade ? String(modalidade) : undefined,
                professorId: professorId ? Number(professorId) : undefined,
                sort: sort ? String(sort) : undefined,
            };
            const lista = await this.turmaRepository.listar(filters);
            return res.json(lista);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async obter(req, res) {
        try {
            const id = Number(req.params.id);
            const turma = await this.turmaRepository.obter(id);
            if (!turma) {
                return res.status(404).json({ error: "Turma não encontrada" });
            }
            return res.json(turma);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrar(req, res) {
        try {
            const payload = this.normalizarPayload(req.body);
            const erro = this.validarCamposObrigatorios(payload);
            if (erro) {
                return res.status(400).json({ error: erro });
            }

            const validacaoRelacionamentos = await this.validarRelacionamentos(payload);
            if (validacaoRelacionamentos) {
                return res.status(validacaoRelacionamentos.status).json({ error: validacaoRelacionamentos.error });
            }

            const validacaoAgenda = await this.validarAgenda(payload, null);
            if (validacaoAgenda) {
                return res.status(400).json({ error: validacaoAgenda });
            }

            const turma = new TurmaEntity(
                null,
                payload.nome,
                payload.modalidade_nome,
                payload.modalidade_id,
                payload.nivel,
                null,
                payload.status || "ATIVA",
                payload.dia_semana,
                payload.horario_inicio,
                payload.horario_fim,
                payload.local_id,
                null
            );

            const id = await this.turmaRepository.cadastrar(turma, payload.professor_ids);
            if (!id) {
                return res.status(500).json({ error: "Erro ao cadastrar turma" });
            }

            return res.status(201).json({ id });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async alterar(req, res) {
        try {
            const id = Number(req.params.id);
            const turmaExistente = await this.turmaRepository.obter(id);
            if (!turmaExistente) {
                return res.status(404).json({ error: "Turma não encontrada" });
            }

            const payload = this.normalizarPayload(req.body);
            const erro = this.validarCamposObrigatorios(payload);
            if (erro) {
                return res.status(400).json({ error: erro });
            }

            const validacaoRelacionamentos = await this.validarRelacionamentos(payload, turmaExistente);
            if (validacaoRelacionamentos) {
                return res.status(validacaoRelacionamentos.status).json({ error: validacaoRelacionamentos.error });
            }

            const validacaoAgenda = await this.validarAgenda(payload, id);
            if (validacaoAgenda) {
                return res.status(400).json({ error: validacaoAgenda });
            }

            const turma = new TurmaEntity(
                id,
                payload.nome,
                payload.modalidade_nome,
                payload.modalidade_id,
                payload.nivel,
                null,
                payload.status || turmaExistente.status,
                payload.dia_semana,
                payload.horario_inicio,
                payload.horario_fim,
                payload.local_id,
                turmaExistente.local_nome
            );

            const alterado = await this.turmaRepository.alterar(turma, payload.professor_ids);
            if (!alterado) {
                return res.status(500).json({ error: "Erro ao atualizar turma" });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async inativar(req, res) {
        try {
            const id = Number(req.params.id);
            const turmaExistente = await this.turmaRepository.obter(id);
            if (!turmaExistente) {
                return res.status(404).json({ error: "Turma não encontrada" });
            }

            const inativado = await this.turmaRepository.inativar(id);
            if (!inativado) {
                return res.status(500).json({ error: "Erro ao inativar turma" });
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    normalizarPayload(body = {}) {
        const modalidadeId = Number(body.modalidade_id || body.modalidadeId);
        const localId = Number(body.local_id || body.localId);
        const professorIds = Array.isArray(body.professor_ids)
            ? body.professor_ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
            : [];

        return {
            nome: String(body.nome || '').trim(),
            modalidade_id: Number.isInteger(modalidadeId) && modalidadeId > 0 ? modalidadeId : null,
            local_id: Number.isInteger(localId) && localId > 0 ? localId : null,
            nivel: String(body.nivel || '').trim(),
            dia_semana: String(body.dia_semana || '').trim(),
            horario_inicio: String(body.horario_inicio || '').trim(),
            horario_fim: String(body.horario_fim || '').trim(),
            professor_ids: professorIds,
            status: body.status || 'ATIVA',
        };
    }

    validarCamposObrigatorios(payload) {
        if (!payload.nome || !payload.modalidade_id || !payload.local_id || !payload.nivel || !payload.dia_semana || !payload.horario_inicio || !payload.horario_fim) {
            return "Campos obrigatórios faltando";
        }

        if (!Array.isArray(payload.professor_ids) || payload.professor_ids.length === 0) {
            return "Selecione ao menos um professor para a turma";
        }

        return null;
    }

    async validarRelacionamentos(payload, turmaExistente = null) {
        const modalidade = await this.modalidadeRepository.obter(payload.modalidade_id);
        if (!modalidade) {
            return { status: 400, error: 'Modalidade informada não foi encontrada' };
        }

        const podeManterModalidadeAtual = turmaExistente && turmaExistente.modalidade_id === payload.modalidade_id;
        if (modalidade.status !== 'ATIVA' && !podeManterModalidadeAtual) {
            return { status: 400, error: 'Modalidades inativas não podem ser vinculadas a novas turmas' };
        }

        const local = await this.localRepository.obter(payload.local_id);
        if (!local) {
            return { status: 400, error: 'Local informado não foi encontrado' };
        }

        const podeManterLocalAtual = turmaExistente && turmaExistente.local_id === payload.local_id;
        if (local.status !== 'ATIVO' && !podeManterLocalAtual) {
            return { status: 400, error: 'Locais inativos não podem ser vinculados a novas turmas' };
        }

        payload.modalidade_nome = modalidade.nome;
        payload.local_nome = local.nome;
        return null;
    }

    async validarAgenda(payload, turmaId = null) {
        if (payload.horario_inicio >= payload.horario_fim) {
            return "Horário de início deve ser anterior ao horário de fim";
        }

        for (const professorId of payload.professor_ids) {
            const conflitoProfessor = await this.turmaRepository.existeConflito(
                professorId,
                payload.dia_semana,
                payload.horario_inicio,
                payload.horario_fim,
                turmaId
            );

            if (conflitoProfessor) {
                return `Conflito de horário para o professor ID ${professorId}`;
            }
        }

        const conflitoLocal = await this.turmaRepository.existeConflitoLocal(
            payload.local_id,
            payload.dia_semana,
            payload.horario_inicio,
            payload.horario_fim,
            turmaId
        );

        if (conflitoLocal) {
            return "Já existe outra turma cadastrada neste local para o mesmo dia e horário";
        }

        return null;
    }
}
