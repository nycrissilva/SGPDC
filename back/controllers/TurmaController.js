import TurmaRepository from "../repositories/TurmaRepository.js";
import TurmaEntity from "../entities/turmaEntity.js";

export default class TurmaController {
    constructor() {
        this.turmaRepository = new TurmaRepository();
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
            const {
                nome,
                modalidade,
                nivel,
                dia_semana,
                horario_inicio,
                horario_fim,
                professor_ids,
                status
            } = req.body;

            if (!nome || !modalidade || !nivel || !dia_semana || !horario_inicio || !horario_fim || !Array.isArray(professor_ids) || professor_ids.length === 0) {
                return res.status(400).json({ error: "Campos obrigatórios faltando ou sem professores vinculados" });
            }

            if (horario_inicio >= horario_fim) {
                return res.status(400).json({ error: "Horário de início deve ser anterior ao horário de fim" });
            }

            for (const professorId of professor_ids) {
                const conflito = await this.turmaRepository.existeConflito(professorId, dia_semana, horario_inicio, horario_fim);
                if (conflito) {
                    return res.status(400).json({ error: `Conflito de horário para o professor ID ${professorId}` });
                }
            }

            const turma = new TurmaEntity(null, nome, modalidade, nivel, null, status || "ATIVA", dia_semana, horario_inicio, horario_fim);
            const id = await this.turmaRepository.cadastrar(turma, professor_ids);
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

            const {
                nome,
                modalidade,
                nivel,
                dia_semana,
                horario_inicio,
                horario_fim,
                professor_ids,
                status
            } = req.body;

            if (!nome || !modalidade || !nivel || !dia_semana || !horario_inicio || !horario_fim || !Array.isArray(professor_ids) || professor_ids.length === 0) {
                return res.status(400).json({ error: "Campos obrigatórios faltando ou sem professores vinculados" });
            }

            if (horario_inicio >= horario_fim) {
                return res.status(400).json({ error: "Horário de início deve ser anterior ao horário de fim" });
            }

            for (const professorId of professor_ids) {
                const conflito = await this.turmaRepository.existeConflito(professorId, dia_semana, horario_inicio, horario_fim, id);
                if (conflito) {
                    return res.status(400).json({ error: `Conflito de horário para o professor ID ${professorId}` });
                }
            }

            const turma = new TurmaEntity(id, nome, modalidade, nivel, null, status || turmaExistente.status, dia_semana, horario_inicio, horario_fim);
            const alterado = await this.turmaRepository.alterar(turma, professor_ids);
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
}
