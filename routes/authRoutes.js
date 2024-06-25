import express from 'express';
import { renderRegister, register, renderLogin, login, logout } from '../controllers/authController.js';

const router = express.Router();

router.get('/register', renderRegister);
router.post('/register', register);
router.get('/login', renderLogin);
router.post('/login', login);
router.get('/logout', logout);

export default router;
