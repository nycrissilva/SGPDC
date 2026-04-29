import express from 'express';
import PlanoMensalidadeController from '../controllers/PlanoMensalidadeController.js';
import { requireFuncionario } from '../middleware/authMiddleware.js';

const router = express.Router();
const planoMensalidadeController = new PlanoMensalidadeController();

router.get('/', requireFuncionario, (req, res) => planoMensalidadeController.listar(req, res));
router.get('/:id', requireFuncionario, (req, res) => planoMensalidadeController.obter(req, res));
router.post('/', requireFuncionario, (req, res) => planoMensalidadeController.cadastrar(req, res));
router.put('/:id', requireFuncionario, (req, res) => planoMensalidadeController.alterar(req, res));
router.delete('/:id', requireFuncionario, (req, res) => planoMensalidadeController.inativar(req, res));

export default router;
