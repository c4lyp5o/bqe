import dotenv from 'dotenv';
import express, { json } from 'express';
import cors from 'cors';
import http from 'http';

dotenv.config();

// websocket
import websocket from './controllers/websocket.js';

// middleware
import cache from './db/cache.js';
import simpleAuth from './middleware/simpleAuth.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';

// routes
import httpRoutes from './routes/httpRoutes.js';

const app = express();
const server = http.createServer(app);
const wss = websocket(server);

app.use(json());
app.use(cors());

app.get('/api/v1/trigger/:multi', simpleAuth, (req, res) => {
  const { multi } = req.params;
  const singleUseFacilityIdAndTempId = multi.split('-');
  if (singleUseFacilityIdAndTempId.length !== 2) {
    res.status(404).json({ message: 'Invalid multiId' });
    return;
  }
  const singleUseFacilityId = singleUseFacilityIdAndTempId[0];
  const tempId = singleUseFacilityIdAndTempId[1];

  const facilityId = cache.get(singleUseFacilityId);
  if (!facilityId) {
    res.status(404).json({ message: 'Invalid facilityId' });
    return;
  }

  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.type === 'identifyopenpublic' &&
      client.tempId === tempId
    ) {
      client.send(
        JSON.stringify({
          type: 'open-queue-screen',
          singleUseFacilityId,
          tempId,
        })
      );
    }
  });

  res.status(200).json({ message: 'Triggered open-queue-screen' });
});

app.get('/api/v1/killswitch', simpleAuth, (req, res) => {
  const messageObject = {
    type: 'killswitch',
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(messageObject));
    }
  });
});

app.use('/api/v1', httpRoutes);

app.use(notFound);
app.use(errorHandler);

server.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
