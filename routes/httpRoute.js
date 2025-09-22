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
import { loginUser, validateToken } from '../controllers/authController.js';
import localAuth from '../middleware/localAuth.js';
import simpleAuth from '../middleware/simpleAuth.js';
import apiKeyAuth from '../middleware/apiKeyAuth.js';

const router = express.Router();

export default function httpRoutes(ioServer) {
  // Public routes
  router.post('/login', loginUser);
  router.get('/getnanoid', getNanoid);

  // Routes using API key
  router.get('/cache', apiKeyAuth, showCache);
  router.delete('/cache', apiKeyAuth, flushCache);
  router.get('/killswitch', apiKeyAuth, (req, res) =>
    killswitch(req, res, ioServer)
  );

  // Routes using simple auth
  router.get('/validate-token', simpleAuth, validateToken);
  router.post('/getsingle', simpleAuth, getSingleUseFacilityId);
  router.get('/trigger/:multi', simpleAuth, (req, res) =>
    triggerOpenQueueScreen(req, res, ioServer)
  );

  // Routes using local auth
  router.get('/healthcheck', localAuth, healthCheck);

  return router;
}
