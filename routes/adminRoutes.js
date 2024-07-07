import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { renderUpload, uploadHandler, listHandler, downloadHandler, deleteHandler, shareHandler, accessSharedHandler, searchHandler } from '../controllers/fileController.js';
import { renderRegister, register, renderLogin, login, renderAdmin,logout, verifyAccount, resetPasswordRequest,resetPassword } from '../controllers/authController.js';
const router = express.Router();

router.get('/login', renderLogin);
router.post('/login', login);
router.get('/upload', authenticateToken, renderUpload);
router.post('/upload', authenticateToken, uploadHandler);
router.get('/list', authenticateToken, listHandler);
router.get('/download/:id', authenticateToken, downloadHandler);
router.get('/delete/:id', authenticateToken, deleteHandler);
router.get('/share/:id', authenticateToken, shareHandler);
router.get('/shared/:link', accessSharedHandler);
router.get('/search',authenticateToken, searchHandler);

export default router;
