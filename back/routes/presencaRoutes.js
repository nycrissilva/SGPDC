import express from 'express';
import PresencaController from '../controllers/PresencaController.js';

const router = express.Router();
const presencaController = new PresencaController();

router.get('/me/turmas', (req, res) => presencaController.listarTurmasProfessor(req, res));
router.get('/me', (req, res) => presencaController.listarProfessor(req, res));
router.post('/me', (req, res) => presencaController.cadastrarProfessor(req, res));

router.get('/', (req, res) => presencaController.listar(req, res));
router.post('/', (req, res) => presencaController.cadastrar(req, res));

export default router;
