import express from 'express';
import { healthCheck, showCache, getNanoid } from '../controllers/http.js';
import simpleAuth from '../middleware/simpleAuth.js';

const router = express.Router();

router.get('/health', healthCheck);
router.get('/showcache', simpleAuth, showCache);
router.get('/getnanoid', simpleAuth, getNanoid);

export default router;
