import express from 'express';
import { healthCheck, showCache, getNanoid } from '../controllers/http.js';

const router = express.Router();

router.get('/health', healthCheck);
router.get('/showcache', showCache);
router.get('/getnanoid', getNanoid);

export default router;
