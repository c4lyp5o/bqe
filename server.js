import dotenv from 'dotenv';
import express, { json } from 'express';
import cors from 'cors';
import { createServer } from 'http';

dotenv.config();

// socketio
import setupSocketIo from './controllers/socketio.js';

// middleware
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';

// routes
import httpRoute from './routes/httpRoute.js';

// logger
import logger from './utils/logger.js';

const app = express();
const server = createServer(app);
const ioServer = setupSocketIo(server);

app.use(json());
app.use(
  cors({
    origin: '*',
  })
);

app.use('/api/v1', httpRoute(ioServer));

app.use(notFound);
app.use(errorHandler);

server.listen(process.env.PORT, () => {
  logger.info(`Server is running on http://localhost:${process.env.PORT}`);
});
