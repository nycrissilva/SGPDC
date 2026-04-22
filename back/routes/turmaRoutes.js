import express from 'express';
import TurmaController from '../controllers/TurmaController.js';
import { requireFuncionario } from '../middleware/authMiddleware.js';

const router = express.Router();
const turmaController = new TurmaController();

router.get('/', (req, res) => turmaController.listar(req, res));
router.get('/:id', (req, res) => turmaController.obter(req, res));
router.post('/', requireFuncionario, (req, res) => turmaController.cadastrar(req, res));
router.put('/:id', requireFuncionario, (req, res) => turmaController.alterar(req, res));
router.delete('/:id', requireFuncionario, (req, res) => turmaController.inativar(req, res));

export default router;
