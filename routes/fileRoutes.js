import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { renderUpload, uploadHandler, listHandler, downloadHandler, deleteHandler, shareHandler, accessSharedHandler } from '../controllers/fileController.js';

const router = express.Router();

router.get('/upload', authenticateToken, renderUpload);
router.post('/upload', authenticateToken, uploadHandler);
router.get('/list', authenticateToken, listHandler);
router.get('/download/:id', authenticateToken, downloadHandler);
router.post('/delete/:id', authenticateToken, deleteHandler);
router.post('/share/:id', authenticateToken, shareHandler);
router.get('/shared/:link', accessSharedHandler);

export default router;
