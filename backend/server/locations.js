import express from 'express';
import { Location } from './models.js';
import { geocodeAddress, isGeocodingAvailable, lookupTimezone, deriveFreightRegion } from './geocoding.js';

const router = express.Router();

// Helper to generate a new location ID
function generateLocationId() {
  return 'loc-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
}

// GET /api/locations - List locations
router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const query = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { address: { $regex: q, $options: 'i' } },
            { locationTypes: { $regex: q, $options: 'i' } },
            { locationCodes: { $regex: q, $options: 'i' } },
            { primaryContact: { $regex: q, $options: 'i' } },
            { primaryPhone: { $regex: q, $options: 'i' } },
            { branch: { $regex: q, $options: 'i' } },
          ],
        }
      : {};
    const locations = await Location.find(query);
    return res.json(Array.isArray(locations) ? locations : []);
  } catch (err) {
    res.status(500).json({ error: { code: 'LOCATIONS_FETCH_ERROR', message: err.message } });
  }
});

// POST /api/locations - Create a new location
router.post('/', async (req, res) => {
  try {
    const data = req.body || {};
    const now = new Date();
    data.createdAt = now;
    data.updatedAt = now;
    if (!data.name) return res.status(400).json({ error: 'name is required' });
    if (!data.address) return res.status(400).json({ error: 'address is required' });

    // Auto-geocode if lat/lng not provided
    if ((!Number.isFinite(Number(data.lat)) || !Number.isFinite(Number(data.lng))) && isGeocodingAvailable()) {
      try {
        const parts = [data.address, data.city, data.state, data.zip].filter(Boolean).join(', ');
        const geo = await geocodeAddress(parts);
        if (geo) {
          data.lat = geo.lat;
          data.lng = geo.lng;
          data.formattedAddress = geo.formattedAddress;
          data.geocodedAt = new Date();
          if (geo.county) data.county = geo.county;
          if (geo.country) data.country = geo.country;
          if (!data.city && geo.city) data.city = geo.city;
          if (!data.state && geo.state) data.state = geo.state;
          if (!data.zip && geo.zip) data.zip = geo.zip;
          const tz = await lookupTimezone(geo.lat, geo.lng);
          if (tz) data.timezone = tz;
        }
      } catch { /* geocoding is best-effort */ }
    } else if (Number.isFinite(Number(data.lat)) && Number.isFinite(Number(data.lng))) {
      try {
        const tz = await lookupTimezone(Number(data.lat), Number(data.lng));
        if (tz) data.timezone = tz;
      } catch { /* best-effort */ }
    }

    // Derive freight region from state
    const effectiveState = data.state || '';
    if (effectiveState) data.region = deriveFreightRegion(effectiveState);

    const location = new Location(data);
    await location.save();
    return res.status(201).json({ location });
  } catch (err) {
    res.status(500).json({ error: { code: 'LOCATION_CREATE_ERROR', message: err.message } });
  }
});

router.patch('/:locationId', async (req, res) => {
  try {
    const data = req.body || {};
    if (!data.name) return res.status(400).json({ error: 'name is required' });
    if (!data.address) return res.status(400).json({ error: 'address is required' });
    data.updatedAt = new Date();

    // Re-geocode if address fields changed and no explicit coords
    if ((!Number.isFinite(Number(data.lat)) || !Number.isFinite(Number(data.lng))) && isGeocodingAvailable()) {
      try {
        const parts = [data.address, data.city, data.state, data.zip].filter(Boolean).join(', ');
        const geo = await geocodeAddress(parts);
        if (geo) {
          data.lat = geo.lat;
          data.lng = geo.lng;
          data.formattedAddress = geo.formattedAddress;
          data.geocodedAt = new Date();
          if (geo.county) data.county = geo.county;
          if (geo.country) data.country = geo.country;
          if (!data.city && geo.city) data.city = geo.city;
          if (!data.state && geo.state) data.state = geo.state;
          if (!data.zip && geo.zip) data.zip = geo.zip;
          const tz = await lookupTimezone(geo.lat, geo.lng);
          if (tz) data.timezone = tz;
        }
      } catch { /* geocoding is best-effort */ }
    } else if (Number.isFinite(Number(data.lat)) && Number.isFinite(Number(data.lng))) {
      try {
        const tz = await lookupTimezone(Number(data.lat), Number(data.lng));
        if (tz) data.timezone = tz;
      } catch { /* best-effort */ }
    }

    // Derive freight region from state
    if (data.state) data.region = deriveFreightRegion(data.state);

    const updated = await Location.findOneAndUpdate(
      { id: req.params.locationId },
      data,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Location not found' });
    return res.json({ location: updated });
  } catch (err) {
    res.status(500).json({ error: { code: 'LOCATION_UPDATE_ERROR', message: err.message } });
  }
});

router.delete('/:locationId', async (req, res) => {
  try {
    const deleted = await Location.findOneAndDelete({ id: req.params.locationId });
    if (!deleted) return res.status(404).json({ error: 'Location not found' });
    return res.json({ removed: deleted });
  } catch (err) {
    res.status(500).json({ error: { code: 'LOCATION_DELETE_ERROR', message: err.message } });
  }
});

export default router;
