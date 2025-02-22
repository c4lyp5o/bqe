import { LRUCache } from 'lru-cache';
import dotenv from 'dotenv';

dotenv.config();

const cache = new LRUCache({
  max: Number.parseInt(process.env.CACHE_MAX_STORAGE),
  maxAge: Number.parseInt(process.env.CACHE_MAX_AGE),
});

export default cache;
