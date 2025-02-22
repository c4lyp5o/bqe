import cache from '../db/cache.js';
import nanoid from '../utils/nanoidGen.js';

const healthCheck = (req, res) => {
  res.status(200).json({ message: 'API is running' });
};

const showCache = (req, res) => {
  res.status(200).json(cache.dump());
};

const getNanoid = (req, res) => {
  res.status(200).json({ number: nanoid() });
};

export { healthCheck, showCache, getNanoid };
