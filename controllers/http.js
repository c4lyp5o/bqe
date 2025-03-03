import cache from '../db/cache.js';
import { customGen } from '../utils/nanoidGen.js';

const healthCheck = (req, res) => {
  res.status(200).json({ message: 'API is running' });
};

const showCache = (req, res) => {
  res.status(200).json(cache.dump());
};

const flushCache = (req, res) => {
  cache.clear();
  res.status(200).json({ message: 'Cache flushed' });
};

const getNanoid = (req, res) => {
  res.status(200).json({ number: customGen() });
};

const getSingleUseFacilityId = (req, res) => {
  // console.log('express body: ', req.body);

  const { facilityId, facilityName, facilityRoom } = req.body;

  if (!facilityId) {
    return res.status(400).json({ message: 'Facility ID is required' });
  }

  const singleUseFacilityId = customGen();
  cache.set(singleUseFacilityId, {
    facilityId,
    facilityName,
    facilityRoom,
  });

  res.status(200).json({ singleUseFacilityId });
};

const triggerOpenQueueScreen = (req, res, wss) => {
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
};

const activateKillswitch = (req, res, wss) => {
  let messageObject = {
    type: 'killswitch',
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(messageObject));
    }
  });

  res.status(200).json({ message: 'Killswitch activated' });
};

export {
  healthCheck,
  showCache,
  flushCache,
  getNanoid,
  getSingleUseFacilityId,
  triggerOpenQueueScreen,
  activateKillswitch,
};
