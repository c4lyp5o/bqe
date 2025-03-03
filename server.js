import dotenv from 'dotenv';
import express, { json } from 'express';
import cors from 'cors';
import http from 'http';

dotenv.config();

// websocket
import websocket from './controllers/websocket.js';

// middleware
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';

// routes
import httpRoutes from './routes/httpRoutes.js';

// logger
import logger from './utils/logger.js';

const app = express();
const server = http.createServer(app);
const wss = websocket(server);

app.use(json());
app.use(cors());

app.use('/api/v1', httpRoutes(wss));

app.use(notFound);
app.use(errorHandler);

server.listen(process.env.PORT, () => {
  logger.info(`Server is running on http://localhost:${process.env.PORT}`);
});
