import redis from '../db/redis.js';
import nanoid from '../utils/nanoidGen.js';

const healthCheck = (req, res) => {
  res.status(200).json({ msg: 'ok' });
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
  res.status(200).json({ msg: 'Cache flushed' });
};

const getNanoid = (req, res) => {
  res.status(200).json({ number: nanoid() });
};

const getSingleUseFacilityId = async (req, res) => {
  const { facilityId, facilityName, facilityRoom } = req.body;

  if (!facilityId) {
    return res.status(400).json({ msg: 'Bad Request' });
  }

  const singleUseFacilityId = nanoid();

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
    res.status(400).json({ msg: 'Bad Request' });
    return;
  }

  const tempId = singleUseFacilityIdAndTempId[0];
  const singleUseFacilityId = singleUseFacilityIdAndTempId[1];

  const facilityId = JSON.parse(await redis.get(singleUseFacilityId));
  if (!facilityId) {
    res.status(404).json({ msg: 'Not Found' });
    return;
  }

  ioServer.to(tempId).emit('message', {
    type: 'open-queue-screen',
    tempId,
    singleUseFacilityId,
  });

  res.status(200).json({ msg: 'ok' });
};

const killswitch = (req, res, ioServer) => {
  const messageObject = {
    type: 'killswitch',
  };

  ioServer.emit('message', messageObject);

  res.status(200).json({ msg: 'ok' });
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
