import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
const authController = new AuthController();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));
router.get('/me', requireAuth, (req, res) => authController.me(req, res));
router.get('/profile', requireAuth, (req, res) => authController.profile(req, res));
router.put('/profile', requireAuth, (req, res) => authController.updateProfile(req, res));
router.post('/change-password', requireAuth, (req, res) => authController.changePassword(req, res));

export default router;
