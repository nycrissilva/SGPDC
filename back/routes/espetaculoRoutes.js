import express from 'express';
import EspetaculoController from '../controllers/EspetaculoController.js';
import { requireFuncionario } from '../middleware/authMiddleware.js';

const router = express.Router();
const controller = new EspetaculoController();

router.get('/', requireFuncionario, (req, res) => controller.listarEspetaculos(req, res));
router.post('/', requireFuncionario, (req, res) => controller.cadastrarEspetaculo(req, res));
router.get('/:id', requireFuncionario, (req, res) => controller.obterEspetaculo(req, res));
router.put('/:id', requireFuncionario, (req, res) => controller.editarEspetaculo(req, res));
router.delete('/:id', requireFuncionario, (req, res) => controller.inativarEspetaculo(req, res));
router.get('/:id/coreografias', requireFuncionario, (req, res) => controller.listarCoreografias(req, res));

export default router;
