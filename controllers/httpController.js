import redis from '../db/redis.js';
import nanoid from '../utils/nanoidGen.js';

const healthCheck = (req, res) => {
  res.status(200).json({ message: 'API is running' });
};

const showCache = async (req, res) => {
  const keys = await redis.keys('*');
  const cache = {};

  for (const key of keys) {
    const value = await redis.get(key);
    cache[key] = JSON.parse(value);
  }

  res.status(200).json(cache);
};

const flushCache = async (req, res) => {
  await redis.flushAll();
  res.status(200).json({ message: 'Cache flushed' });
};

const getNanoid = (req, res) => {
  res.status(200).json({ number: nanoid() });
};

const getSingleUseFacilityId = async (req, res) => {
  const { facilityId, facilityName, facilityRoom } = req.body;

  if (!facilityId) {
    return res.status(400).json({ message: 'Facility ID is required' });
  }

  const singleUseFacilityId = nanoid();

  // Serialize the object before storing it in Redis
  await redis.set(
    singleUseFacilityId,
    JSON.stringify({
      facilityId,
      facilityName,
      facilityRoom,
    })
  );

  res.status(200).json({ singleUseFacilityId });
};

const triggerOpenQueueScreen = async (req, res, ioServer) => {
  const { multi } = req.params;

  const singleUseFacilityIdAndTempId = multi.split('-');
  if (singleUseFacilityIdAndTempId.length !== 2) {
    res.status(404).json({ message: 'Invalid multiId' });
    return;
  }

  const tempId = singleUseFacilityIdAndTempId[0];
  const singleUseFacilityId = singleUseFacilityIdAndTempId[1];

  const facilityId = JSON.parse(await redis.get(singleUseFacilityId));
  if (!facilityId) {
    res.status(404).json({ message: 'Invalid facilityId' });
    return;
  }

  const sockets = await ioServer.fetchSockets();

  for (const socket of sockets) {
    if (socket.tempId === tempId) {
      socket.send({
        type: 'open-queue-screen',
        tempId,
        uuid: socket.id,
        singleUseFacilityId,
      });
    }
  }

  res.status(200).json({ message: 'Triggered open-queue-screen' });
};

const killswitch = (req, res, ioServer) => {
  const messageObject = {
    type: 'killswitch',
  };

  ioServer.emit('message', messageObject);

  res.status(200).json({ message: 'Killswitch activated' });
};

export {
  healthCheck,
  showCache,
  flushCache,
  getNanoid,
  getSingleUseFacilityId,
  triggerOpenQueueScreen,
  killswitch,
};
