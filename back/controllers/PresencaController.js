import PresencaRepository from "../repositories/PresencaRepository.js";
import TurmaRepository from "../repositories/TurmaRepository.js";

export default class PresencaController {
    constructor() {
        this.presencaRepository = new PresencaRepository();
        this.turmaRepository = new TurmaRepository();
    }

    async listar(req, res) {
        try {
            const turmaId = Number(req.query.turmaId);
            const data = req.query.data ? String(req.query.data) : new Date().toISOString().split("T")[0];

            if (!turmaId) {
                return res.status(400).json({ error: "Turma é obrigatória" });
            }

            const lista = await this.presencaRepository.listarPorTurmaData(turmaId, data);
            return res.json(lista);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async listarTurmasProfessor(req, res) {
        try {
            const professorId = req.user?.pessoa_id;
            if (!professorId) {
                return res.status(401).json({ error: "Não autenticado" });
            }

            const turmas = await this.turmaRepository.listarPorProfessor(professorId);
            return res.json(turmas);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async listarProfessor(req, res) {
        try {
            const professorId = req.user?.pessoa_id;
            if (!professorId) {
                return res.status(401).json({ error: "Não autenticado" });
            }

            const turmaId = Number(req.query.turmaId);
            const data = req.query.data ? String(req.query.data) : new Date().toISOString().split("T")[0];

            if (!turmaId) {
                return res.status(400).json({ error: "Turma é obrigatória" });
            }

            if (!(await this.presencaRepository.turmaPertenceAoProfessor(professorId, turmaId))) {
                return res.status(403).json({ error: "Turma não pertence ao professor autenticado" });
            }

            const lista = await this.presencaRepository.listarPorProfessorTurmaData(professorId, turmaId, data);
            return res.json(lista);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrarProfessor(req, res) {
        try {
            const professorId = req.user?.pessoa_id;
            if (!professorId) {
                return res.status(401).json({ error: "Não autenticado" });
            }

            const { turmaId, data, presencas } = req.body;
            if (!turmaId || !data || !Array.isArray(presencas)) {
                return res.status(400).json({ error: "Turma, data e presenças são obrigatórios" });
            }

            if (!(await this.presencaRepository.turmaPertenceAoProfessor(professorId, turmaId))) {
                return res.status(403).json({ error: "Turma não pertence ao professor autenticado" });
            }

            const lista = await this.presencaRepository.listarPorProfessorTurmaData(professorId, turmaId, data);
            const validIds = new Set(lista.map((item) => item.matricula_turma_id));

            for (const presenca of presencas) {
                if (!validIds.has(Number(presenca.matricula_turma_id))) {
                    continue;
                }

                await this.presencaRepository.salvar(
                    Number(presenca.matricula_turma_id),
                    String(data),
                    Boolean(presenca.presente)
                );
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrar(req, res) {
        try {
            const { turmaId, data, presencas } = req.body;
            if (!turmaId || !data || !Array.isArray(presencas)) {
                return res.status(400).json({ error: "Turma, data e presenças são obrigatórios" });
            }

            const lista = await this.presencaRepository.listarPorTurmaData(turmaId, data);
            const validIds = new Set(lista.map((item) => item.matricula_turma_id));

            for (const presenca of presencas) {
                if (!validIds.has(Number(presenca.matricula_turma_id))) {
                    continue;
                }

                await this.presencaRepository.salvar(
                    Number(presenca.matricula_turma_id),
                    String(data),
                    Boolean(presenca.presente)
                );
            }

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
