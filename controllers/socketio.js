import dotenv from 'dotenv';
import { Server } from 'socket.io';

import cache from '../db/cache.js';
import logger from '../utils/logger.js';
import MESSAGE_TYPES from '../utils/messageTypes.js';

dotenv.config();

const handleIdentifyAdmin = (socket, message) => {
  logger.info(
    `[IDADMIN-INIT] Admin identified with singleUseFacilityId: ${message.singleUseFacilityId}`
  );

  socket.singleUseFacilityId = message.singleUseFacilityId;
  socket.type = MESSAGE_TYPES.IDENTIFY_ADMIN;

  const isConnected = cache.get(`${message.singleUseFacilityId}-connected`);
  if (isConnected) {
    const messageObject = {
      type: MESSAGE_TYPES.ALREADY_CONNECTED,
      singleUseFacilityId: message.singleUseFacilityId,
    };

    socket.send(messageObject);
    logger.warn(
      `[IDADMIN-REJECT] Rejected ${socket.id} for ${socket.singleUseFacilityId} since already connected`
    );
    return;
  }

  const facilityData = cache.get(message.singleUseFacilityId);
  // logger.info('WS facilityData: ', facilityData);

  if (facilityData) {
    socket.facilityId = facilityData.facilityId;
    socket.facilityName = facilityData.facilityName;

    cache.set(`${message.singleUseFacilityId}-connected`, true);

    const messageObject = {
      type: MESSAGE_TYPES.SET_FACILITY_ID,
      singleUseFacilityId: message.singleUseFacilityId,
      facilityId: facilityData.facilityId,
      facilityName: facilityData.facilityName,
      facilityRoom: facilityData.facilityRoom,
      uuid: socket.id,
    };

    socket.send(messageObject);
    logger.info(
      `[IDADMIN-ACCEPT] Accepted ${socket.id} for ${socket.singleUseFacilityId}`
    );
  }
};

const handleAdminMessage = async (io, message) => {
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

  const sockets = await io.fetchSockets();

  for (const socket of sockets) {
    if (
      socket.type === MESSAGE_TYPES.IDENTIFY_CLIENT &&
      socket.facilityId === message.facilityId
    ) {
      socket.send(messageObject);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

const handleIdentifyOpenPublic = (socket, message) => {
  logger.info(
    `[IDOPENPUBLIC-INIT] Open Public ${socket.id} identified with tempId: ${message.tempId}`
  );

  socket.type = MESSAGE_TYPES.IDENTIFY_OPEN_PUBLIC;
  socket.tempId = message.tempId;
};

const handleAdminLogout = (socket, message) => {
  logger.info(
    `[LOGOUTADMIN] Admin ${socket.id}/${socket.singleUseFacilityId} logged out`
  );
  cache.delete(message.singleUseFacilityId);
};

const handleIdentifyClient = (socket, message) => {
  logger.info(
    `[IDCLIENT-INIT] Client ${socket.id} identified with singleUseFacilityId: ${message.singleUseFacilityId}`
  );

  socket.singleUseFacilityId = message.singleUseFacilityId;
  socket.type = MESSAGE_TYPES.IDENTIFY_CLIENT;

  const facilityData = cache.get(message.singleUseFacilityId);
  // logger.info('socket facilityData: ', facilityData);

  if (facilityData) {
    socket.facilityId = facilityData.facilityId;
    socket.facilityName = facilityData.facilityName;

    const messageObject = {
      type: MESSAGE_TYPES.SET_FACILITY_ID,
      singleUseFacilityId: message.singleUseFacilityId,
      facilityId: facilityData.facilityId,
      facilityName: facilityData.facilityName,
      facilityRoom: facilityData.facilityRoom,
      uuid: socket.id,
    };

    socket.send(messageObject);
    logger.info(
      `[IDCLIENT-ACCEPT] Accepted ${socket.id} for ${socket.singleUseFacilityId}`
    );
  } else {
    const messageObject = {
      type: MESSAGE_TYPES.NO_VALID_ID,
      singleUseFacilityId: message.singleUseFacilityId,
    };

    socket.send(messageObject);
    logger.warn(
      `[IDCLIENT-REJECT] Rejected ${socket.id} for ${socket.singleUseFacilityId}`
    );
  }
};

const handleIdentifyPublic = (socket, message) => {
  logger.info(
    `[IDPUBLIC-INIT] Public ${socket.id} identified with singleUseFacilityId: ${message.singleUseFacilityId}`
  );

  socket.singleUseFacilityId = message.singleUseFacilityId;
  socket.type = MESSAGE_TYPES.IDENTIFY_PUBLIC;

  const facilityData = cache.get(message.singleUseFacilityId);
  // logger.info('socket facilityData: ', facilityData);

  if (facilityData) {
    socket.facilityId = facilityData.facilityId;
    socket.facilityName = facilityData.facilityName;

    const number = cache.get(`${facilityData.facilityId}-q`) || [];

    const messageObject = {
      type: MESSAGE_TYPES.CURRENT_Q,
      singleUseFacilityId: message.singleUseFacilityId,
      facilityId: facilityData.facilityId,
      facilityName: facilityData.facilityName,
      uuid: socket.id,
      number,
    };

    socket.send(messageObject);
    logger.info(
      `[IDPUBLIC-ACCEPT] Accepted ${socket.id} for ${socket.singleUseFacilityId}`
    );
  } else {
    const messageObject = {
      type: MESSAGE_TYPES.NO_VALID_ID,
      singleUseFacilityId: message.singleUseFacilityId,
    };

    socket.send(messageObject);
    logger.warn(
      `[IDPUBLIC-REJECT] Rejected ${socket.id} for ${socket.singleUseFacilityId}`
    );
  }
};

const handlePingMessage = async (io, message) => {
  const messageObject = {
    type:
      message.type === MESSAGE_TYPES.PING_ADMIN
        ? MESSAGE_TYPES.PONG_ADMIN
        : MESSAGE_TYPES.PONG_CLIENT,
    singleUseFacilityId: message.singleUseFacilityId,
  };

  const sockets = await io.fetchSockets();

  for (const socket of sockets) {
    if (socket.singleUseFacilityId === message.singleUseFacilityId) {
      socket.send(messageObject);
    }
  }
};

export default function setupSocketIo(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    logger.info(`[CONNECTWS] New client connected ${socket.id}`);

    socket.on('message', (message) => {
      switch (message.type) {
        case MESSAGE_TYPES.IDENTIFY_ADMIN:
          handleIdentifyAdmin(socket, message);
          break;
        case MESSAGE_TYPES.ADMIN:
          handleAdminMessage(io, message);
          break;
        case MESSAGE_TYPES.LOGOUT_ADMIN:
          handleAdminLogout(socket, message);
          break;
        case MESSAGE_TYPES.IDENTIFY_OPEN_PUBLIC:
          handleIdentifyOpenPublic(socket, message);
          break;
        case MESSAGE_TYPES.IDENTIFY_CLIENT:
          handleIdentifyClient(socket, message);
          break;
        case MESSAGE_TYPES.IDENTIFY_PUBLIC:
          handleIdentifyPublic(socket, message);
          break;
        case MESSAGE_TYPES.PING_ADMIN:
        case MESSAGE_TYPES.PING_CLIENT:
          handlePingMessage(io, message);
          break;
        default:
          socket.close();
          logger.warn(`Unknown message type: ${message.type}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(
        `[WSCLOSE] ${socket.id}/${socket.singleUseFacilityId}/${socket.type} disconnected`
      );

      switch (socket.type) {
        case MESSAGE_TYPES.IDENTIFY_ADMIN:
          cache.delete(`${socket.singleUseFacilityId}-connected`);
          break;
        default:
          break;
      }
    });
  });

  return io;
}
