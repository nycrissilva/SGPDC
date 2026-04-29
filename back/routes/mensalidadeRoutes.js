import express from 'express';
import MensalidadeController from '../controllers/MensalidadeController.js';
import { requireFuncionario } from '../middleware/authMiddleware.js';

const router = express.Router();
const mensalidadeController = new MensalidadeController();

router.get('/', requireFuncionario, (req, res) => mensalidadeController.listar(req, res));
router.post('/gerar', requireFuncionario, (req, res) => mensalidadeController.gerar(req, res));
router.post('/gerar-grupo', requireFuncionario, (req, res) => mensalidadeController.gerarGrupo(req, res));
router.post('/atualizar-atrasos', requireFuncionario, (req, res) => mensalidadeController.atualizarAtrasos(req, res));
router.post('/aplicar-multas', requireFuncionario, (req, res) => mensalidadeController.aplicarMultas(req, res));
router.get('/configuracao-multa', requireFuncionario, (req, res) => mensalidadeController.obterConfiguracaoMulta(req, res));
router.put('/configuracao-multa', requireFuncionario, (req, res) => mensalidadeController.alterarConfiguracaoMulta(req, res));
router.put('/:id', requireFuncionario, (req, res) => mensalidadeController.editar(req, res));
router.post('/:id/pagar', requireFuncionario, (req, res) => mensalidadeController.marcarComoPaga(req, res));

export default router;
