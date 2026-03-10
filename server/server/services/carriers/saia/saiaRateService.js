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
      originZip,
      destinationZip,
      pickupDate,
      serviceType,
      accountNumber,
    },
    freight: freightItems,
    accessorials,
  };
}

export function normalizeSaiaRateResponse(rawResponse, responseTimeMs) {
  const quoteId = String(
    pick(
      rawResponse?.quoteId,
      rawResponse?.quote_id,
      rawResponse?.rateQuoteId,
      rawResponse?.referenceNumber,
      randomUUID()
    )
  );

  const baseRate = parseCharge(pick(rawResponse?.baseRate, rawResponse?.charges?.linehaul, rawResponse?.linehaulCharge));
  const fuelSurcharge = parseCharge(pick(rawResponse?.fuelSurcharge, rawResponse?.charges?.fuel, rawResponse?.fuelCharge));
  const accessorialTotal = parseCharge(pick(rawResponse?.accessorialTotal, rawResponse?.charges?.accessorials, rawResponse?.accessorialCharges));
  const fallbackTotal = parseCharge(pick(rawResponse?.totalRate, rawResponse?.charges?.total, rawResponse?.totalCharge));
  const totalRate = toMoney(baseRate + fuelSurcharge + accessorialTotal || fallbackTotal);

  const transitDays = Math.max(0, Math.round(Number(pick(rawResponse?.transitDays, rawResponse?.service?.transitDays, 0) || 0)));
  const serviceLevel = String(pick(rawResponse?.serviceLevel, rawResponse?.service?.level, rawResponse?.serviceType, 'STANDARD'));

  return {
    carrier: 'SAIA',
    baseRate,
    fuelSurcharge,
    accessorialTotal,
    totalRate,
    transitDays,
    serviceLevel,
    quoteId,
    responseTimeMs: Math.max(0, Number(responseTimeMs || 0)),
    rawResponse: rawResponse || {},
  };
}

export function toPricingInput(normalizedRate = {}) {
  const totalRate = toMoney(normalizedRate.totalRate || 0);
  const fuelPct = totalRate > 0 ? Number(((Number(normalizedRate.fuelSurcharge || 0) / totalRate) * 100).toFixed(2)) : 0;
  return {
    baseCarrierRate: toMoney(normalizedRate.baseRate || 0),
    fuelPct,
    accessorialTotal: toMoney(normalizedRate.accessorialTotal || 0),
    transitTime: Math.max(0, Number(normalizedRate.transitDays || 0)),
    rawCostInput: totalRate,
  };
}

export function sanitizeQuoteForFrontend(normalizedRate = {}) {
  return {
    carrier: 'SAIA',
    baseRate: toMoney(normalizedRate.baseRate || 0),
    fuelSurcharge: toMoney(normalizedRate.fuelSurcharge || 0),
    accessorialTotal: toMoney(normalizedRate.accessorialTotal || 0),
    totalRate: toMoney(normalizedRate.totalRate || 0),
    transitDays: Math.max(0, Number(normalizedRate.transitDays || 0)),
    serviceLevel: String(normalizedRate.serviceLevel || ''),
    quoteId: String(normalizedRate.quoteId || ''),
    responseTimeMs: Math.max(0, Number(normalizedRate.responseTimeMs || 0)),
  };
}

export async function quoteSaiaRate(internalLoad = {}) {
  const requestPayload = mapInternalLoadToSaiaPayload(internalLoad);
  const raw = await requestSaiaRateQuote(requestPayload);
  const normalizedRate = normalizeSaiaRateResponse(raw.data, raw.responseTimeMs);
  return {
    requestPayload,
    normalizedRate,
  };
}

export async function getSaiaHealthStatus() {
  const startedAt = Date.now();
  const circuit = getSaiaCircuitState();

  if (circuit.state === 'OPEN') {
    return {
      status: 'OFFLINE',
      connectivity: false,
      credentials: 'UNKNOWN',
      responseTimeMs: null,
      thresholdMs: HEALTH_RESPONSE_THRESHOLD_MS,
      circuit,
      checkedAt: new Date().toISOString(),
      reason: 'Circuit breaker is OPEN',
    };
  }

  try {
    const probe = mapInternalLoadToSaiaPayload({
      shipment: {
        originZip: '30301',
        destinationZip: '75001',
        pickupDate: new Date().toISOString().slice(0, 10),
        serviceType: 'standard',
      },
      freightDetails: [{ freightClass: '70', weight: 500, pieces: 1 }],
      accessorials: [],
    });

    const response = await requestSaiaRateQuote(probe, { timeoutMs: process.env.SAIA_TIMEOUT_MS });
    const elapsed = Math.max(1, Number(response.responseTimeMs || Date.now() - startedAt));
    return {
      status: elapsed > HEALTH_RESPONSE_THRESHOLD_MS ? 'DEGRADED' : 'ACTIVE',
      connectivity: true,
      credentials: 'VALID',
      responseTimeMs: elapsed,
      thresholdMs: HEALTH_RESPONSE_THRESHOLD_MS,
      circuit: getSaiaCircuitState(),
      checkedAt: new Date().toISOString(),
      reason: elapsed > HEALTH_RESPONSE_THRESHOLD_MS ? 'Response latency above threshold' : 'Carrier API healthy',
    };
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const statusCode = Number(err?.status || 500);
    const credentials = statusCode === 401 || statusCode === 403 ? 'INVALID' : 'UNKNOWN';

    return {
      status: statusCode === 400 ? 'ACTIVE' : 'OFFLINE',
      connectivity: statusCode === 400,
      credentials,
      responseTimeMs: elapsed > 0 ? elapsed : null,
      thresholdMs: HEALTH_RESPONSE_THRESHOLD_MS,
      circuit: getSaiaCircuitState(),
      checkedAt: new Date().toISOString(),
      reason: err?.message || 'Unable to reach Saia API',
      errorCode: err?.details?.code || null,
    };
  }
}
