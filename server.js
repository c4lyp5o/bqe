import dotenv from 'dotenv';
import express, { json } from 'express';
import { WebSocketServer } from 'ws';
import { customAlphabet } from 'nanoid';
import cache from './db/cache.js';
import cors from 'cors';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import path from 'path';

dotenv.config();
const nanoid = customAlphabet('1234567890ABCDEF', 18);

const MESSAGE_TYPES = {
  IDENTIFY_ADMIN: 'identifyadmin',
  IDENTIFY_CLIENT: 'identifyclient',
  IDENTIFY_OPEN_PUBLIC: 'identifyopenpublic',
  IDENTIFY_PUBLIC: 'identifypublic',
  ADMIN: 'admin',
  PING_ADMIN: 'ping-admin',
  PING_CLIENT: 'ping-client',
  SET_UID: 'set-uid',
  ALREADY_CONNECTED: 'already-connected',
  CURRENT_Q: 'currentq',
  OPEN_QUEUE_SCREEN: 'open-queue-screen',
  PONG_ADMIN: 'pong-admin',
  PONG_CLIENT: 'pong-client',
};

const wss = new WebSocketServer({ port: process.env.WS_PORT });

const handleIdentifyAdmin = (ws, message, ip) => {
  console.log(`Admin ${ip} identified with facilityId: ${message.facilityId}`);
  ws.facilityId = message.facilityId;
  ws.type = MESSAGE_TYPES.IDENTIFY_ADMIN;

  if (cache.get(message.facilityId)) {
    console.log(`Admin for ${message.facilityId} already connected`);
    ws.uniqueAdmin = false;
    ws.send(JSON.stringify({ type: MESSAGE_TYPES.ALREADY_CONNECTED }));
    ws.close();
  } else {
    console.log('admin not connected');
    const uid = nanoid();
    ws.uniqueAdmin = true;
    ws.uid = uid;
    let currAdmin = {
      type: MESSAGE_TYPES.ADMIN,
      facilityId: message.facilityId,
      uniqueAdmin: true,
      uid,
    };
    cache.set(message.facilityId, currAdmin);
    cache.set(uid, message.facilityId);
    currAdmin = {
      ...currAdmin,
      type: MESSAGE_TYPES.SET_UID,
    };
    ws.send(JSON.stringify(currAdmin));
  }
};

const handleIdentifyClient = (ws, message, ip) => {
  console.log(`Client ${ip} identified with facilityId: ${message.facilityId}`);
  ws.facilityId = message.facilityId;
  ws.type = MESSAGE_TYPES.IDENTIFY_CLIENT;
};

const handleIdentifyOpenPublic = (ws, message, ip) => {
  console.log(`Open Public ${ip} identified with tempId: ${message.tempId}`);
  ws.tempId = message.tempId;
  ws.type = MESSAGE_TYPES.IDENTIFY_OPEN_PUBLIC;
};

const handleIdentifyPublic = (ws, message, ip) => {
  console.log(`Public ${ip} identified with uid: ${message.uid}`);
  ws.uid = message.uid;
  ws.type = MESSAGE_TYPES.IDENTIFY_PUBLIC;
  const facId = cache.get(message.uid);
  if (facId) {
    const currQ = cache.get(`${facId}-q`);
    if (currQ) {
      ws.send(
        JSON.stringify({ type: MESSAGE_TYPES.CURRENT_Q, number: currQ.number })
      );
    }
  }
};

const handleAdminMessage = (message) => {
  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.facilityId === message.facilityId
    ) {
      const messageObject = {
        type: MESSAGE_TYPES.ADMIN,
        facilityId: message.facilityId,
        number: message.number,
      };
      cache.set(`${message.facilityId}-q`, messageObject);
      client.send(JSON.stringify(messageObject));
    }
  });
};

const handlePingMessage = (message) => {
  const responseType =
    message.type === MESSAGE_TYPES.PING_ADMIN
      ? MESSAGE_TYPES.PONG_ADMIN
      : MESSAGE_TYPES.PONG_CLIENT;

  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.facilityId === message.facilityId
    ) {
      client.send(
        JSON.stringify({
          type: responseType,
          facilityId: message.facilityId,
        })
      );
    }
  });
};

wss.on('connection', function connection(ws, req) {
  ws.on('message', async (data) => {
    const client = req.socket.remoteAddress;
    const ip = req.headers['x-forwarded-for'] || client;
    const message = JSON.parse(data);
    // console.log(message);

    switch (message.type) {
      case MESSAGE_TYPES.IDENTIFY_ADMIN:
        handleIdentifyAdmin(ws, message, ip);
        break;
      case MESSAGE_TYPES.IDENTIFY_CLIENT:
        handleIdentifyClient(ws, message, ip);
        break;
      case MESSAGE_TYPES.IDENTIFY_OPEN_PUBLIC:
        handleIdentifyOpenPublic(ws, message, ip);
        break;
      case MESSAGE_TYPES.IDENTIFY_PUBLIC:
        handleIdentifyPublic(ws, message, ip);
        break;
      case MESSAGE_TYPES.ADMIN:
        handleAdminMessage(message);
        break;
      case MESSAGE_TYPES.PING_ADMIN:
      case MESSAGE_TYPES.PING_CLIENT:
        handlePingMessage(message);
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  });

  ws.on('close', () => {
    console.log(`facilityId: ${ws.facilityId}/${ws.type} disconnected`);
    if (
      ws.facilityId &&
      ws.type === MESSAGE_TYPES.IDENTIFY_ADMIN &&
      ws.uniqueAdmin
    ) {
      cache.delete(ws.facilityId);
    }
  });

  ws.on('error', console.error);
});

const app = express();
const port = process.env.PORT || 5000;

app.use(json());
app.use(cors());

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

app.get('/api/v1/showcache', (req, res) => {
  res.status(200).json(cache.dump());
});

app.get('/api/v1/trigger/:multi', (req, res) => {
  const multi = req.params.multi;
  const tempiIdAndUid = multi.split('-');
  if (tempiIdAndUid.length !== 2) {
    res.status(404).json({ message: 'Invalid UID' });
    return;
  }
  const tempId = tempiIdAndUid[0];
  const uid = tempiIdAndUid[1];
  const facilityId = cache.get(uid);
  if (!facilityId) {
    res.status(404).json({ message: 'Invalid UID' });
    return;
  }

  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.type === MESSAGE_TYPES.IDENTIFY_OPEN_PUBLIC &&
      client.tempId === tempId
    ) {
      client.send(
        JSON.stringify({
          type: MESSAGE_TYPES.OPEN_QUEUE_SCREEN,
          tempId,
          facilityId,
          uid,
        })
      );
    }
  });

  res.status(200).json({ message: 'Triggered open-queue-screen' });
});

app.get('/api/v1/getnanoid', (req, res) => {
  res.status(200).json({ number: nanoid() });
});

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(
    `WebSocket server is running on ws://localhost:${process.env.WS_PORT}`
  );
});
