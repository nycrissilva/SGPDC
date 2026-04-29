import express from 'express';
import PlanoFinanceiroController from '../controllers/PlanoFinanceiroController.js';
import { requireFuncionario } from '../middleware/authMiddleware.js';

const router = express.Router();
const planoFinanceiroController = new PlanoFinanceiroController();

router.get('/responsavel/:responsavelId/ativos', requireFuncionario, (req, res) => planoFinanceiroController.listarAtivosPorResponsavel(req, res));
router.get('/aluno/:alunoId/ativo', requireFuncionario, (req, res) => planoFinanceiroController.alunoPossuiAtivo(req, res));

export default router;
