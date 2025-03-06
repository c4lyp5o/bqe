import dotenv from 'dotenv';
import express, { json } from 'express';
import cors from 'cors';

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

// logger
import logger from './utils/logger.js';

const app = express();

app.use(json());
app.use(cors());

app.get('/api/v1/trigger/:multi', simpleAuth, (req, res) => {
  const { multi } = req.params;
  const singleUseFacilityIdAndTempId = multi.split('-');
  if (singleUseFacilityIdAndTempId.length !== 2) {
    res.status(404).json({ message: 'Invalid multiId' });
    return;
  }

  const tempId = singleUseFacilityIdAndTempId[0];
  const singleUseFacilityId = singleUseFacilityIdAndTempId[1];

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
          tempId,
          uuid: client.uuid,
          singleUseFacilityId,
        })
      );
    }
  });

  res.status(200).json({ message: 'Triggered open-queue-screen' });
});

app.get('/api/v1/killswitch', simpleAuth, (req, res) => {
  let messageObject = {
    type: 'killswitch',
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(messageObject));
    }
  });

  // switch (true) {
  //   case !req.query:
  //     wss.clients.forEach((client) => {
  //       if (client.readyState === WebSocket.OPEN) {
  //         client.send(JSON.stringify(messageObject));
  //       }
  //     });
  //     break;
  //   case req.query.uuid:
  //     const uuids = req.query.uuid.split(',');
  //     wss.clients.forEach((client) => {
  //       if (
  //         client.readyState === WebSocket.OPEN &&
  //         uuids.includes(client.uuid)
  //       ) {
  //         client.send(JSON.stringify(messageObject));
  //       }
  //     });
  //     break;
  //   case req.query.facilityId:
  //     const facilityIds = req.query.facilityId.split(',');
  //     wss.clients.forEach((client) => {
  //       if (
  //         client.readyState === WebSocket.OPEN &&
  //         facilityIds.includes(client.facilityId)
  //       ) {
  //         client.send(JSON.stringify(messageObject));
  //       }
  //     });
  //     break;
  // }

  res.status(200).json({ message: 'Killswitch activated' });
});

app.use('/api/v1', httpRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(process.env.PORT, () => {
  logger.info(`Server is running on http://localhost:${process.env.PORT}`);
});

const wss = websocket(server);

app.set('wss', wss);
