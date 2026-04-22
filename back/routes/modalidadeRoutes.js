import express from 'express';
import ModalidadeController from '../controllers/ModalidadeController.js';
import { requireFuncionario } from '../middleware/authMiddleware.js';

const router = express.Router();
const modalidadeController = new ModalidadeController();

router.get('/', requireFuncionario, (req, res) => modalidadeController.listar(req, res));
router.get('/:id', requireFuncionario, (req, res) => modalidadeController.obter(req, res));
router.post('/', requireFuncionario, (req, res) => modalidadeController.cadastrar(req, res));
router.put('/:id', requireFuncionario, (req, res) => modalidadeController.alterar(req, res));
router.delete('/:id', requireFuncionario, (req, res) => modalidadeController.inativar(req, res));

export default router;
