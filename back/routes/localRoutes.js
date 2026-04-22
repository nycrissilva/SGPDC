import express from 'express';
import LocalController from '../controllers/LocalController.js';
import { requireFuncionario } from '../middleware/authMiddleware.js';

const router = express.Router();
const localController = new LocalController();

router.get('/', requireFuncionario, (req, res) => localController.listar(req, res));
router.get('/:id', requireFuncionario, (req, res) => localController.obter(req, res));
router.post('/', requireFuncionario, (req, res) => localController.cadastrar(req, res));
router.put('/:id', requireFuncionario, (req, res) => localController.alterar(req, res));
router.delete('/:id', requireFuncionario, (req, res) => localController.inativar(req, res));

export default router;
