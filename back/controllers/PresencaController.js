import PresencaRepository from "../repositories/PresencaRepository.js";
import TurmaRepository from "../repositories/TurmaRepository.js";
import PeriodoLetivoRepository from "../repositories/PeriodoLetivoRepository.js";

export default class PresencaController {
    constructor() {
        this.presencaRepository = new PresencaRepository();
        this.turmaRepository = new TurmaRepository();
        this.periodoLetivoRepository = new PeriodoLetivoRepository();
    }

    async listar(req, res) {
        return res.status(403).json({ error: "Registro de presença disponível apenas para professores." });
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

    async listarDatasProfessor(req, res) {
        try {
            const professorId = req.user?.pessoa_id;
            if (!professorId) {
                return res.status(401).json({ error: "Não autenticado" });
            }

            const turmaId = Number(req.query.turmaId);
            if (!turmaId) {
                return res.status(400).json({ error: "Turma é obrigatória" });
            }

            if (!(await this.presencaRepository.turmaPertenceAoProfessor(professorId, turmaId))) {
                return res.status(403).json({ error: "Turma não pertence ao professor autenticado" });
            }

            const turma = await this.turmaRepository.obter(turmaId);
            const periodo = await this.periodoLetivoRepository.obterAtual();
            if (!periodo) {
                return res.json({ periodo: null, datas: [] });
            }

            const datasBase = this.gerarDatasDaTurma(periodo.data_inicio, periodo.data_fim, turma?.dia_semana);
            const chamadas = await this.presencaRepository.listarChamadasPorTurma(
                turmaId,
                periodo.data_inicio,
                periodo.data_fim
            );
            const chamadasMap = new Map(chamadas.map((chamada) => [chamada.data, chamada]));

            const datas = datasBase.map((data) => ({
                data,
                chamada: chamadasMap.get(data) || {
                    turma_id: turmaId,
                    data,
                    finalizada: false,
                    sem_aula: false,
                    motivo_sem_aula: "",
                },
            }));

            return res.json({ periodo, datas });
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
            const chamada = await this.presencaRepository.obterChamada(turmaId, data);
            return res.json({ alunos: lista, chamada });
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

            const { turmaId, data, presencas, semAula, motivoSemAula } = req.body;
            if (!turmaId || !data || !Array.isArray(presencas)) {
                return res.status(400).json({ error: "Turma, data e presenças são obrigatórios" });
            }

            if (!(await this.presencaRepository.turmaPertenceAoProfessor(professorId, turmaId))) {
                return res.status(403).json({ error: "Turma não pertence ao professor autenticado" });
            }

            if (Boolean(semAula) && !String(motivoSemAula || "").trim()) {
                return res.status(400).json({ error: "Informe o motivo quando marcar que não teve aula" });
            }

            if (!Boolean(semAula)) {
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
            }

            await this.presencaRepository.salvarChamada({
                turmaId: Number(turmaId),
                data: String(data),
                finalizada: true,
                semAula: Boolean(semAula),
                motivoSemAula: String(motivoSemAula || "").trim(),
            });

            const chamada = await this.presencaRepository.obterChamada(Number(turmaId), String(data));
            return res.json({ success: true, chamada });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async cadastrar(req, res) {
        return res.status(403).json({ error: "Registro de presença disponível apenas para professores." });
    }

    async listarRelatorio(req, res) {
        try {
            const turmaId = req.query.turmaId ? Number(req.query.turmaId) : null;
            const alunoId = req.query.alunoId ? Number(req.query.alunoId) : null;
            const dataInicial = req.query.dataInicial ? String(req.query.dataInicial) : "";
            const dataFinal = req.query.dataFinal ? String(req.query.dataFinal) : "";

            if (!dataInicial || !dataFinal) {
                return res.status(400).json({ error: "Período obrigatório. Informe data inicial e final." });
            }

            if (dataInicial > dataFinal) {
                return res.status(400).json({ error: "A data inicial não pode ser maior que a data final." });
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

    gerarDatasDaTurma(dataInicial, dataFinal, diaSemana) {
        const alvo = this.diaSemanaParaNumero(diaSemana);
        if (alvo === null) return [];

        const [anoInicio, mesInicio, diaInicio] = dataInicial.split("-").map(Number);
        const [anoFim, mesFim, diaFim] = dataFinal.split("-").map(Number);
        const atual = new Date(Date.UTC(anoInicio, mesInicio - 1, diaInicio));
        const fim = new Date(Date.UTC(anoFim, mesFim - 1, diaFim));
        const datas = [];

        while (atual <= fim) {
            if (atual.getUTCDay() === alvo) {
                datas.push(atual.toISOString().split("T")[0]);
            }
            atual.setUTCDate(atual.getUTCDate() + 1);
        }

        return datas;
    }

    diaSemanaParaNumero(diaSemana = "") {
        const normalizado = String(diaSemana)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        if (normalizado.includes("domingo")) return 0;
        if (normalizado.includes("segunda")) return 1;
        if (normalizado.includes("terca")) return 2;
        if (normalizado.includes("quarta")) return 3;
        if (normalizado.includes("quinta")) return 4;
        if (normalizado.includes("sexta")) return 5;
        if (normalizado.includes("sabado")) return 6;
        return null;
    }
}
