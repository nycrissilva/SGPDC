import express from 'express';
import VendaController from '../controllers/VendaController.js';
import { requireFuncionario } from '../middleware/authMiddleware.js';

const router = express.Router();
const vendaController = new VendaController();

router.get('/produtos', requireFuncionario, (req, res) => vendaController.listarProdutos(req, res));
router.post('/produtos', requireFuncionario, (req, res) => vendaController.cadastrarProduto(req, res));
router.put('/produtos/:id', requireFuncionario, (req, res) => vendaController.editarProduto(req, res));
router.delete('/produtos/:id', requireFuncionario, (req, res) => vendaController.inativarProduto(req, res));

router.get('/matriculas', requireFuncionario, (req, res) => vendaController.listarMatriculas(req, res));
router.get('/', requireFuncionario, (req, res) => vendaController.listarVendas(req, res));
router.post('/', requireFuncionario, (req, res) => vendaController.registrarVenda(req, res));
router.get('/:id', requireFuncionario, (req, res) => vendaController.obterVenda(req, res));
router.post('/:id/pagar', requireFuncionario, (req, res) => vendaController.marcarVendaComoPaga(req, res));
router.post('/:id/cancelar', requireFuncionario, (req, res) => vendaController.cancelarVenda(req, res));

export default router;
