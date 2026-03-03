import { randomUUID } from 'crypto';
import { getSaiaCircuitState, requestSaiaRateQuote } from './saiaClient.js';
import {
  mapAccessorialCodes,
  mapServiceType,
  toMoney,
  toPositiveNumber,
} from './saiaTypes.js';

const HEALTH_RESPONSE_THRESHOLD_MS = 2000;

function normalizeZip(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 5);
}

function normalizeDate(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function pick(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function parseCharge(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? toMoney(numeric) : 0;
}

function normalizeFreightItems(items = []) {
  if (!Array.isArray(items) || !items.length) {
    return [
      {
        nmfc: '',
        freightClass: '50',
        weight: 1000,
        pieces: 1,
      },
    ];
  }

  return items.map((item) => {
    const length = toPositiveNumber(item?.length, 0);
    const width = toPositiveNumber(item?.width, 0);
    const height = toPositiveNumber(item?.height, 0);
    return {
      nmfc: String(item?.nmfc || '').trim(),
      freightClass: String(item?.freightClass || item?.class || '50').trim(),
      weight: toPositiveNumber(item?.weight, 0),
      pieces: Math.max(1, Math.round(toPositiveNumber(item?.pieces, 1))),
      ...(length > 0 ? { length } : {}),
      ...(width > 0 ? { width } : {}),
      ...(height > 0 ? { height } : {}),
    };
  });
}

export function mapInternalLoadToSaiaPayload(internal = {}) {
  const shipment = internal?.shipment || internal;
  const originZip = normalizeZip(pick(shipment.originZip, shipment.origin?.zip, shipment.origin?.postalCode));
  const destinationZip = normalizeZip(pick(shipment.destinationZip, shipment.destination?.zip, shipment.destination?.postalCode));
  const pickupDate = normalizeDate(pick(shipment.pickupDate, shipment.pickupAt));
  const serviceType = mapServiceType(pick(shipment.serviceType, shipment.service_level, 'standard'));
  const accountNumber = String(
    pick(shipment.accountNumber, internal?.accountNumber, process.env.SAIA_ACCOUNT_NUMBER || '')
  ).trim();

  const freightItems = normalizeFreightItems(
    pick(shipment.freightDetails, shipment.freight, shipment.freightItems, internal?.freightDetails, [])
  );
  const accessorials = mapAccessorialCodes(
    pick(shipment.accessorials, internal?.accessorials, [])
  );

  return {
    shipment: {
// ...existing code...
