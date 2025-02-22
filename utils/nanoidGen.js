import { customAlphabet } from 'nanoid';
import dotenv from 'dotenv';

dotenv.config();

const nanoid = customAlphabet('1234567890ABCDEF', process.env.NANOID_LENGTH);

export default nanoid;
