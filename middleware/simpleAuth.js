import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import logger from '../utils/logger.js';

dotenv.config();

const simpleAuth = (req, res, next) => {
  logger.info(`[AUTH] ${req.method} ${req.originalUrl}`);
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  if (!token.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  const jwtToken = token.split(' ')[1];
  if (!jwtToken) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }
};

export default simpleAuth;
