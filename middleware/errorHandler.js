import logger from '../utils/logger.js';

const errorHandler = (err, req, res) => {
  logger.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
};

export default errorHandler;
