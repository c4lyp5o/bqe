import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import redis from '../db/redis.js';
import logger from '../utils/logger.js';
import MESSAGE_TYPES from '../utils/messageTypes.js';

dotenv.config();

const validateToken = async (message, next) => {
  try {
    const { token } = message;

    if (!token) throw new Error('Unauthorized');

    const verifiedToken = await redis.get(token);
    if (verifiedToken) return next();

    jwt.verify(token, process.env.JWT_SECRET);
    await redis.set(token, JSON.stringify(true), {
      EX: 8 * 60 * 60,
    });
    next();
  } catch (error) {
    throw new Error('Unauthorized');
  }
};

const handleIdentifyNumberCaller = async (socket, message) => {
  logger.info(
    `[ID-NC-INIT] NC identified with singleUseFacilityId: ${message.singleUseFacilityId}`
  );

  socket.singleUseFacilityId = message.singleUseFacilityId;
  socket.type = MESSAGE_TYPES.IDENTIFY_NUMBER_CALLER;

  const rawIsConnected = await redis.get(
    `${message.singleUseFacilityId}-connected`
  );
  const isConnected = rawIsConnected ? JSON.parse(rawIsConnected) : false;
  if (isConnected) {
    const messageObject = {
      type: MESSAGE_TYPES.ALREADY_CONNECTED,
      singleUseFacilityId: message.singleUseFacilityId,
    };

    socket.send(messageObject);
    logger.warn(
      `[ID-NC-REJECT] Rejected ${socket.id} for ${socket.singleUseFacilityId} since already connected`
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
      JSON.stringify(true),
      { EX: 8 * 60 * 60 }
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
      `[ID-NC-ACCEPT] Accepted ${socket.id} for ${socket.singleUseFacilityId}`
    );
  } else {
    const messageObject = {
      type: MESSAGE_TYPES.NO_VALID_ID,
      singleUseFacilityId: message.singleUseFacilityId,
    };

    socket.send(messageObject);
    logger.warn(
      `[ID-NC-REJECT] Rejected ${socket.id} for ${socket.singleUseFacilityId}`
    );
  }
};

const handleNumberCallerMessage = async (io, message) => {
  const currentNumbers =
    JSON.parse(await redis.get(`${message.facilityId}-q`)) || [];
  const updatedNumbers = [
    { number: message.number, facilityRoom: message.facilityRoom },
  ].concat(currentNumbers);

  await redis.set(`${message.facilityId}-q`, JSON.stringify(updatedNumbers), {
    EX: 8 * 60 * 60,
  });

  const messageObject = {
    type: MESSAGE_TYPES.NUMBER_CALLER,
    facilityId: message.facilityId,
    numbers: updatedNumbers,
  };

  io.to(message.facilityId).emit('message', messageObject);
};

const handleIdentifyTVQRDisplay = (socket, message) => {
  logger.info(
    `[ID-TVQR-INIT] TVQR Display ${socket.id} identified with tempId: ${message.tempId}`
  );

  socket.type = MESSAGE_TYPES.IDENTIFY_TVQR_DISPLAY;
  socket.tempId = message.tempId;
};

const handleNumberCallerLogout = async (socket, message) => {
  const { token, singleUseFacilityId } = message;

  logger.info(
    `[LOGOUT-NC] Number caller ${socket.id}/${socket.singleUseFacilityId} logged out`
  );
  await redis.del(token);
  await redis.del(singleUseFacilityId);
  await redis.del(`${singleUseFacilityId}-connected`);
};

const handleIdentifyTVNumberDisplay = async (socket, message) => {
  logger.info(
    `[ID-TVND-INIT] TV Number Display ${socket.id} identified with singleUseFacilityId: ${message.singleUseFacilityId}`
  );

  socket.singleUseFacilityId = message.singleUseFacilityId;
  socket.type = MESSAGE_TYPES.IDENTIFY_TVNUMBER_DISPLAY;

  const facilityData = JSON.parse(await redis.get(message.singleUseFacilityId));
  // logger.info('socket facilityData: ', facilityData);

  if (facilityData) {
    socket.facilityId = facilityData.facilityId;
    socket.facilityName = facilityData.facilityName;

    socket.join(facilityData.facilityId);

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
      `[ID-TVND-ACCEPT] Accepted ${socket.id} for ${socket.singleUseFacilityId}`
    );
  } else {
    const messageObject = {
      type: MESSAGE_TYPES.NO_VALID_ID,
      singleUseFacilityId: message.singleUseFacilityId,
    };

    socket.send(messageObject);
    logger.warn(
      `[ID-TVND-REJECT] Rejected ${socket.id} for ${socket.singleUseFacilityId}`
    );
  }
};

const handleIdentifyPublic = async (socket, message) => {
  logger.info(
    `[ID-PUBLIC-INIT] Public ${socket.id} identified with singleUseFacilityId: ${message.singleUseFacilityId}`
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
      `[ID-PUBLIC-ACCEPT] Accepted ${socket.id} for ${socket.singleUseFacilityId}`
    );
  } else {
    const messageObject = {
      type: MESSAGE_TYPES.NO_VALID_ID,
      singleUseFacilityId: message.singleUseFacilityId,
    };

    socket.send(messageObject);
    logger.warn(
      `[ID-PUBLIC-REJECT] Rejected ${socket.id} for ${socket.singleUseFacilityId}`
    );
  }
};

const handlePingMessage = (io, message) => {
  const messageObject = {
    type:
      message.type === MESSAGE_TYPES.PING_NUMBER_CALLER
        ? MESSAGE_TYPES.PONG_NUMBER_CALLER
        : MESSAGE_TYPES.PONG_TVNUMBER_DISPLAY,
    singleUseFacilityId: message.singleUseFacilityId,
  };

  io.to(message.singleUseFacilityId).emit('message', messageObject);
};

export default async function setupSocketIo(server) {
  const redisUrl = `redis://${process.env.REDIS_USER || ''}:${
    process.env.REDIS_PASSWORD
  }@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();

  pubClient.on('error', (err) => {
    logger.error(`[REDIS] Redis pubClient error: ${err.message}`);
  });

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
    cors: { origin: '*' },
    transports: ['websocket'],
  });

  io.on('connection', (socket) => {
    logger.info(`[CONNECTWS] New client connected ${socket.id}`);

    socket.on('message', (message) => {
      switch (message.type) {
        case MESSAGE_TYPES.IDENTIFY_NUMBER_CALLER:
          validateToken(message, () => {
            handleIdentifyNumberCaller(socket, message);
          });
          socket.join(message.singleUseFacilityId);
          break;
        case MESSAGE_TYPES.NUMBER_CALLER:
          validateToken(message, () => {
            handleNumberCallerMessage(socket, message);
          });
          break;
        case MESSAGE_TYPES.LOGOUT_NUMBER_CALLER:
          handleNumberCallerLogout(socket, message);
          break;
        case MESSAGE_TYPES.IDENTIFY_TVQR_DISPLAY:
          socket.join(message.tempId);
          handleIdentifyTVQRDisplay(socket, message);
          break;
        case MESSAGE_TYPES.IDENTIFY_TVNUMBER_DISPLAY:
          handleIdentifyTVNumberDisplay(socket, message);
          socket.join(message.singleUseFacilityId);
          break;
        case MESSAGE_TYPES.IDENTIFY_PUBLIC:
          handleIdentifyPublic(socket, message);
          break;
        case MESSAGE_TYPES.PING_NUMBER_CALLER:
        case MESSAGE_TYPES.PING_TVNUMBER_DISPLAY:
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
        case MESSAGE_TYPES.IDENTIFY_NUMBER_CALLER:
          await redis.del(`${socket.singleUseFacilityId}-connected`);
          break;
        default:
          break;
      }
    });
  });

  return io;
}
