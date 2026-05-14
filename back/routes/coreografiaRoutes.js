import express from 'express';
import EspetaculoController from '../controllers/EspetaculoController.js';
import { requireFuncionario } from '../middleware/authMiddleware.js';

const router = express.Router();
const controller = new EspetaculoController();

router.get('/', requireFuncionario, (req, res) => controller.listarCoreografias(req, res));
router.post('/', requireFuncionario, (req, res) => controller.cadastrarCoreografia(req, res));
router.get('/:id', requireFuncionario, (req, res) => controller.obterCoreografia(req, res));
router.put('/:id', requireFuncionario, (req, res) => controller.editarCoreografia(req, res));
router.delete('/:id', requireFuncionario, (req, res) => controller.inativarCoreografia(req, res));
router.post('/:id/papeis', requireFuncionario, (req, res) => controller.salvarPapel(req, res));
router.delete('/:id/papeis/:papelId', requireFuncionario, (req, res) => controller.inativarPapel(req, res));
router.post('/:id/participantes', requireFuncionario, (req, res) => controller.salvarParticipante(req, res));
router.delete('/:id/participantes/:participanteId', requireFuncionario, (req, res) => controller.inativarParticipante(req, res));
router.post('/:id/gerar-cobrancas-fantasia', requireFuncionario, (req, res) => controller.gerarCobrancasFantasia(req, res));

export default router;
