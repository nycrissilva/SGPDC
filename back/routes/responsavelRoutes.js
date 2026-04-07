import express from 'express';
import ResponsavelController from '../controllers/ResponsavelController.js';

const router = express.Router();
const responsavelController = new ResponsavelController();

router.get('/', (req, res) => responsavelController.listar(req, res));
router.get('/:id', (req, res) => responsavelController.obter(req, res));
router.post('/', (req, res) => responsavelController.cadastrar(req, res));
router.put('/:id', (req, res) => responsavelController.alterar(req, res));
router.delete('/:id', (req, res) => responsavelController.remover(req, res));

export default router;