import { createClient } from 'redis';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const redisClient = createClient({
  url: `redis://${process.env.REDIS_USER || ''}:${process.env.REDIS_PASSWORD}@${
    process.env.REDIS_HOST
  }:${process.env.REDIS_PORT}`,
});

redisClient.on('error', (err) => {
  logger.error(`[REDIS] Redis client error: ${err.message}`);
});

(async () => {
  try {
    await redisClient.connect();
    logger.info('[REDIS] Connected to Redis');
  } catch (err) {
    logger.error(`[REDIS] Failed to connect to Redis: ${err.message}`);
  }
})();

export default redisClient;
