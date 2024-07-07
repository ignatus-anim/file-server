import express from 'express';
import { renderRegister, register, renderLogin, login, renderAdmin,logout, verifyAccount, resetPasswordRequest,resetPassword, renderResetPassword, renderVerificationSent, renderNewPassword } from '../controllers/authController.js';

const router = express.Router();

router.get('/register', renderRegister);
router.get('/verification-sent', renderVerificationSent)
router.post('/register', register);
router.get('/login', renderLogin);
router.post('/login', login);
router.get('/admin', renderAdmin);
router.get('/logout', logout);
router.get('/verify/:token', verifyAccount);
router.get('/reset-password', renderResetPassword);
router.post('/reset-password-request', resetPasswordRequest);
router.get('/reset-password/:token', renderNewPassword);
router.post('/reset-password', resetPassword)

export default router;
