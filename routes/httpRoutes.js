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
router.get('/showcache', showCache);
router.get('/flushcache', flushCache);
router.get('/getnanoid', getNanoid);
router.post('/getsingle', getSingleUseFacilityId);

export default router;
