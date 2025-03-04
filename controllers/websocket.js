import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';

import cache from '../db/cache.js';
import logger from '../utils/logger.js';
import { uuidGen } from '../utils/nanoidGen.js';
import MESSAGE_TYPES from '../utils/messageTypes.js';

dotenv.config();

function onSocketError(err) {
  console.error(err);
}

const handleIdentifyAdmin = (ws, message, ip) => {
  logger.info(
    `[IDADMIN-INIT] Admin ${ip} identified with singleUseFacilityId: ${message.singleUseFacilityId}`
  );

  ws.singleUseFacilityId = message.singleUseFacilityId;
  ws.type = MESSAGE_TYPES.IDENTIFY_ADMIN;

  const isConnected = cache.get(`${message.singleUseFacilityId}-connected`);
  if (isConnected) {
    const messageObject = {
      type: MESSAGE_TYPES.ALREADY_CONNECTED,
      singleUseFacilityId: message.singleUseFacilityId,
    };

    ws.send(JSON.stringify(messageObject));
    logger.warn(
      `[IDADMIN-REJECT] Rejected ${ws.uuid} for ${ws.singleUseFacilityId} since already connected`
    );
    return;
  }

  const facilityData = cache.get(message.singleUseFacilityId);
  // logger.info('WS facilityData: ', facilityData);

  if (facilityData) {
    ws.facilityId = facilityData.facilityId;
    ws.facilityName = facilityData.facilityName;

    cache.set(`${message.singleUseFacilityId}-connected`, true);

    const messageObject = {
      type: MESSAGE_TYPES.SET_FACILITY_ID,
      singleUseFacilityId: message.singleUseFacilityId,
      facilityId: facilityData.facilityId,
      facilityName: facilityData.facilityName,
      facilityRoom: facilityData.facilityRoom,
      uuid: ws.uuid,
    };

    ws.send(JSON.stringify(messageObject));
    logger.info(
      `[IDADMIN-ACCEPT] Accepted ${ws.uuid} for ${ws.singleUseFacilityId}`
    );
  } else {
    const messageObject = {
      type: MESSAGE_TYPES.NO_VALID_ID,
      singleUseFacilityId: message.singleUseFacilityId,
    };

    ws.send(JSON.stringify(messageObject));
    logger.warn(
      `[IDADMIN-REJECT] Rejected ${ws.uuid} for ${ws.singleUseFacilityId}`
    );
  }
};

const handleAdminMessage = (wss, message) => {
  const currentNumbers = cache.get(`${message.facilityId}-q`) || [];
  const updatedNumbers = [
    { number: message.number, facilityRoom: message.facilityRoom },
  ].concat(currentNumbers);

  cache.set(`${message.facilityId}-q`, updatedNumbers);

  const messageObject = {
    type: MESSAGE_TYPES.ADMIN,
    facilityId: message.facilityId,
    numbers: updatedNumbers,
  };

  // logger.info('Sending admin message:', messageObject);

  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.facilityId === message.facilityId
    ) {
      client.send(JSON.stringify(messageObject));
      logger.info(
        `[SENDADMIN] Found ${client.uuid} - ${client.singleUseFacilityId} - ${client.facilityId} to send message`
      );
    }
  });
};

const handleAdminLogout = (ws, message, ip) => {
  logger.info(
    `[LOGOUTADMIN] Admin ${ip}/${ws.uuid}/${ws.singleUseFacilityId} logged out`
  );
  cache.delete(message.singleUseFacilityId);
};

const handleIdentifyOpenPublic = (ws, message, ip) => {
  logger.info(
    `[IDOPENPUBLIC-INIT] Open Public ${ip}/${ws.uuid} identified with tempId: ${message.tempId}`
  );

  ws.type = MESSAGE_TYPES.IDENTIFY_OPEN_PUBLIC;
  ws.tempId = message.tempId;
};

const handleIdentifyClient = (ws, message, ip) => {
  logger.info(
    `[IDCLIENT-INIT] Client ${ip}/${ws.uuid} identified with singleUseFacilityId: ${message.singleUseFacilityId}`
  );

  ws.singleUseFacilityId = message.singleUseFacilityId;
  ws.type = MESSAGE_TYPES.IDENTIFY_CLIENT;

  const facilityData = cache.get(message.singleUseFacilityId);
  // logger.info('WS facilityData: ', facilityData);

  if (facilityData) {
    ws.facilityId = facilityData.facilityId;
    ws.facilityName = facilityData.facilityName;

    const messageObject = {
      type: MESSAGE_TYPES.SET_FACILITY_ID,
      singleUseFacilityId: message.singleUseFacilityId,
      facilityId: facilityData.facilityId,
      facilityName: facilityData.facilityName,
      facilityRoom: facilityData.facilityRoom,
      uuid: ws.uuid,
    };

    ws.send(JSON.stringify(messageObject));
    logger.info(
      `[IDCLIENT-ACCEPT] Accepted ${ws.uuid} for ${ws.singleUseFacilityId}`
    );
  } else {
    const messageObject = {
      type: MESSAGE_TYPES.NO_VALID_ID,
      singleUseFacilityId: message.singleUseFacilityId,
    };

    ws.send(JSON.stringify(messageObject));
    logger.warn(
      `[IDCLIENT-REJECT] Rejected ${ws.uuid} for ${ws.singleUseFacilityId}`
    );
  }
};

const handleIdentifyPublic = (ws, message, ip) => {
  logger.info(
    `[IDPUBLIC-INIT] Public ${ip} identified with singleUseFacilityId: ${message.singleUseFacilityId}`
  );

  ws.singleUseFacilityId = message.singleUseFacilityId;
  ws.type = MESSAGE_TYPES.IDENTIFY_PUBLIC;

  const facilityData = cache.get(message.singleUseFacilityId);
  // logger.info('WS facilityData: ', facilityData);

  if (facilityData) {
    ws.facilityId = facilityData.facilityId;
    ws.facilityName = facilityData.facilityName;

    const number = cache.get(`${facilityData.facilityId}-q`) || [];

    const messageObject = {
      type: MESSAGE_TYPES.CURRENT_Q,
      singleUseFacilityId: message.singleUseFacilityId,
      facilityId: facilityData.facilityId,
      facilityName: facilityData.facilityName,
      uuid: ws.uuid,
      number,
    };

    ws.send(JSON.stringify(messageObject));
    logger.info(
      `[IDPUBLIC-ACCEPT] Accepted ${ws.uuid} for ${ws.singleUseFacilityId}`
    );
  } else {
    const messageObject = {
      type: MESSAGE_TYPES.NO_VALID_ID,
      singleUseFacilityId: message.singleUseFacilityId,
    };

    ws.send(JSON.stringify(messageObject));
    logger.warn(
      `[IDPUBLIC-REJECT] Rejected ${ws.uuid} for ${ws.singleUseFacilityId}`
    );
  }
};

const handlePingMessage = (wss, message) => {
  const messageObject = {
    type:
      message.type === MESSAGE_TYPES.PING_ADMIN
        ? MESSAGE_TYPES.PONG_ADMIN
        : MESSAGE_TYPES.PONG_CLIENT,
    singleUseFacilityId: message.singleUseFacilityId,
  };

  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.singleUseFacilityId === message.singleUseFacilityId
    ) {
      client.send(JSON.stringify(messageObject));
    }
  });
};

export default (server) => {
  const websocketServer = new WebSocketServer({ noServer: true });

  websocketServer.on('connection', function connection(ws, req) {
    const uuid = uuidGen();
    ws.uuid = uuid;
    logger.info(`[CONNECTWS] New client connected ${uuid}`);

    ws.on('message', (data) => {
      const client = req.socket.remoteAddress;
      const ip = req.headers['x-forwarded-for'] || client;
      const message = JSON.parse(data);

      switch (message.type) {
        case MESSAGE_TYPES.IDENTIFY_ADMIN:
          handleIdentifyAdmin(ws, message, ip);
          break;
        case MESSAGE_TYPES.ADMIN:
          handleAdminMessage(websocketServer, message);
          break;
        case MESSAGE_TYPES.LOGOUT_ADMIN:
          handleAdminLogout(ws, message, ip);
          break;
        case MESSAGE_TYPES.IDENTIFY_OPEN_PUBLIC:
          handleIdentifyOpenPublic(ws, message, ip);
          break;
        case MESSAGE_TYPES.IDENTIFY_CLIENT:
          handleIdentifyClient(ws, message, ip);
          break;
        case MESSAGE_TYPES.IDENTIFY_PUBLIC:
          handleIdentifyPublic(ws, message, ip);
          break;
        case MESSAGE_TYPES.PING_ADMIN:
        case MESSAGE_TYPES.PING_CLIENT:
          handlePingMessage(websocketServer, message);
          break;
        default:
          ws.close();
          logger.warn(`Unknown message type: ${message.type}`);
      }
    });

    ws.on('close', () => {
      logger.info(
        `[WSCLOSE] ${ws.uuid}/${ws.singleUseFacilityId}/${ws.type} disconnected`
      );

      switch (ws.type) {
        case MESSAGE_TYPES.IDENTIFY_ADMIN:
          cache.delete(`${ws.singleUseFacilityId}-connected`);
          break;
        default:
          break;
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
