import express from 'express';
import PresencaController from '../controllers/PresencaController.js';
import { requireFuncionario, requireProfessor } from '../middleware/authMiddleware.js';

const router = express.Router();
const presencaController = new PresencaController();

router.get('/me/turmas', requireProfessor, (req, res) => presencaController.listarTurmasProfessor(req, res));
router.get('/me', requireProfessor, (req, res) => presencaController.listarProfessor(req, res));
router.post('/me', requireProfessor, (req, res) => presencaController.cadastrarProfessor(req, res));

router.get('/relatorio', requireFuncionario, (req, res) => presencaController.listarRelatorio(req, res));

router.get('/', (req, res) => presencaController.listar(req, res));
router.post('/', (req, res) => presencaController.cadastrar(req, res));

export default router;
