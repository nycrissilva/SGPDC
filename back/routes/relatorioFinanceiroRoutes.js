import express from 'express';
import RelatorioFinanceiroController from '../controllers/RelatorioFinanceiroController.js';
import { requireFuncionario } from '../middleware/authMiddleware.js';

const router = express.Router();
const relatorioFinanceiroController = new RelatorioFinanceiroController();

router.get('/receitas-despesas', requireFuncionario, (req, res) => relatorioFinanceiroController.receitasDespesas(req, res));
router.get('/dre', requireFuncionario, (req, res) => relatorioFinanceiroController.dre(req, res));

export default router;
