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

export {
  healthCheck,
  showCache,
  flushCache,
  getNanoid,
  getSingleUseFacilityId,
};
