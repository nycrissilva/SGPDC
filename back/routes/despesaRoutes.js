import express from 'express';
import DespesaController from '../controllers/DespesaController.js';
import { requireFuncionario } from '../middleware/authMiddleware.js';

const router = express.Router();
const despesaController = new DespesaController();

router.get('/tipos', requireFuncionario, (req, res) => despesaController.listarTipos(req, res));
router.post('/tipos', requireFuncionario, (req, res) => despesaController.cadastrarTipo(req, res));
router.get('/', requireFuncionario, (req, res) => despesaController.listar(req, res));
router.post('/', requireFuncionario, (req, res) => despesaController.cadastrar(req, res));
router.get('/:id', requireFuncionario, (req, res) => despesaController.obter(req, res));
router.put('/:id', requireFuncionario, (req, res) => despesaController.editar(req, res));
router.post('/parcelas/:parcelaId/quitar', requireFuncionario, (req, res) => despesaController.quitarParcela(req, res));

export default router;
