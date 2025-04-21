import express from 'express';
import {
  healthCheck,
  showCache,
  flushCache,
  getNanoid,
  getSingleUseFacilityId,
  triggerOpenQueueScreen,
  killswitch,
} from '../controllers/httpController.js';
import simpleAuth from '../middleware/simpleAuth.js';

const router = express.Router();

export default function httpRoutes(ioServer) {
  router.get('/health', healthCheck);
  router.get('/cache', showCache);
  router.delete('/cache', flushCache);
  router.get('/getnanoid', getNanoid);
  router.post('/getsingle', getSingleUseFacilityId);
  router.get('/trigger/:multi', (req, res) =>
    triggerOpenQueueScreen(req, res, ioServer)
  );
  router.get('/killswitch', (req, res) => killswitch(req, res, ioServer));

  return router;
}
