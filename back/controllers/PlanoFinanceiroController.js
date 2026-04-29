import PlanoFinanceiroRepository from "../repositories/PlanoFinanceiroRepository.js";

export default class PlanoFinanceiroController {
    constructor() {
        this.planoFinanceiroRepository = new PlanoFinanceiroRepository();
    }

    async listarAtivosPorResponsavel(req, res) {
        try {
            const responsavelId = Number(req.params.responsavelId);
            if (!Number.isInteger(responsavelId) || responsavelId <= 0) {
                return res.status(400).json({ error: 'Responsavel financeiro invalido' });
            }

            const grupos = await this.planoFinanceiroRepository.listarAtivosPorResponsavel(responsavelId);
            return res.json(grupos);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async alunoPossuiAtivo(req, res) {
        try {
            const alunoId = Number(req.params.alunoId);
            if (!Number.isInteger(alunoId) || alunoId <= 0) {
                return res.status(400).json({ error: 'Aluno invalido' });
            }

            const grupo = await this.planoFinanceiroRepository.alunoPossuiPlanoFinanceiroAtivo(alunoId);
            return res.json({ possuiPlanoFinanceiroAtivo: Boolean(grupo), grupo_financeiro_id: grupo?.id || null });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
