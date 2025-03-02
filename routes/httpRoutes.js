import express from 'express';
import {
  healthCheck,
  showCache,
  flushCache,
  getNanoid,
  getSingleUseFacilityId,
} from '../controllers/http.js';
import simpleAuth from '../middleware/simpleAuth.js';

const router = express.Router();

router.get('/health', healthCheck);
router.get('/showcache', simpleAuth, showCache);
router.get('/flushcache', simpleAuth, flushCache);
router.get('/getnanoid', simpleAuth, getNanoid);
router.post('/getsingle', simpleAuth, getSingleUseFacilityId);

export default router;
