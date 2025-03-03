import { nanoid as uuidGen, customAlphabet } from 'nanoid';
import dotenv from 'dotenv';

dotenv.config();

const customGen = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  process.env.NANOID_LENGTH
);

export { uuidGen, customGen };
