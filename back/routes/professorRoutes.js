import express from 'express';
import ProfessorController from '../controllers/ProfessorController.js';

const router = express.Router();
const professorController = new ProfessorController();

router.get('/', (req, res) => professorController.listar(req, res));
router.get('/:id', (req, res) => professorController.obter(req, res));
router.post('/', (req, res) => professorController.cadastrar(req, res));
router.put('/:id', (req, res) => professorController.alterar(req, res));
router.delete('/:id', (req, res) => professorController.remover(req, res));

export default router;