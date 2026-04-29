import express from "express";
import PeriodoLetivoController from "../controllers/PeriodoLetivoController.js";
import { requireFuncionario } from "../middleware/authMiddleware.js";

const router = express.Router();
const periodoLetivoController = new PeriodoLetivoController();

router.get("/", requireFuncionario, (req, res) => periodoLetivoController.listar(req, res));
router.get("/atual", (req, res) => periodoLetivoController.obterAtual(req, res));
router.post("/", requireFuncionario, (req, res) => periodoLetivoController.salvar(req, res));

export default router;
