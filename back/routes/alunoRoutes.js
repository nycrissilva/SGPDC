import express from 'express';
import AlunoController from '../controllers/AlunoController.js';

const router = express.Router();
const alunoController = new AlunoController();

router.get('/', (req, res) => alunoController.listar(req, res));
router.get('/:id', (req, res) => alunoController.obter(req, res));
router.post('/', (req, res) => alunoController.cadastrar(req, res));
router.put('/:id', (req, res) => alunoController.alterar(req, res));
router.delete('/:id', (req, res) => alunoController.remover(req, res));

export default router;