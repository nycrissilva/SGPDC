import PeriodoLetivoRepository from "../repositories/PeriodoLetivoRepository.js";

export default class PeriodoLetivoController {
    constructor() {
        this.periodoLetivoRepository = new PeriodoLetivoRepository();
    }

    async listar(req, res) {
        try {
            const periodos = await this.periodoLetivoRepository.listar();
            return res.json(periodos);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async obterAtual(req, res) {
        try {
            const periodo = await this.periodoLetivoRepository.obterAtual();
            return res.json(periodo);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async salvar(req, res) {
        try {
            const payload = {
                id: req.body.id ? Number(req.body.id) : null,
                nome: String(req.body.nome || "").trim(),
                data_inicio: String(req.body.data_inicio || "").trim(),
                data_fim: String(req.body.data_fim || "").trim(),
            };

            if (!payload.nome || !payload.data_inicio || !payload.data_fim) {
                return res.status(400).json({ error: "Nome, data inicial e data final são obrigatórios" });
            }

            if (payload.data_inicio > payload.data_fim) {
                return res.status(400).json({ error: "A data inicial não pode ser maior que a data final" });
            }

            const id = await this.periodoLetivoRepository.salvar(payload);
            return res.json({ id, success: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
