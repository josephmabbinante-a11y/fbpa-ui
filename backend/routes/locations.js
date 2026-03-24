import express from 'express';
import Location from '../models/Location.js';
import { geocodeAddress, isGeocodingAvailable, lookupTimezone, deriveFreightRegion } from '../server/geocoding.js';
import { generateLocationId, generateLocationCode } from '../utils/idGenerator.js';

const router = express.Router();

const normalizeString = (value) => (value || '').trim();
const normalizeKey = (value) => normalizeString(value).toLowerCase();

/**
 * Build an address string from parts and geocode it.
 * Non-blocking: returns null if geocoding unavailable or fails.
 */
async function tryGeocode(address, city, state, zip) {
  if (!isGeocodingAvailable()) return null;
  const parts = [address, city, state, zip].map((s) => (s || '').trim()).filter(Boolean);
  if (!parts.length) return null;
  try {
    return await geocodeAddress(parts.join(', '));
  } catch {
    return null;
  }
}

// Search locations by query string
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const regex = new RegExp(q, 'i');
    const locations = await Location.find({
      $or: [
        { name: regex }, { city: regex }, { state: regex }, { zip: regex },
        { locationCode: regex }, { address: regex }, { customerName: regex },
        { primaryContact: regex },
      ],
    })
      .sort({ name: 1 })
      .limit(20);
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all locations
router.get('/', async (req, res) => {
  try {
    const locations = await Location.find().sort({ updatedAt: -1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get location by ID
router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findOne({ id: req.params.id });
    if (!location) return res.status(404).json({ error: 'Location not found' });
    res.json(location);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new location
router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.name) return res.status(400).json({ error: 'Name is required' });
    const id = generateLocationId();
    // Auto-generate locationCode if not provided (mnemonic: CHI-WH01)
    const locationCode = normalizeString(b.locationCode) || generateLocationCode(b.city, b.type);
    const newLocation = new Location({
      id,
      name: normalizeString(b.name),
      nameLower: normalizeKey(b.name),
      locationCode,
      address: normalizeString(b.address),
      city: normalizeString(b.city),
      state: normalizeString(b.state),
      zip: normalizeString(b.zip),
      type: b.type || 'Other',
      role: b.role || 'None',
      customerId: normalizeString(b.customerId),
      customerName: normalizeString(b.customerName),
      primaryContact: normalizeString(b.primaryContact),
      primaryPhone: normalizeString(b.primaryPhone),
      primaryEmail: normalizeString(b.primaryEmail),
      operatingHours: normalizeString(b.operatingHours),
      notes: normalizeString(b.notes),
      appointmentRequired: !!b.appointmentRequired,
      liftgateRequired: !!b.liftgateRequired,
      insidePickup: !!b.insidePickup,
      status: 'Active',
    });

    // Accept explicit lat/lng or auto-geocode from address fields
    if (Number.isFinite(Number(b.lat)) && Number.isFinite(Number(b.lng))) {
      newLocation.lat = Number(b.lat);
      newLocation.lng = Number(b.lng);
      newLocation.formattedAddress = normalizeString(b.formattedAddress);
      newLocation.geocodedAt = new Date();
      // Enrich with timezone
      const tz = await lookupTimezone(newLocation.lat, newLocation.lng);
      if (tz) newLocation.timezone = tz;
    } else {
      const geo = await tryGeocode(b.address, b.city, b.state, b.zip);
      if (geo) {
        newLocation.lat = geo.lat;
        newLocation.lng = geo.lng;
        newLocation.formattedAddress = geo.formattedAddress;
        newLocation.geocodedAt = new Date();
        if (geo.county) newLocation.county = geo.county;
        if (geo.country) newLocation.country = geo.country;
        // Fill city/state/zip from geocode if not provided
        if (!newLocation.city && geo.city) newLocation.city = geo.city;
        if (!newLocation.state && geo.state) newLocation.state = geo.state;
        if (!newLocation.zip && geo.zip) newLocation.zip = geo.zip;
        // Enrich with timezone
        const tz = await lookupTimezone(geo.lat, geo.lng);
        if (tz) newLocation.timezone = tz;
      }
    }

    // Derive freight region from state
    const effectiveState = newLocation.state || normalizeString(b.state);
    if (effectiveState) {
      newLocation.region = deriveFreightRegion(effectiveState);
    }

    await newLocation.save();
    res.status(201).json(newLocation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update location (partial)
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body || {};
    const location = await Location.findOne({ id: req.params.id });
    if (!location) return res.status(404).json({ error: 'Location not found' });

    if (updates.name !== undefined) {
      location.name = normalizeString(updates.name);
      location.nameLower = normalizeKey(updates.name);
    }
    if (updates.address !== undefined) location.address = normalizeString(updates.address);
    if (updates.city !== undefined) location.city = normalizeString(updates.city);
    if (updates.state !== undefined) location.state = normalizeString(updates.state);
    if (updates.zip !== undefined) location.zip = normalizeString(updates.zip);
    if (updates.type !== undefined) location.type = updates.type;
    if (updates.role !== undefined) location.role = updates.role;
    if (updates.locationCode !== undefined) location.locationCode = normalizeString(updates.locationCode);
    if (updates.customerId !== undefined) location.customerId = normalizeString(updates.customerId);
    if (updates.customerName !== undefined) location.customerName = normalizeString(updates.customerName);
    if (updates.primaryContact !== undefined) location.primaryContact = normalizeString(updates.primaryContact);
    if (updates.primaryPhone !== undefined) location.primaryPhone = normalizeString(updates.primaryPhone);
    if (updates.primaryEmail !== undefined) location.primaryEmail = normalizeString(updates.primaryEmail);
    if (updates.operatingHours !== undefined) location.operatingHours = normalizeString(updates.operatingHours);
    if (updates.notes !== undefined) location.notes = normalizeString(updates.notes);
    if (updates.appointmentRequired !== undefined) location.appointmentRequired = !!updates.appointmentRequired;
    if (updates.liftgateRequired !== undefined) location.liftgateRequired = !!updates.liftgateRequired;
    if (updates.insidePickup !== undefined) location.insidePickup = !!updates.insidePickup;
    if (updates.status !== undefined) location.status = updates.status;

    // Accept explicit lat/lng or re-geocode when address fields change
    if (Number.isFinite(Number(updates.lat)) && Number.isFinite(Number(updates.lng))) {
      location.lat = Number(updates.lat);
      location.lng = Number(updates.lng);
      location.formattedAddress = normalizeString(updates.formattedAddress) || location.formattedAddress;
      location.geocodedAt = new Date();
      const tz = await lookupTimezone(location.lat, location.lng);
      if (tz) location.timezone = tz;
    } else if (
      updates.address !== undefined ||
      updates.city !== undefined ||
      updates.state !== undefined ||
      updates.zip !== undefined
    ) {
      const geo = await tryGeocode(
        location.address, location.city, location.state, location.zip,
      );
      if (geo) {
        location.lat = geo.lat;
        location.lng = geo.lng;
        location.formattedAddress = geo.formattedAddress;
        location.geocodedAt = new Date();
        if (geo.county) location.county = geo.county;
        if (geo.country) location.country = geo.country;
        if (!location.city && geo.city) location.city = geo.city;
        if (!location.state && geo.state) location.state = geo.state;
        if (!location.zip && geo.zip) location.zip = geo.zip;
        const tz = await lookupTimezone(geo.lat, geo.lng);
        if (tz) location.timezone = tz;
      }
    }

    // Update freight region if state changed
    if (updates.state !== undefined || location.state) {
      location.region = deriveFreightRegion(location.state);
    }

    location.updatedAt = new Date();
    await location.save();
    res.json(location);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete location
router.delete('/:id', async (req, res) => {
  try {
    const location = await Location.findOne({ id: req.params.id });
    if (!location) return res.status(404).json({ error: 'Location not found' });
    await location.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch enrich: geocode + timezone + region for locations missing enrichment
router.post('/enrich-batch', async (req, res) => {
  if (!isGeocodingAvailable()) {
    return res.json({ enriched: 0, skipped: 0, message: 'Geocoding API key not configured' });
  }

  try {
    const limit = Math.min(Number(req.body?.limit) || 50, 200);
    const locations = await Location.find({
      $or: [
        { lat: null },
        { timezone: { $in: [null, ''] } },
        { region: { $in: [null, ''] } },
        { county: { $in: [null, ''] } },
      ],
    }).limit(limit);

    let enriched = 0;
    let skipped = 0;

    for (const loc of locations) {
      try {
        let needsSave = false;

        // Geocode if missing coordinates
        if (loc.lat == null || loc.lng == null) {
          const geo = await tryGeocode(loc.address, loc.city, loc.state, loc.zip);
          if (geo) {
            loc.lat = geo.lat;
            loc.lng = geo.lng;
            loc.formattedAddress = geo.formattedAddress;
            loc.geocodedAt = new Date();
            if (geo.county && !loc.county) loc.county = geo.county;
            if (geo.country && !loc.country) loc.country = geo.country;
            if (!loc.city && geo.city) loc.city = geo.city;
            if (!loc.state && geo.state) loc.state = geo.state;
            if (!loc.zip && geo.zip) loc.zip = geo.zip;
            needsSave = true;
          }
        }

        // Timezone if missing but has coords
        if ((!loc.timezone) && loc.lat != null && loc.lng != null) {
          const tz = await lookupTimezone(loc.lat, loc.lng);
          if (tz) { loc.timezone = tz; needsSave = true; }
        }

        // Region if missing but has state
        if (!loc.region && loc.state) {
          const r = deriveFreightRegion(loc.state);
          if (r) { loc.region = r; needsSave = true; }
        }

        // County from existing geocode data
        if (!loc.county && loc.lat != null) {
          // county was already set from geocode above if available
          needsSave = needsSave || false;
        }

        if (needsSave) {
          loc.updatedAt = new Date();
          await loc.save();
          enriched++;
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    res.json({ enriched, skipped, total: locations.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
