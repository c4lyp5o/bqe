import { nanoid as uuidGen, customAlphabet } from 'nanoid';
import dotenv from 'dotenv';

dotenv.config();

const customGen = customAlphabet('1234567890ABCDEF', process.env.NANOID_LENGTH);

export { uuidGen, customGen };
