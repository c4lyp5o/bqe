import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 50000,
  maxAge: 1000 * 60 * 60,
});

export default cache;
