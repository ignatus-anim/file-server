import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { renderUpload, uploadHandler, listHandler, downloadHandler, deleteHandler, shareHandler, accessSharedHandler, searchHandler, renderShareViaEmail, shareViaEmail} from '../controllers/fileController.js';

const router = express.Router();

router.get('/list', authenticateToken, listHandler);
router.get('/download/:id', authenticateToken, downloadHandler);
router.get('/delete/:id', authenticateToken, deleteHandler);
router.get('/share/:id', authenticateToken, shareHandler);
router.get('/shared/:link', accessSharedHandler);
router.get('/search',authenticateToken, searchHandler);
router.get('/upload', authenticateToken, renderUpload);
router.post('/upload', authenticateToken, uploadHandler);
router.get('/:id/share-via-email', authenticateToken, renderShareViaEmail)
router.post('/share-via-email', authenticateToken, shareViaEmail)
export default router;
