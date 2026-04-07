import express from 'express';
import FuncionarioController from '../controllers/FuncionarioController.js';

const router = express.Router();
const funcionarioController = new FuncionarioController();

router.get('/', (req, res) => funcionarioController.listar(req, res));
router.get('/:id', (req, res) => funcionarioController.obter(req, res));
router.post('/', (req, res) => funcionarioController.cadastrar(req, res));
router.put('/:id', (req, res) => funcionarioController.alterar(req, res));
router.delete('/:id', (req, res) => funcionarioController.remover(req, res));

export default router;