import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { customAlphabet } from 'nanoid';

import MESSAGE_TYPES from '../utils/messageTypes.js';
import cache from '../db/cache.js';

dotenv.config();
const nanoid = customAlphabet('1234567890ABCDEF', 18);

function onSocketError(err) {
  console.error(err);
}

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

const handleAdminMessage = (wss, message) => {
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

const handlePingMessage = (wss, message) => {
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

export default (server) => {
  const websocketServer = new WebSocketServer({ noServer: true });

  websocketServer.on('connection', function connection(ws, req) {
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
          handleAdminMessage(websocketServer, message);
          break;
        case MESSAGE_TYPES.PING_ADMIN:
        case MESSAGE_TYPES.PING_CLIENT:
          handlePingMessage(websocketServer, message);
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

  server.on('upgrade', function upgrade(request, socket, head) {
    socket.on('error', onSocketError);

    websocketServer.handleUpgrade(request, socket, head, function done(ws) {
      websocketServer.emit('connection', ws, request);
    });
  });

  return websocketServer;
};
