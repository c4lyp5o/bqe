import { customAlphabet } from 'nanoid';
import dotenv from 'dotenv';

dotenv.config();

const nanoid = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  process.env.NANOID_LENGTH
);

export default nanoid;
