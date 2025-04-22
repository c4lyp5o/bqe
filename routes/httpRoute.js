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
import simpleAuth from '../middleware/simpleAuth.js';
import apiKeyAuth from '../middleware/apiKeyAuth.js';

const router = express.Router();

export default function httpRoutes(ioServer) {
  // Auth routes
  router.post('/login', loginUser);
  router.get('/validate-token', simpleAuth, validateToken);

  // Routes using API key
  router.get('/cache', apiKeyAuth, showCache);
  router.delete('/cache', apiKeyAuth, flushCache);
  router.get('/killswitch', apiKeyAuth, (req, res) =>
    killswitch(req, res, ioServer)
  );

  // Routes using simple auth
  router.post('/getsingle', simpleAuth, getSingleUseFacilityId);
  router.get('/trigger/:multi', simpleAuth, (req, res) =>
    triggerOpenQueueScreen(req, res, ioServer)
  );

  // Health check and nanoid generation
  // These routes are public and do not require authentication
  router.get('/health', healthCheck);
  router.get('/getnanoid', getNanoid);

  return router;
}
