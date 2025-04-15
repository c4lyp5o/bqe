import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

import redis from '../db/redis.js';
import logger from '../utils/logger.js';
import MESSAGE_TYPES from '../utils/messageTypes.js';

dotenv.config();

const handleIdentifyAdmin = async (socket, message) => {
  logger.info(
    `[IDADMIN-INIT] Admin identified with singleUseFacilityId: ${message.singleUseFacilityId}`
  );

  socket.singleUseFacilityId = message.singleUseFacilityId;
  socket.type = MESSAGE_TYPES.IDENTIFY_ADMIN;

  const isConnected = JSON.parse(
    await redis.get(`${message.singleUseFacilityId}-connected`)
  );
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

  const facilityData = JSON.parse(await redis.get(message.singleUseFacilityId));
  // logger.info('WS facilityData: ', facilityData);

  if (facilityData) {
    socket.facilityId = facilityData.facilityId;
    socket.facilityName = facilityData.facilityName;

    await redis.set(
      `${message.singleUseFacilityId}-connected`,
      JSON.stringify(true)
    );

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
  } else {
    const messageObject = {
      type: MESSAGE_TYPES.NO_VALID_ID,
      singleUseFacilityId: message.singleUseFacilityId,
    };

    socket.send(messageObject);
    logger.warn(
      `[IDADMIN-REJECT] Rejected ${socket.id} for ${socket.singleUseFacilityId}`
    );
  }
};

const handleAdminMessage = async (io, message) => {
  const currentNumbers =
    JSON.parse(await redis.get(`${message.facilityId}-q`)) || [];
  const updatedNumbers = [
    { number: message.number, facilityRoom: message.facilityRoom },
  ].concat(currentNumbers);

  await redis.set(`${message.facilityId}-q`, JSON.stringify(updatedNumbers));

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

const handleAdminLogout = async (socket, message) => {
  logger.info(
    `[LOGOUTADMIN] Admin ${socket.id}/${socket.singleUseFacilityId} logged out`
  );
  await redis.del(message.singleUseFacilityId);
};

const handleIdentifyClient = async (socket, message) => {
  logger.info(
    `[IDCLIENT-INIT] Client ${socket.id} identified with singleUseFacilityId: ${message.singleUseFacilityId}`
  );

  socket.singleUseFacilityId = message.singleUseFacilityId;
  socket.type = MESSAGE_TYPES.IDENTIFY_CLIENT;

  const facilityData = JSON.parse(await redis.get(message.singleUseFacilityId));
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

const handleIdentifyPublic = async (socket, message) => {
  logger.info(
    `[IDPUBLIC-INIT] Public ${socket.id} identified with singleUseFacilityId: ${message.singleUseFacilityId}`
  );

  socket.singleUseFacilityId = message.singleUseFacilityId;
  socket.type = MESSAGE_TYPES.IDENTIFY_PUBLIC;

  const facilityData = JSON.parse(await redis.get(message.singleUseFacilityId));
  // logger.info('socket facilityData: ', facilityData);

  if (facilityData) {
    socket.facilityId = facilityData.facilityId;
    socket.facilityName = facilityData.facilityName;

    const number =
      JSON.parse(await redis.get(`${facilityData.facilityId}-q`)) || [];

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

export default async function setupSocketIo(server) {
  const redisUrl = `redis://${process.env.REDIS_USER || ''}:${
    process.env.REDIS_PASSWORD
  }@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
  logger.info(`[REDIS] Redis URL: ${redisUrl}`);

  const pubClient = createClient({
    url: redisUrl,
  });
  const subClient = pubClient.duplicate();

  // Add error handlers for pubClient
  pubClient.on('error', (err) => {
    logger.error(`[REDIS] Redis pubClient error: ${err.message}`);
  });

  // Add error handlers for subClient
  subClient.on('error', (err) => {
    logger.error(`[REDIS] Redis subClient error: ${err.message}`);
  });

  await Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      logger.info('[REDIS] Pub/Sub clients connected to Redis');
    })
    .catch((err) => {
      logger.error('[REDIS] Pub/Sub clients error: ', err);
    });

  const io = new Server(server, {
    adapter: createAdapter(pubClient, subClient),
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

    socket.on('disconnect', async () => {
      logger.info(
        `[WSCLOSE] ${socket.id}/${socket.singleUseFacilityId}/${socket.type} disconnected`
      );

      switch (socket.type) {
        case MESSAGE_TYPES.IDENTIFY_ADMIN:
          await redis.del(`${socket.singleUseFacilityId}-connected`);
          break;
        default:
          break;
      }
    });
  });

  return io;
}
