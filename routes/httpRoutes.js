import express from 'express';
import {
  healthCheck,
  showCache,
  flushCache,
  getNanoid,
  getSingleUseFacilityId,
  triggerOpenQueueScreen,
  activateKillswitch,
} from '../controllers/http.js';
import simpleAuth from '../middleware/simpleAuth.js';

const router = express.Router();

export default (wss) => {
  router.get('/health', healthCheck);
  router.get('/showcache', simpleAuth, showCache);
  router.get('/flushcache', simpleAuth, flushCache);
  router.get('/getnanoid', simpleAuth, getNanoid);
  router.post('/getsingle', simpleAuth, getSingleUseFacilityId);
  router.get('/trigger/:multi', simpleAuth, (req, res) => {
    triggerOpenQueueScreen(req, res, wss);
  });
  router.get('/killswitch', simpleAuth, (req, res) => {
    activateKillswitch(req, res, wss);
  });

  return router;
};
