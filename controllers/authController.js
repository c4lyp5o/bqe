import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import logger from '../utils/logger.js';

dotenv.config();

// Mock data for user
const userData = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
  },
];

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  // for dev use
  const user = userData.find((user) => user.password === password);

  // for prod use
  // const user = userData.find(
  //   (user) => user.username === username && user.password === password
  // );

  if (!user) {
    return res.status(401).json({ msg: 'Bad Request' });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION,
    algorithm: 'HS256',
  });

  res.status(200).json({ token });
};

const validateToken = (req, res) => {
  logger.info(`[VALIDATE] ${req.method} ${req.originalUrl}`);
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
    jwt.verify(jwtToken, process.env.JWT_SECRET);
    res.status(200).json({ msg: 'ok' });
  } catch (error) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }
};

export { loginUser, validateToken };
