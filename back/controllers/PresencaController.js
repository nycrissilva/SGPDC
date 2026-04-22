import PresencaRepository from "../repositories/PresencaRepository.js";
import TurmaRepository from "../repositories/TurmaRepository.js";

export default class PresencaController {
    constructor() {
        this.presencaRepository = new PresencaRepository();
        this.turmaRepository = new TurmaRepository();
    }

    async listar(req, res) {
        return res.status(403).json({ error: "Registro de presenÃ§a disponÃ­vel apenas para professores." });
    }

    async listarTurmasProfessor(req, res) {
        try {
            const professorId = req.user?.pessoa_id;
            if (!professorId) {
                return res.status(401).json({ error: "NÃ£o autenticado" });
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
                return res.status(401).json({ error: "NÃ£o autenticado" });
            }

            const turmaId = Number(req.query.turmaId);
            const data = req.query.data ? String(req.query.data) : new Date().toISOString().split("T")[0];

            if (!turmaId) {
                return res.status(400).json({ error: "Turma Ã© obrigatÃ³ria" });
            }

            if (!(await this.presencaRepository.turmaPertenceAoProfessor(professorId, turmaId))) {
                return res.status(403).json({ error: "Turma nÃ£o pertence ao professor autenticado" });
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
                return res.status(401).json({ error: "NÃ£o autenticado" });
            }

            const { turmaId, data, presencas } = req.body;
            if (!turmaId || !data || !Array.isArray(presencas)) {
                return res.status(400).json({ error: "Turma, data e presenÃ§as sÃ£o obrigatÃ³rios" });
            }

            if (!(await this.presencaRepository.turmaPertenceAoProfessor(professorId, turmaId))) {
                return res.status(403).json({ error: "Turma nÃ£o pertence ao professor autenticado" });
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
        return res.status(403).json({ error: "Registro de presenÃ§a disponÃ­vel apenas para professores." });
    }

    async listarRelatorio(req, res) {
        try {
            const turmaId = req.query.turmaId ? Number(req.query.turmaId) : null;
            const alunoId = req.query.alunoId ? Number(req.query.alunoId) : null;
            const dataInicial = req.query.dataInicial ? String(req.query.dataInicial) : "";
            const dataFinal = req.query.dataFinal ? String(req.query.dataFinal) : "";

            if (!dataInicial || !dataFinal) {
                return res.status(400).json({ error: "PerÃ­odo obrigatÃ³rio. Informe data inicial e final." });
            }

            if (dataInicial > dataFinal) {
                return res.status(400).json({ error: "A data inicial nÃ£o pode ser maior que a data final." });
            }

            const registros = await this.presencaRepository.listarRelatorio({
                turmaId,
                alunoId,
                dataInicial,
                dataFinal,
            });

            if (registros.length === 0) {
                return res.json({
                    registros: [],
                    resumo: [],
                    message: "Nenhum registro encontrado",
                });
            }

            const resumoMap = new Map();

            for (const registro of registros) {
                const resumoAtual = resumoMap.get(registro.aluno_id) || {
                    aluno_id: registro.aluno_id,
                    aluno_nome: registro.aluno_nome,
                    total_aulas: 0,
                    total_presencas: 0,
                    total_ausencias: 0,
                    percentual_presenca: 0,
                };

                resumoAtual.total_aulas += 1;
                if (registro.presente) {
                    resumoAtual.total_presencas += 1;
                } else {
                    resumoAtual.total_ausencias += 1;
                }

                resumoMap.set(registro.aluno_id, resumoAtual);
            }

            const resumo = Array.from(resumoMap.values())
                .map((item) => ({
                    ...item,
                    percentual_presenca: item.total_aulas > 0
                        ? Number(((item.total_presencas / item.total_aulas) * 100).toFixed(2))
                        : 0,
                }))
                .sort((a, b) => a.aluno_nome.localeCompare(b.aluno_nome));

            return res.json({ registros, resumo });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
